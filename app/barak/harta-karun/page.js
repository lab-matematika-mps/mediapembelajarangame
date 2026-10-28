// app/barak/harta-karun/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Gift, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Star, LogOut } from "lucide-react";
import {
  DUEL, DUEL_AVATARS, ANS_KEYS, Shell, SetupCard, ResultCard, TimerPill, CountdownOverlay,
  useBarakEnv, useCountdown, loadSoal, siapkanSoal,
} from "../_shared/kit";

/* ============================================================
   PENGATURAN GAME (mudah diubah)
   ============================================================ */
const MAP_SIZE = { 5: 7, 10: 9, 15: 11 }; // jumlah peti -> ukuran peta (kotak)
const WAKTU = 300;   // detik (sama dengan mode online: 5 menit)
const POIN = 10;
const FB_MS = 1800;  // lama umpan balik jawaban

// Tombol gerak keyboard: [pemain, dx, dy]. Pemain 1 = WASD, Pemain 2 = panah
const MOVE_KEYS = {
  w: [0, 0, -1], s: [0, 0, 1], a: [0, -1, 0], d: [0, 1, 0],
  ArrowUp: [1, 0, -1], ArrowDown: [1, 0, 1], ArrowLeft: [1, -1, 0], ArrowRight: [1, 1, 0],
};

/* ============================================================
   HELPER STATE (immutable)
   ============================================================ */
const rand = (n) => Math.floor(Math.random() * n);
const patchP = (g, i, patch) => ({ ...g, p: g.p.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
const patchChest = (g, id, patch) => ({ ...g, chests: g.chests.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
const akurasi = (p) => (p.ok + p.bad ? Math.round((p.ok / (p.ok + p.bad)) * 100) : 0);

function buatGame(soal, jumlah) {
  const size = MAP_SIZE[jumlah] || 9;
  const total = Math.min(jumlah, soal.length);
  const used = new Set(["0,0", `${size - 1},${size - 1}`]); // posisi awal pemain
  const chests = soal.slice(0, total).map((s, i) => {
    let x, y;
    do { x = rand(size); y = rand(size); } while (used.has(`${x},${y}`));
    used.add(`${x},${y}`);
    return { id: i, x, y, q: siapkanSoal(s), status: "available", by: null };
  });
  const mk = (x, y) => ({ x, y, score: 0, chests: 0, ok: 0, bad: 0, state: "idle", chest: null, pick: null, note: "" });
  return { size, total, opened: 0, chests, p: [mk(0, 0), mk(size - 1, size - 1)], over: false };
}

// Pemain yang salah jawab terpental menjauh dari peti
function knock(g, pi, c) {
  const other = g.p[1 - pi];
  const blocked = (x, y) =>
    x < 0 || y < 0 || x >= g.size || y >= g.size ||
    (other.x === x && other.y === y) ||
    g.chests.some((k) => k.status !== "opened" && k.x === x && k.y === y);
  for (let d = 2; d <= g.size * 2; d++) {
    const cand = [];
    for (let dx = -d; dx <= d; dx++) {
      const r = d - Math.abs(dx);
      [r, -r].forEach((dy, i) => {
        if (i === 1 && r === 0) return;
        const x = c.x + dx, y = c.y + dy;
        if (!blocked(x, y)) cand.push([x, y]);
      });
    }
    if (cand.length) return cand[rand(cand.length)];
  }
  return [g.p[pi].x, g.p[pi].y];
}

/* ============================================================
   KOMPONEN
   ============================================================ */
function DPad({ color, onMove }) {
  const iv = useRef(null);
  const stop = () => { if (iv.current) { clearInterval(iv.current); iv.current = null; } };
  useEffect(() => stop, []);
  const press = (dx, dy) => (e) => {
    e.preventDefault();
    stop();
    onMove(dx, dy);
    iv.current = setInterval(() => onMove(dx, dy), 180); // tahan tombol = jalan terus
  };
  const btn = (dx, dy, Icon, pos) => (
    <button
      type="button"
      onPointerDown={press(dx, dy)}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`${pos} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white active:scale-90 touch-none`}
      style={{ background: color, boxShadow: "0 5px 0 rgba(0,0,0,.35)" }}
    >
      <Icon size={30} />
    </button>
  );
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1.5 justify-center mx-auto w-fit">
      {btn(0, -1, ChevronUp, "col-start-2 row-start-1")}
      {btn(-1, 0, ChevronLeft, "col-start-1 row-start-2")}
      <div className="col-start-2 row-start-2 flex items-center justify-center opacity-60" style={{ color }}><Star size={22} fill="currentColor" /></div>
      {btn(1, 0, ChevronRight, "col-start-3 row-start-2")}
      {btn(0, 1, ChevronDown, "col-start-2 row-start-3")}
    </div>
  );
}

function PlayerPanel({ pi, p, g, tema, onAnswer, onMove, className = "" }) {
  const pl = DUEL[pi];
  const av = (DUEL_AVATARS[tema] || DUEL_AVATARS.galaxy)[pi];
  const c = p.chest !== null ? g.chests[p.chest] : null;
  const resolving = p.state === "resolving" && c;
  const benar = resolving && p.pick === c.q.jawabanBenar;

  return (
    <section className={`glass-panel flex flex-col gap-2 md:gap-3 p-3 md:p-4 lg:overflow-y-auto custom-scrollbar ${className}`} style={{ border: `4px solid ${pl.color}` }}>
      <div className="flex items-center gap-2">
        <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-2xl" style={{ border: `2px solid ${pl.color}`, background: `${pl.color}30` }}>{av}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-base leading-tight" style={{ color: pl.color }}>{pl.nama}</h3>
          <p className="text-[10px] text-[var(--text-muted)] font-bold">{pi === 0 ? "W A S D" : "Tombol Panah"} · Jawab {pl.ansLabels[0]}–{pl.ansLabels[3]}</p>
        </div>
        <span key={p.score} className="score-pop text-3xl md:text-4xl font-black" style={{ color: pl.color }}>{p.score}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] md:text-xs font-bold">
        {[["Peti", p.chests, ""], ["Benar", p.ok, "#34d399"], ["Salah", p.bad, "#fb7185"], ["Akurasi", `${akurasi(p)}%`, ""]].map(([l, v, col]) => (
          <div key={l} className="rounded-lg bg-black/20 py-1">
            <b className="block text-base" style={col ? { color: col } : undefined}>{v}</b>{l}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[150px] rounded-xl bg-black/20 p-3 overflow-y-auto" style={{ border: c ? `2px solid ${pl.color}` : "2px solid transparent" }}>
        {!c ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-[var(--text-muted)] font-bold text-sm">
            <Gift size={32} className="opacity-60" />
            Jelajahi peta dan temukan peti harta karun!
          </div>
        ) : (
          <div className="animate-fadeIn">
            <span className="inline-block text-[10px] font-black px-3 py-1 rounded-full mb-2" style={{ background: pl.color, color: "#05050f" }}>SOAL HARTA KARUN</span>
            <p className="font-bold text-sm md:text-base leading-snug mb-3">{c.q.pertanyaan}</p>
            <div className="grid gap-2">
              {c.q.opsi.map((o, i) => {
                let st;
                if (resolving) {
                  if (o === c.q.jawabanBenar) st = { background: "rgba(16,185,129,.35)", borderColor: "#34d399" };
                  else if (o === p.pick) st = { background: "rgba(244,63,94,.35)", borderColor: "#fb7185" };
                }
                return (
                  <button key={i} type="button" disabled={!!resolving} onClick={() => onAnswer(pi, o)} style={st}
                    className="glass-btn flex items-center gap-2 text-left p-2.5 rounded-xl font-bold text-sm active:scale-95 disabled:cursor-default">
                    <span className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-black" style={{ background: pl.color, color: "#05050f" }}>{pl.ansLabels[i]}</span>
                    <span className="min-w-0">{o}</span>
                  </button>
                );
              })}
            </div>
            {resolving && (
              <div className={`mt-3 rounded-xl p-2.5 text-center font-black text-sm animate-popIn ${benar ? "bg-emerald-500/25 text-emerald-300" : "bg-rose-500/25 text-rose-300"}`}>
                {benar ? `HARTA DIDAPAT! 🎉 +${POIN} Poin` : "BELUM TEPAT! ❌ Kamu terpental dari peti"}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="min-h-[1.25rem] text-center text-xs font-black text-rose-400">{p.note}</p>
      <DPad color={pl.color} onMove={(dx, dy) => onMove(pi, dx, dy)} />
    </section>
  );
}

function MapView({ g, tema }) {
  const av = DUEL_AVATARS[tema] || DUEL_AVATARS.galaxy;
  const u = 100 / g.size;
  return (
    <div className="mapbox relative aspect-square glass-panel overflow-hidden shadow-[var(--glow-shadow)]" style={{ width: "min(100%, calc(100dvh - 8.5rem))", border: "3px solid var(--primary)" }}>
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${g.size}, 1fr)`, gridTemplateRows: `repeat(${g.size}, 1fr)` }}>
        {Array.from({ length: g.size * g.size }).map((_, i) => (
          <div key={i} className={`border border-white/5 ${(Math.floor(i / g.size) + (i % g.size)) % 2 === 0 ? "bg-white/5" : ""}`} />
        ))}
      </div>

      {g.chests.map((c) => c.status !== "opened" && (
        <div key={c.id} className="absolute flex items-center justify-center transition-all duration-300" style={{ left: `${c.x * u}%`, top: `${c.y * u}%`, width: `${u}%`, height: `${u}%` }}>
          <div className={`relative w-full h-full flex items-center justify-center ${c.status === "claimed" ? "scale-90" : "animate-bounce"}`}>
            {c.status === "available" && <div className="absolute inset-[15%] bg-amber-400 blur-md opacity-40 rounded-full" />}
            <Gift style={{ width: "62%", height: "62%", color: c.status === "claimed" ? DUEL[c.by].color : "#fbbf24" }} className="relative z-10 drop-shadow-lg" />
          </div>
        </div>
      ))}

      {g.p.map((p, i) => (
        <div key={i} className="absolute flex flex-col items-center justify-center transition-all duration-300 z-20" style={{ left: `${p.x * u}%`, top: `${p.y * u}%`, width: `${u}%`, height: `${u}%` }}>
          <div className="w-[84%] h-[84%] rounded-full flex items-center justify-center leading-none shadow-lg" style={{ background: `${DUEL[i].color}`, border: "2px solid #fff", fontSize: `${u * 0.5}cqw` }}>
            {av[i]}
          </div>
          <span className="absolute font-black px-1 rounded whitespace-nowrap bg-black/80 text-white" style={{ bottom: "-14%", fontSize: `clamp(7px, ${u * 0.26}cqw, 12px)` }}>P{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   HALAMAN
   ============================================================ */
export default function HartaKarunDuel() {
  const router = useRouter();
  const env = useBarakEnv();

  const [phase, setPhase] = useState("setup"); // setup | countdown | playing | finished
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

  /* ---------- aksi ---------- */
  const catat = (pi, text) => {
    const cur = gRef.current;
    if (!cur || cur.p[pi].note === text) return;
    commit(patchP(cur, pi, { note: text }));
    later(() => {
      const c2 = gRef.current;
      if (c2 && c2.p[pi].note === text) commit(patchP(c2, pi, { note: "" }));
    }, 2000);
  };

  const move = (pi, dx, dy) => {
    const g0 = gRef.current;
    if (!g0 || g0.over || endedRef.current || phaseRef.current !== "playing") return;
    const me = g0.p[pi];
    if (me.state !== "idle") return;
    const nx = me.x + dx, ny = me.y + dy;
    if (nx < 0 || ny < 0 || nx >= g0.size || ny >= g0.size) return;
    const other = g0.p[1 - pi];
    if (other.x === nx && other.y === ny) return;
    const c = g0.chests.find((k) => k.x === nx && k.y === ny && k.status !== "opened");
    if (c && c.status === "claimed") { catat(pi, `Peti sedang dikerjakan ${DUEL[c.by].nama}!`); return; }
    let n = patchP(g0, pi, { x: nx, y: ny });
    if (c) {
      n = patchChest(n, c.id, { status: "claimed", by: pi });
      n = patchP(n, pi, { state: "answering", chest: c.id, pick: null });
    }
    commit(n);
  };

  const jawab = (pi, opsi) => {
    const g0 = gRef.current;
    if (!g0 || g0.over || endedRef.current || phaseRef.current !== "playing") return;
    const me = g0.p[pi];
    if (me.state !== "answering") return;
    const c = g0.chests[me.chest];
    const benar = opsi === c.q.jawabanBenar;
    let n = patchP(g0, pi, {
      state: "resolving", pick: opsi,
      ok: me.ok + (benar ? 1 : 0), bad: me.bad + (benar ? 0 : 1),
      score: me.score + (benar ? POIN : 0), chests: me.chests + (benar ? 1 : 0),
    });
    if (benar) {
      n = patchChest(n, c.id, { status: "opened" });
      n = { ...n, opened: n.opened + 1 };
      n.over = n.opened >= n.total;
    } else {
      n = patchChest(n, c.id, { status: "available", by: null });
      const [kx, ky] = knock(n, pi, c);
      n = patchP(n, pi, { x: kx, y: ky });
    }
    commit(n);
    if (n.over) later(() => selesai("Seluruh harta karun berhasil ditemukan!"), 1000);
    later(() => {
      const c2 = gRef.current;
      if (c2) commit(patchP(c2, pi, { state: "idle", chest: null, pick: null }));
    }, FB_MS);
  };

  const selesai = (alasan) => {
    const cur = gRef.current;
    if (!cur || endedRef.current) return;
    endedRef.current = true;
    const [a, b] = cur.p;
    let w = -1;
    if (a.score !== b.score) w = a.score > b.score ? 0 : 1;
    else if (a.chests !== b.chests) w = a.chests > b.chests ? 0 : 1;
    else if (akurasi(a) !== akurasi(b)) w = akurasi(a) > akurasi(b) ? 0 : 1;
    setResult({ winner: w, reason: alasan });
    setPhase("finished");
  };

  const mulai = async () => {
    setLoading(true);
    setError("");
    try {
      const semua = await loadSoal(tingkat);
      if (semua.length === 0) { setError("Soal tidak ditemukan untuk tingkat ini!"); return; }
      clearTimers();
      endedRef.current = false;
      const baru = buatGame(semua, jumlah);
      commit(baru);
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

  /* ---------- timer ---------- */
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) selesai("Waktu 5 menit habis!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    if (phase !== "playing") return;
    const held = {};
    const last = [0, 0];
    const norm = (e) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);
    const down = (e) => {
      const k = norm(e);
      if (MOVE_KEYS[k]) { e.preventDefault(); held[k] = true; return; }
      const t = ANS_KEYS[k];
      if (t) {
        e.preventDefault();
        const cur = gRef.current;
        const pl = cur?.p[t[0]];
        if (pl && pl.chest !== null) {
          const o = cur.chests[pl.chest].q.opsi[t[1]];
          if (o !== undefined) jawab(t[0], o);
        }
      }
    };
    const up = (e) => { held[norm(e)] = false; };
    const blur = () => { Object.keys(held).forEach((k) => (held[k] = false)); };
    const iv = setInterval(() => {
      const now = performance.now();
      [0, 1].forEach((pi) => {
        if (now - last[pi] < 150) return;
        const k = Object.keys(held).find((x) => held[x] && MOVE_KEYS[x][0] === pi);
        if (k) { last[pi] = now; move(pi, MOVE_KEYS[k][1], MOVE_KEYS[k][2]); }
      });
    }, 40);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      clearInterval(iv);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---------- render ---------- */
  if (!env.ready) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-[#00f3ff] font-black tracking-widest animate-pulse">MEMUAT ARENA...</div>;
  }

  const showGame = (phase === "countdown" || phase === "playing") && g;

  return (
    <Shell env={env} pauseMusic={phase === "playing"}>
      {phase === "setup" && (
        <SetupCard
          title="Duel Harta Karun"
          tagline="Siapa pemburu harta karun tercepat dan tertepat?"
          Icon={Gift}
          tema={env.tema}
          controls={["Gerak: W A S D · Jawab: 1 2 3 4", "Gerak: ↑ ← ↓ → · Jawab: 7 8 9 0"]}
          rules={[
            "Gerakkan karaktermu dengan D-Pad di panelmu atau keyboard.",
            "Sentuh peti harta karun untuk mengunci peti itu dari lawan, lalu soal muncul di panelmu.",
            "Jawaban benar: peti terbuka dan kamu dapat +10 poin.",
            "Jawaban salah: kamu terpental dan peti terbuka lagi untuk direbut siapa saja.",
            "Permainan selesai saat semua peti terbuka atau waktu 5 menit habis.",
            "Pemenang: skor tertinggi, lalu peti terbanyak, lalu akurasi terbaik.",
          ]}
          tingkat={tingkat}
          onTingkat={setTingkat}
          extra={{ label: "Jumlah Harta Karun", value: jumlah, onChange: setJumlah, options: [{ value: 5, label: "5" }, { value: 10, label: "10" }, { value: 15, label: "15" }] }}
          onStart={mulai}
          startLabel="MULAI PERTANDINGAN!"
          loading={loading}
          error={error}
          onBack={() => router.push("/dashboard")}
        />
      )}

      {showGame && (
        <>
          <header className="relative z-20 shrink-0 flex items-center justify-between gap-2 px-3 md:px-6 py-2 glass-panel" style={{ borderRadius: 0, borderWidth: "0 0 2px 0" }}>
            <div className="min-w-0">
              <p className="font-black text-sm md:text-base truncate">Duel Harta Karun</p>
              <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-bold">{tingkat} · Terbuka {g.opened} • Sisa {g.total - g.opened}</p>
            </div>
            <TimerPill sisa={timeLeft} />
            <button onClick={keluar} className="glass-btn px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:!border-red-400 hover:text-red-400">
              <LogOut size={14} /> Keluar
            </button>
          </header>

          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-2 md:p-3">
            <div className="mx-auto w-full max-w-[1500px] lg:h-full grid grid-cols-2 lg:grid-cols-[minmax(0,27fr)_minmax(0,46fr)_minmax(0,27fr)] lg:grid-rows-1 gap-2 md:gap-3">
              <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 flex items-center justify-center min-h-0">
                <MapView g={g} tema={env.tema} />
              </div>
              <PlayerPanel pi={0} p={g.p[0]} g={g} tema={env.tema} onAnswer={jawab} onMove={move} className="lg:col-start-1 lg:row-start-1 lg:h-full" />
              <PlayerPanel pi={1} p={g.p[1]} g={g} tema={env.tema} onAnswer={jawab} onMove={move} className="lg:col-start-3 lg:row-start-1 lg:h-full" />
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
            ["Skor Akhir", g.p[0].score, g.p[1].score],
            ["Peti Dibuka", g.p[0].chests, g.p[1].chests],
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
