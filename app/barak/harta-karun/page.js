// app/barak/balap-lari/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flag, LogOut, ShieldCheck, XOctagon } from "lucide-react";
import {
  DUEL, DUEL_AVATARS, ANS_KEYS, Shell, SetupCard, ResultCard, TimerPill, CountdownOverlay,
  useBarakEnv, useCountdown, loadSoal, siapkanSoal, shuffle,
} from "../_shared/kit";

/* ============================================================
   PENGATURAN GAME (mudah diubah)
   ============================================================ */
const WAKTU = 300;     // detik (sama dengan mode online)
const FB_OK = 1200;    // jeda setelah jawaban benar (ms)
const FB_BAD = 1800;   // jeda setelah jawaban salah (ms), sedikit lebih lama = penalti

const akurasi = (p) => (p.ok + p.bad ? Math.round((p.ok / (p.ok + p.bad)) * 100) : 0);

function buatGame(soal, target) {
  const pool = soal.map((s) => siapkanSoal(s));
  // Tiap pemain dapat urutan soal berbeda supaya tidak saling mencontek
  const deck = [shuffle(pool), shuffle(pool.map((q) => ({ ...q, opsi: shuffle(q.opsi) })))];
  const mk = () => ({ idx: 0, steps: 0, ok: 0, bad: 0, lock: null });
  return { target, deck, p: [mk(), mk()], over: false };
}
const soalSaatIni = (g, pi) => g.deck[pi][g.p[pi].idx % g.deck[pi].length];

/* ============================================================
   KOMPONEN
   ============================================================ */
function Track({ g, tema }) {
  const av = DUEL_AVATARS[tema] || DUEL_AVATARS.galaxy;
  return (
    <div className="glass-panel w-full h-full min-h-[340px] p-3 md:p-4 flex flex-col shadow-[var(--glow-shadow)]" style={{ border: "2px solid var(--primary)" }}>
      <h3 className="text-center font-black text-[var(--primary)] uppercase tracking-widest text-xs md:text-sm mb-2 flex items-center justify-center gap-2">
        <Flag size={16} /> Sirkuit Duel <Flag size={16} />
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-2 text-center">
        {DUEL.map((pl, i) => (
          <div key={i} className="leading-tight">
            <p className="font-black text-xs md:text-sm" style={{ color: pl.color }}>{pl.nama}</p>
            <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-bold">{g.p[i].steps} / {g.target} langkah</p>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
        {DUEL.map((pl, i) => {
          const prog = Math.min(g.p[i].steps / g.target, 1);
          return (
            <div key={i} className="relative rounded-2xl overflow-hidden bg-black/30" style={{ border: `3px solid ${pl.color}` }}>
              {/* garis finis */}
              <div className="absolute inset-x-0 top-0 h-9 flex items-center justify-center" style={{ background: "repeating-conic-gradient(#fff 0% 25%, #111 0% 50%) 0 0 / 16px 16px" }}>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/80 text-white">FINIS 🏁</span>
              </div>
              {/* penanda langkah */}
              {Array.from({ length: g.target + 1 }).map((_, k) => (
                <div key={k} className="absolute left-3 right-3 border-t border-dashed border-white/15" style={{ bottom: `calc((100% - 2.25rem - 3rem) * ${k / g.target} + 1.5rem)` }} />
              ))}
              {/* pelari */}
              <span
                className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-3xl leading-none shadow-lg"
                style={{ bottom: `calc((100% - 2.25rem - 3rem) * ${prog})`, transition: "bottom 0.9s cubic-bezier(.22,1,.36,1)", background: pl.color, border: "3px solid #fff" }}
              >
                {av[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RacePanel({ pi, g, tema, onAnswer, className = "" }) {
  const pl = DUEL[pi];
  const p = g.p[pi];
  const av = (DUEL_AVATARS[tema] || DUEL_AVATARS.galaxy)[pi];
  const q = soalSaatIni(g, pi);
  const lock = p.lock;

  return (
    <section className={`glass-panel flex flex-col gap-2 md:gap-3 p-3 md:p-4 lg:overflow-y-auto custom-scrollbar ${className}`} style={{ border: `4px solid ${pl.color}` }}>
      <div className="flex items-center gap-2">
        <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-2xl" style={{ border: `2px solid ${pl.color}`, background: `${pl.color}30` }}>{av}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-base leading-tight" style={{ color: pl.color }}>{pl.nama}</h3>
          <p className="text-[10px] text-[var(--text-muted)] font-bold">Tombol jawab {pl.ansLabels[0]}–{pl.ansLabels[3]}</p>
        </div>
        <span key={p.steps} className="score-pop text-3xl md:text-4xl font-black" style={{ color: pl.color }}>{p.steps}<small className="text-sm text-[var(--text-muted)]">/{g.target}</small></span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] md:text-xs font-bold">
        {[["Benar", p.ok, "#34d399"], ["Salah", p.bad, "#fb7185"], ["Akurasi", `${akurasi(p)}%`, ""]].map(([l, v, col]) => (
          <div key={l} className="rounded-lg bg-black/20 py-1">
            <b className="block text-base" style={col ? { color: col } : undefined}>{v}</b>{l}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[220px] rounded-xl bg-black/20 p-3 relative">
        <span className="inline-block text-[10px] font-black px-3 py-1 rounded-full mb-2" style={{ background: pl.color, color: "#05050f" }}>PERTANYAAN #{p.idx + 1}</span>
        <p className="font-bold text-sm md:text-lg leading-snug mb-3">{q.pertanyaan}</p>
        <div className="grid gap-2">
          {q.opsi.map((o, i) => {
            let st;
            if (lock) {
              if (o === q.jawabanBenar) st = { background: "rgba(16,185,129,.35)", borderColor: "#34d399" };
              else if (o === lock.pick) st = { background: "rgba(244,63,94,.35)", borderColor: "#fb7185" };
            }
            return (
              <button key={i} type="button" disabled={!!lock} onClick={() => onAnswer(pi, o)} style={st}
                className="glass-btn flex items-center gap-2 text-left p-3 rounded-xl font-bold text-sm md:text-base active:scale-95 disabled:cursor-default">
                <span className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-xs font-black" style={{ background: pl.color, color: "#05050f" }}>{pl.ansLabels[i]}</span>
                <span className="min-w-0">{o}</span>
              </button>
            );
          })}
        </div>

        {lock && (
          <div className={`mt-3 rounded-xl p-2.5 text-center font-black text-sm animate-popIn flex items-center justify-center gap-2 ${lock.ok ? "bg-emerald-500/25 text-emerald-300" : "bg-rose-500/25 text-rose-300"}`}>
            {lock.ok ? <><ShieldCheck size={18} /> LARI 1 LANGKAH! 🏃💨</> : <><XOctagon size={18} /> TETAP DI TEMPAT! ❌</>}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   HALAMAN
   ============================================================ */
export default function BalapLariDuel() {
  const router = useRouter();
  const env = useBarakEnv();

  const [phase, setPhase] = useState("setup");
  const [tingkat, setTingkat] = useState("Mudah");
  const [jumlah, setJumlah] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [g, setG] = useState(null);
  const [timeLeft, setTimeLeft] = useState(WAKTU);
  const [result, setResult] = useState(null);

  const gRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const endedRef = useRef(false);
  const timers = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const commit = (n) => { gRef.current = n; setG(n); };
  useEffect(() => () => clearTimers(), []);

  const count = useCountdown(phase === "countdown", () => setPhase("playing"));

  const selesai = (alasan) => {
    const cur = gRef.current;
    if (!cur || endedRef.current) return;
    endedRef.current = true;
    const [a, b] = cur.p;
    let w = -1;
    if (a.steps !== b.steps) w = a.steps > b.steps ? 0 : 1;
    else if (akurasi(a) !== akurasi(b)) w = akurasi(a) > akurasi(b) ? 0 : 1;
    setResult({ winner: w, reason: alasan });
    setPhase("finished");
  };

  const jawab = (pi, opsi) => {
    const cur = gRef.current;
    if (!cur || cur.over || endedRef.current || phaseRef.current !== "playing") return;
    const pl = cur.p[pi];
    if (pl.lock) return;
    const q = soalSaatIni(cur, pi);
    const benar = opsi === q.jawabanBenar;
    const steps = pl.steps + (benar ? 1 : 0);
    const menang = steps >= cur.target;
    commit({
      ...cur,
      over: menang,
      p: cur.p.map((x, i) => (i === pi
        ? { ...x, lock: { ok: benar, pick: opsi }, steps, ok: x.ok + (benar ? 1 : 0), bad: x.bad + (benar ? 0 : 1) }
        : x)),
    });
    if (menang) {
      later(() => selesai(`${DUEL[pi].nama} sampai di garis finis!`), 1100);
    } else {
      later(() => {
        const c2 = gRef.current;
        if (!c2) return;
        commit({ ...c2, p: c2.p.map((x, i) => (i === pi ? { ...x, lock: null, idx: x.idx + 1 } : x)) });
      }, benar ? FB_OK : FB_BAD);
    }
  };

  const mulai = async () => {
    setLoading(true);
    setError("");
    try {
      const semua = await loadSoal(tingkat);
      if (semua.length === 0) { setError("Soal tidak ditemukan untuk tingkat ini!"); return; }
      clearTimers();
      endedRef.current = false;
      commit(buatGame(semua, jumlah));
      setTimeLeft(WAKTU);
      setResult(null);
      setPhase("countdown");
    } catch (e) {
      setError("Gagal memuat soal: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const keluar = () => { if (confirm("Yakin ingin keluar? Pertandingan akan dibatalkan.")) router.push("/dashboard"); };

  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) selesai("Waktu 5 menit habis!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e) => {
      const t = ANS_KEYS[e.key];
      if (!t) return;
      e.preventDefault();
      const cur = gRef.current;
      if (!cur) return;
      const o = soalSaatIni(cur, t[0]).opsi[t[1]];
      if (o !== undefined) jawab(t[0], o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!env.ready) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-[#00f3ff] font-black tracking-widest animate-pulse">MEMUAT ARENA...</div>;
  }

  const showGame = (phase === "countdown" || phase === "playing") && g;

  return (
    <Shell env={env} pauseMusic={phase === "playing"}>
      {phase === "setup" && (
        <SetupCard
          title="Duel Balap Lari"
          tagline="Jawab cepat dan tepat, majukan karaktermu ke garis finis!"
          Icon={Flag}
          tema={env.tema}
          controls={["Jawab: tap panel kiri atau tombol 1 2 3 4", "Jawab: tap panel kanan atau tombol 7 8 9 0"]}
          rules={[
            "Kedua pemain berlomba di lintasan masing-masing, dan soal muncul di panel masing-masing.",
            "Jawaban benar: karaktermu maju 1 langkah.",
            "Jawaban salah: karaktermu tetap di tempat dan harus menunggu sebentar.",
            "Pemain yang lebih dulu mencapai garis finis menang.",
            "Jika waktu 5 menit habis, pemain dengan langkah terbanyak yang menang (seri: akurasi).",
          ]}
          tingkat={tingkat}
          onTingkat={setTingkat}
          extra={{ label: "Langkah Menuju Finis", value: jumlah, onChange: setJumlah, options: [{ value: 5, label: "5" }, { value: 10, label: "10" }, { value: 15, label: "15" }] }}
          onStart={mulai}
          startLabel="MULAI BALAPAN!"
          loading={loading}
          error={error}
          onBack={() => router.push("/dashboard")}
        />
      )}

      {showGame && (
        <>
          <header className="relative z-20 shrink-0 flex items-center justify-between gap-2 px-3 md:px-6 py-2 glass-panel" style={{ borderRadius: 0, borderWidth: "0 0 2px 0" }}>
            <div className="min-w-0">
              <p className="font-black text-sm md:text-base truncate">Duel Balap Lari</p>
              <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-bold">{tingkat} · Finis di langkah ke-{g.target}</p>
            </div>
            <TimerPill sisa={timeLeft} />
            <button onClick={keluar} className="glass-btn px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:!border-red-400 hover:text-red-400">
              <LogOut size={14} /> Keluar
            </button>
          </header>

          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-2 md:p-3">
            <div className="mx-auto w-full max-w-[1500px] lg:h-full grid grid-cols-2 lg:grid-cols-[minmax(0,32fr)_minmax(0,36fr)_minmax(0,32fr)] lg:grid-rows-1 gap-2 md:gap-3">
              <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 min-h-0 h-[46dvh] lg:h-full">
                <Track g={g} tema={env.tema} />
              </div>
              <RacePanel pi={0} g={g} tema={env.tema} onAnswer={jawab} className="lg:col-start-1 lg:row-start-1 lg:h-full" />
              <RacePanel pi={1} g={g} tema={env.tema} onAnswer={jawab} className="lg:col-start-3 lg:row-start-1 lg:h-full" />
            </div>
          </div>
        </>
      )}

      {phase === "countdown" && <CountdownOverlay count={count} />}

      {phase === "finished" && g && result && (
        <ResultCard
          tema={env.tema}
          winner={result.winner}
          reason={result.reason}
          rows={[
            ["Langkah", `${g.p[0].steps}/${g.target}`, `${g.p[1].steps}/${g.target}`],
            ["Jawaban Benar", g.p[0].ok, g.p[1].ok],
            ["Jawaban Salah", g.p[0].bad, g.p[1].bad],
            ["Akurasi", `${akurasi(g.p[0])}%`, `${akurasi(g.p[1])}%`],
          ]}
          onAgain={() => setPhase("setup")}
          onBack={() => router.push("/dashboard")}
        />
      )}
    </Shell>
  );
}
