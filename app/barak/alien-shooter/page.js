// app/barak/alien-shooter/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, LogOut } from "lucide-react";
import {
  DUEL, DUEL_AVATARS, ANS_KEYS, Shell, SetupCard, ResultCard, TimerPill, CountdownOverlay,
  useBarakEnv, useCountdown, loadSoal, siapkanSoal, shuffle, pick,
} from "../_shared/kit";

/* ============================================================
   PENGATURAN GAME (sama dengan mode online)
   ============================================================ */
const ALIEN_CFG = {
  Mudah: { rate: 5000, v: 0.6, amp: 0.06, fr: 90 },
  Sedang: { rate: 4000, v: 0.9, amp: 0.09, fr: 70 },
  Sulit: { rate: 3000, v: 1.3, amp: 0.12, fr: 55 },
};
const ENEMY_EMOJI = {
  galaxy: ["👽", "👾", "🛸", "🦑", "🐙"],
  ocean: ["🦑", "🐙", "🦈", "🦀", "🐡"],
  sky: ["🎈", "🪁", "☁️", "🦅", "🛸"],
};
const LETTERS = ["A", "B", "C", "D"];
const LETTER_COLORS = ["#2de2e6", "#ffd23f", "#5cf2a0", "#ff5d73"];
const LETTER_SHADOWS = ["#12929a", "#c29500", "#1e9e63", "#b02a43"];

const ALIEN_CSS = `
.hud-bar { background: var(--glass-bg); backdrop-filter: blur(12px); border-bottom: 2px solid var(--glass-border); }
.al-card { position: absolute; top: 0; left: 0; width: min(90%, 270px); padding: .4rem .5rem .5rem; border-radius: 1rem; text-align: center; color: #1a1040; background: linear-gradient(180deg, #fff, #e9e4ff); border: 3px solid var(--c); box-shadow: 0 0 16px var(--c), 0 5px 0 rgba(0,0,0,.25); will-change: transform; z-index: 5; }
.al-emoji { font-size: clamp(1.3rem, 3.4vh, 2.2rem); line-height: 1.1; }
.al-q { font-weight: 800; font-size: clamp(.72rem, 1vw + .3rem, 1.1rem); line-height: 1.25; margin: .1rem 0 .35rem; }
.al-opts { display: grid; gap: .25rem; text-align: left; }
.al-opt { display: flex; align-items: center; gap: .4rem; border-radius: .6rem; padding: .15rem .4rem; font-weight: 700; font-size: clamp(.65rem, .8vw + .25rem, .95rem); line-height: 1.15; background: rgba(26,16,64,.08); border: 2px solid rgba(26,16,64,.12); }
.al-opt b { flex: none; width: 1.5em; height: 1.5em; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #1a1040; font-size: .9em; }
.al-opt.wrong { opacity: .35; text-decoration: line-through; }
.beam { position: absolute; height: 6px; border-radius: 6px; background: #fff; box-shadow: 0 0 14px 5px var(--c); transform-origin: 0 50%; animation: beamFade .28s ease-out forwards; pointer-events: none; z-index: 4; }
@keyframes beamFade { from { opacity: 1; } to { opacity: 0; } }
.boom { position: absolute; font-size: 2.4rem; line-height: 1; text-align: center; transform: translate(-50%, -50%); animation: boomPop .6s ease-out forwards; pointer-events: none; z-index: 6; }
.boom small { display: block; font-size: 1.05rem; font-weight: 900; color: #5cf2a0; text-shadow: 0 0 6px #000; }
.boom.bad small { color: #ff5d73; }
@keyframes boomPop { from { transform: translate(-50%, -50%) scale(.4); opacity: 1; } to { transform: translate(-50%, -110%) scale(1.4); opacity: 0; } }
.ab-btn { position: relative; height: clamp(54px, 11dvh, 100px); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 0; border-radius: .9rem; font-weight: 900; font-size: clamp(1.4rem, 4vh, 2.6rem); line-height: 1; color: #1a1040; cursor: pointer; touch-action: manipulation; transition: transform .08s, box-shadow .08s; box-shadow: 0 .3rem 0 var(--sh); }
.ab-btn small { font-size: .3em; font-weight: 800; opacity: .65; margin-top: .15em; }
.ab-btn:active { transform: translateY(.3rem); box-shadow: none; }
.ab-btn:disabled { opacity: .45; cursor: not-allowed; }
`;

const akurasi = (p) => (p.ok + p.bad ? Math.round((p.ok / (p.ok + p.bad)) * 100) : 0);
const hearts = (hp) => "❤️".repeat(Math.max(0, hp)) + "🖤".repeat(Math.max(0, 3 - hp));
const mkPlayer = () => ({ aliens: [], lasers: [], fx: [], hp: 3, score: 0, ok: 0, bad: 0, seq: 0, next: 0, deck: [], over: false, shakeUntil: 0, badBtn: -1, badUntil: 0 });

/* ============================================================
   HALAMAN
   ============================================================ */
export default function AlienShooterDuel() {
  const router = useRouter();
  const env = useBarakEnv();

  const [phase, setPhase] = useState("setup");
  const [tingkat, setTingkat] = useState("Mudah");
  const [durasi, setDurasi] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [result, setResult] = useState(null);
  const [, setTick] = useState(0);

  const S = useRef(null);            // [statePemain1, statePemain2], dimutasi langsung oleh game loop
  const zones = useRef([null, null]);
  const poolRef = useRef([]);
  const cfgRef = useRef(ALIEN_CFG.Mudah);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const endedRef = useRef(false);
  const timers = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const enemies = ENEMY_EMOJI[env.tema] || ENEMY_EMOJI.galaxy;
  const avatars = DUEL_AVATARS[env.tema] || DUEL_AVATARS.galaxy;
  const count = useCountdown(phase === "countdown", () => setPhase("playing"));

  /* ---------- logika game ---------- */
  const akhiri = (alasan, delay = 0) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const [a, b] = S.current;
    let w;
    if (a.hp <= 0 && b.hp > 0) w = 1;
    else if (b.hp <= 0 && a.hp > 0) w = 0;
    else w = a.score > b.score ? 0 : b.score > a.score ? 1 : -1;
    setResult({ winner: w, reason: alasan });
    setTimeout(() => setPhase("finished"), delay);
  };

  const spawn = (i) => {
    const p = S.current[i];
    const pool = poolRef.current;
    if (!pool.length) return;
    if (!p.deck.length) p.deck = shuffle(pool.map((_, k) => k));
    const q = siapkanSoal(pool[p.deck.pop()]);
    p.aliens.push({ id: ++p.seq, q, emoji: pick(enemies), x: 0, y: 0, h: 0, w: 0, x0: 0, amp: 0, ph: Math.random() * 6.28, wrong: [], el: null });
  };

  const hurt = (i) => {
    const p = S.current[i];
    p.hp = Math.max(0, p.hp - 1);
    p.shakeUntil = performance.now() + 350;
    if (p.hp <= 0) {
      p.over = true;
      p.aliens = [];
      akhiri(`Nyawa ${DUEL[i].nama} habis!`, 900);
    }
  };

  const answer = (i, k) => {
    if (endedRef.current || phaseRef.current !== "playing") return;
    const p = S.current[i];
    const zone = zones.current[i];
    if (!p || p.over || !zone) return;
    // jawaban selalu menyasar alien paling bawah yang sudah terlihat
    let target = null;
    p.aliens.forEach((a) => { if (a.h && a.y + a.h > 0 && (!target || a.y > target.y)) target = a; });
    if (!target) return;
    const pilihan = target.q.opsi[k];
    if (pilihan === undefined || target.wrong.includes(k)) return;
    const tx = target.x, ty = target.y + target.h / 2;
    const fxId = ++p.seq;
    if (pilihan === target.q.jawabanBenar) {
      p.score += 10;
      p.ok += 1;
      p.aliens = p.aliens.filter((a) => a !== target);
      const cx = zone.clientWidth / 2, cy = zone.clientHeight - 40;
      p.lasers.push({ id: fxId, cx, cy, len: Math.hypot(tx - cx, ty - cy), ang: (Math.atan2(ty - cy, tx - cx) * 180) / Math.PI });
      p.fx.push({ id: fxId, x: tx, y: ty, txt: "💥", pts: "+10", bad: false });
      later(() => { p.lasers = p.lasers.filter((l) => l.id !== fxId); }, 300);
    } else {
      p.score = Math.max(0, p.score - 5);
      p.bad += 1;
      target.wrong.push(k);
      p.badBtn = k;
      p.badUntil = performance.now() + 300;
      p.fx.push({ id: fxId, x: tx, y: ty, txt: "💢", pts: "-5", bad: true });
    }
    later(() => { p.fx = p.fx.filter((f) => f.id !== fxId); }, 650);
  };

  const mulai = async () => {
    setLoading(true);
    setError("");
    try {
      const semua = await loadSoal(tingkat);
      if (semua.length === 0) { setError("Soal tidak ditemukan untuk tingkat ini!"); return; }
      clearTimers();
      endedRef.current = false;
      poolRef.current = semua; // bank soal: seluruh soal tingkat ini
      cfgRef.current = ALIEN_CFG[tingkat] || ALIEN_CFG.Mudah;
      S.current = [mkPlayer(), mkPlayer()];
      setTimeLeft(durasi * 60);
      setResult(null);
      setPhase("countdown");
    } catch (e) {
      setError("Gagal memuat soal: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const keluar = () => { if (confirm("Yakin ingin keluar? Pertandingan akan dibatalkan.")) router.push("/dashboard"); };

  /* ---------- timer ---------- */
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) akhiri("Waktu habis!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  /* ---------- game loop ---------- */
  useEffect(() => {
    if (phase !== "playing") return;
    const players = S.current;
    let raf;
    let last = performance.now();
    players.forEach((p) => { p.next = last + 600; });

    const loop = (t) => {
      const ms = Math.min(t - last, 50);
      last = t;
      const dt = ms / 16.67;
      const cfg = cfgRef.current;

      if (!endedRef.current) {
        players.forEach((p, i) => {
          const zone = zones.current[i];
          if (!zone || p.over) return;
          const H = zone.clientHeight, Wz = zone.clientWidth;
          const v = ((cfg.v * H) / 700) * dt;
          for (let k = p.aliens.length - 1; k >= 0; k--) {
            const a = p.aliens[k];
            if (!a.h) {
              // ukur kartu setelah dirender, lalu mulai turun dari luar layar
              if (!a.el) continue;
              a.h = a.el.offsetHeight; a.w = a.el.offsetWidth;
              a.amp = Math.min(cfg.amp * Wz, Math.max(0, (Wz - a.w) / 2));
              a.x0 = a.w / 2 + a.amp + Math.random() * Math.max(0, Wz - a.w - 2 * a.amp);
              a.y = -a.h;
              continue;
            }
            a.y += v;
            a.x = a.x0 + Math.sin(a.y / cfg.fr + a.ph) * a.amp;
            if (a.y + a.h >= H) { p.aliens.splice(k, 1); hurt(i); }
          }
          // soal baru hanya muncul jika alien sebelumnya sudah turun cukup jauh
          if (!p.over && !endedRef.current && t >= p.next && p.aliens.every((a) => a.h && a.y >= a.h * 0.25 + 14)) {
            spawn(i);
            p.next = t + cfg.rate;
          }
        });
      }
      setTick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e) => {
      const t = ANS_KEYS[e.key];
      if (!t) return;
      e.preventDefault();
      answer(t[0], t[1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---------- render ---------- */
  if (!env.ready) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-[#00f3ff] font-black tracking-widest animate-pulse">MEMUAT ARENA...</div>;
  }

  const inGame = (phase === "countdown" || phase === "playing") && S.current;
  const now = typeof performance !== "undefined" ? performance.now() : 0;

  const hudPlayer = (i) => {
    const p = S.current[i];
    const pl = DUEL[i];
    return (
      <div className={`flex items-center gap-2 min-w-0 ${i === 1 ? "flex-row-reverse text-right" : ""}`}>
        <span className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center text-2xl md:text-3xl" style={{ border: `2px solid ${pl.color}`, background: `${pl.color}30` }}>{avatars[i]}</span>
        <div className="min-w-0">
          <p className="font-black text-sm md:text-base truncate" style={{ color: pl.color }}>{pl.nama}</p>
          <p className="text-sm md:text-lg tracking-widest leading-tight">{hearts(p.hp)}</p>
        </div>
        <p className="font-black text-xl md:text-3xl leading-none" style={{ color: pl.color }}>
          <span key={p.score} className="score-pop">{p.score}</span>
          <small className="text-[10px] md:text-xs ml-1 text-[var(--text-muted)]">Pts</small>
        </p>
      </div>
    );
  };

  const side = (i) => {
    const p = S.current[i];
    const pl = DUEL[i];
    return (
      <div key={i} className="relative flex-1 min-w-0 flex flex-col" style={{ "--c": pl.color, borderLeft: i === 1 ? "4px dashed rgba(255,255,255,.25)" : "none" }}>
        <div ref={(el) => { zones.current[i] = el; }} className={`relative flex-1 min-h-0 overflow-hidden ${now < p.shakeUntil ? "shake" : ""}`}>
          <div className="absolute inset-x-0 bottom-0 h-[7%] bg-gradient-to-t from-rose-500/40 to-transparent pointer-events-none" />

          {p.aliens.map((a) => (
            <div key={a.id} ref={(el) => { a.el = el; }} className="al-card" style={{ transform: `translate(${a.x - a.w / 2}px, ${a.y}px)`, opacity: a.h ? 1 : 0 }}>
              <div className="al-emoji">{a.emoji}</div>
              <p className="al-q">{a.q.pertanyaan}</p>
              <div className="al-opts">
                {a.q.opsi.map((o, k) => (
                  <div key={k} className={`al-opt ${a.wrong.includes(k) ? "wrong" : ""}`}>
                    <b style={{ background: LETTER_COLORS[k] }}>{LETTERS[k]}</b>
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {p.lasers.map((l) => (
            <div key={l.id} className="beam" style={{ left: l.cx, top: l.cy, width: l.len, transform: `rotate(${l.ang}deg)` }} />
          ))}
          {p.fx.map((f) => (
            <div key={f.id} className={`boom ${f.bad ? "bad" : ""}`} style={{ left: f.x, top: f.y }}>
              {f.txt}<small>{f.pts}</small>
            </div>
          ))}

          {/* penembak */}
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 z-[3]">
            <span className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full text-2xl md:text-3xl" style={{ border: `2px solid ${pl.color}`, background: `${pl.color}40`, boxShadow: `0 0 16px ${pl.color}` }}>{avatars[i]}</span>
          </div>

          {p.over && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="text-5xl mb-2">💀</div>
              <h2 className="text-xl md:text-3xl font-black text-rose-400">{pl.nama} KALAH!</h2>
            </div>
          )}
        </div>

        <div className="shrink-0 hud-bar px-2 md:px-3 py-2" style={{ borderBottom: "none", borderTop: `3px solid ${pl.color}` }}>
          <div className="mx-auto w-full max-w-md grid grid-cols-4 gap-2">
            {LETTERS.map((L, k) => (
              <button
                key={L}
                type="button"
                onClick={() => answer(i, k)}
                disabled={p.over}
                className={`ab-btn ${p.badBtn === k && now < p.badUntil ? "shake" : ""}`}
                style={{ background: LETTER_COLORS[k], "--sh": LETTER_SHADOWS[k] }}
              >
                {L}
                <small>tombol {pl.ansLabels[k]}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Shell env={env} pauseMusic={phase === "playing"} extraCss={ALIEN_CSS}>
      {phase === "setup" && (
        <SetupCard
          title="Duel Alien Shooter"
          tagline="Tembak alien pembawa soal sebelum mendarat. Siapa paling tangguh?"
          Icon={Crosshair}
          tema={env.tema}
          controls={["Layar kiri · tombol 1 2 3 4", "Layar kanan · tombol 7 8 9 0"]}
          rules={[
            "Layar dibagi dua: Pemain 1 di kiri, Pemain 2 di kanan. Alien turun membawa soal di layar masing-masing.",
            "Tekan tombol A B C D di bawah layarmu untuk menjawab alien yang paling bawah.",
            "Jawaban benar: alien tertembak, +10 poin. Jawaban salah: -5 poin.",
            "Alien yang mendarat mengurangi 1 nyawa ❤️ (masing-masing punya 3).",
            "Jika salah satu pemain kehabisan nyawa, lawannya langsung menang.",
            "Jika waktu habis, skor tertinggi menang. Skor sama = seri.",
          ]}
          tingkat={tingkat}
          onTingkat={setTingkat}
          extra={{ label: "Durasi Pertempuran", value: durasi, onChange: setDurasi, options: [{ value: 2, label: "2 Menit" }, { value: 3, label: "3 Menit" }, { value: 5, label: "5 Menit" }] }}
          onStart={mulai}
          startLabel="MULAI PERTEMPURAN!"
          loading={loading}
          error={error}
          onBack={() => router.push("/dashboard")}
        />
      )}

      {inGame && (
        <div className="absolute inset-0 z-10 flex flex-col">
          <div className="hud-bar shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4 px-3 md:px-6 py-2">
            {hudPlayer(0)}
            <div className="flex items-center gap-2">
              <TimerPill sisa={timeLeft} />
              <button onClick={keluar} aria-label="Keluar" className="glass-btn p-2 rounded-xl hover:!border-red-400 hover:text-red-400"><LogOut size={16} /></button>
            </div>
            {hudPlayer(1)}
          </div>
          <div className="flex-1 min-h-0 flex">
            {side(0)}
            {side(1)}
          </div>
        </div>
      )}

      {phase === "countdown" && <CountdownOverlay count={count} />}

      {phase === "finished" && S.current && result && (
        <ResultCard
          tema={env.tema}
          winner={result.winner}
          reason={result.reason}
          rows={[
            ["Skor Akhir", S.current[0].score, S.current[1].score],
            ["Nyawa Tersisa", hearts(S.current[0].hp), hearts(S.current[1].hp)],
            ["Jawaban Benar", S.current[0].ok, S.current[1].ok],
            ["Jawaban Salah", S.current[0].bad, S.current[1].bad],
            ["Akurasi", `${akurasi(S.current[0])}%`, `${akurasi(S.current[1])}%`],
          ]}
          onAgain={() => setPhase("setup")}
          onBack={() => router.push("/dashboard")}
        />
      )}
    </Shell>
  );
}
