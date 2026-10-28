// app/barak/_shared/kit.js
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, Play, Timer, RotateCcw } from "lucide-react";
import { db } from "../../../firebase";
import BackgroundCanvas from "../../../components/BackgroundCanvas";

/* ============================================================
   KONSTANTA BERSAMA
   ============================================================ */
export const MATERI_TETAP = "Ciri-ciri Bangun Datar";

// Pemain 1 = kiri, Pemain 2 = kanan
export const DUEL = [
  { nama: "Pemain 1", color: "#12b5c9", dark: "#0a6f7c", ansLabels: ["1", "2", "3", "4"] },
  { nama: "Pemain 2", color: "#ff7a45", dark: "#b3441a", ansLabels: ["7", "8", "9", "0"] },
];

// Karakter tiap pemain mengikuti tema dunia (tema_bg di localStorage)
export const DUEL_AVATARS = {
  galaxy: ["🚀", "👨‍🚀"],
  ocean: ["🐬", "🐢"],
  sky: ["✈️", "🦅"],
};

// Tombol keyboard jawaban: Pemain 1 = 1 2 3 4, Pemain 2 = 7 8 9 0
export const ANS_KEYS = {
  "1": [0, 0], "2": [0, 1], "3": [0, 2], "4": [0, 3],
  "7": [1, 0], "8": [1, 1], "9": [1, 2], "0": [1, 3],
};

/* ============================================================
   HELPER
   ============================================================ */
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const formatTime = (secs) =>
  `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

// Ambil soal dari Firestore (sama persis dengan mode online)
export async function loadSoal(tingkat) {
  const q = query(
    collection(db, "daftar_soal"),
    where("materi", "==", MATERI_TETAP),
    where("tingkat", "==", tingkat)
  );
  const snap = await getDocs(q);
  return shuffle(
    snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => s.pertanyaan && Array.isArray(s.opsi) && s.opsi.length >= 2 && s.jawabanBenar !== undefined)
  );
}

// Siapkan satu soal: jawaban benar + maksimal 3 pengecoh, diacak
export const siapkanSoal = (s, max = 4) => {
  const lain = shuffle(s.opsi.filter((o) => o !== s.jawabanBenar)).slice(0, max - 1);
  return { id: s.id, pertanyaan: s.pertanyaan, jawabanBenar: s.jawabanBenar, opsi: shuffle([s.jawabanBenar, ...lain]) };
};

/* ============================================================
   HOOKS
   ============================================================ */
export function useBarakEnv() {
  const router = useRouter();
  const [env, setEnv] = useState({ tema: "galaxy", particlesEnabled: true, musicEnabled: false, volume: 0.5, ready: false });
  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) { router.push("/"); return; }
    const vol = localStorage.getItem("bgVolume");
    setEnv({
      tema: localStorage.getItem("tema_bg") || "galaxy",
      particlesEnabled: localStorage.getItem("particlesEnabled") !== "false",
      musicEnabled: localStorage.getItem("musicEnabled") === "true",
      volume: vol !== null ? parseFloat(vol) : 0.5,
      ready: true,
    });
  }, [router]);
  return env;
}

// Hitung mundur 3 - 2 - 1 - GO!
export function useCountdown(active, onDone) {
  const [count, setCount] = useState(3);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (!active) { setCount(3); return; }
    const t = setTimeout(() => {
      if (count <= 0) doneRef.current();
      else setCount(count - 1);
    }, 900);
    return () => clearTimeout(t);
  }, [active, count]);
  return count;
}

/* ============================================================
   CSS BERSAMA (tema sama dengan halaman room)
   ============================================================ */
export const BARAK_CSS = `
.theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --on-primary: #05050f; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --on-primary: #ffffff; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --on-primary: #00121f; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
.glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all .2s ease; }
.glass-btn:hover:not(:disabled) { box-shadow: var(--glow-shadow); border-color: var(--primary); }
.text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.mapbox { container-type: inline-size; }

@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.4) translateY(12px); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
.animate-popIn { animation: popIn 0.5s cubic-bezier(.22,1,.36,1) both; }
@keyframes floatY { 50% { transform: translateY(-6px); } }
.animate-floatY { animation: floatY 3s ease-in-out infinite; }
@keyframes countPop { 0% { transform: scale(0.4); opacity: 0; } 40% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
.animate-countPop { animation: countPop 0.7s ease-out both; }
@keyframes scorePop { 0% { transform: scale(1.35); } 100% { transform: scale(1); } }
.score-pop { display: inline-block; animation: scorePop 0.45s ease-out; }
@keyframes timerGlow { from { box-shadow: 0 0 8px rgba(244,63,94,.35); } to { box-shadow: 0 0 22px rgba(244,63,94,.9); } }
.timer-warn { animation: timerGlow 1s ease-in-out infinite alternate; }
@keyframes shake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.shake { animation: shake .35s; }
@media (prefers-reduced-motion: reduce) { .animate-floatY, .timer-warn { animation: none; } }
`;

/* ============================================================
   KOMPONEN BERSAMA
   ============================================================ */
export function Shell({ env, pauseMusic = false, extraCss = "", children }) {
  return (
    <main className={`theme-${env.tema} h-[100dvh] relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] select-none`}>
      <style dangerouslySetInnerHTML={{ __html: BARAK_CSS + extraCss }} />
      <BackgroundCanvas
        tema={env.tema}
        particlesEnabled={env.particlesEnabled}
        musicEnabled={env.musicEnabled}
        volume={env.volume}
        forcePauseMusic={pauseMusic}
      />
      {children}
    </main>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = String(value) === String(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`py-2.5 px-2 rounded-xl border text-sm font-black transition-all active:scale-95 ${active ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--on-primary)] shadow-[var(--glow-shadow)]" : "bg-black/20 border-[var(--glass-border)] text-[var(--text-main)] hover:border-[var(--primary)]/70"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function TimerPill({ sisa }) {
  const low = sisa <= 30;
  return (
    <div className={`glass-panel px-4 md:px-7 py-1 md:py-2 rounded-full flex items-center gap-2 md:gap-3 ${low ? "text-rose-400 timer-warn" : ""}`} style={{ border: `2px solid ${low ? "#f43f5e" : "var(--primary)"}`, borderRadius: "9999px" }}>
      <Timer size={20} />
      <span className="font-black text-xl md:text-2xl tracking-widest tabular-nums">{formatTime(Math.max(0, sisa))}</span>
    </div>
  );
}

export function CountdownOverlay({ count }) {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <span key={count} className="animate-countPop text-[130px] md:text-[190px] leading-none font-black text-gradient drop-shadow-[0_0_50px_var(--primary)]">
        {count > 0 ? count : "GO!"}
      </span>
      <p className="mt-8 text-xl md:text-2xl text-white font-bold tracking-[0.4em] uppercase text-center px-4">Bersiaplah, Duel Dimulai!</p>
    </div>
  );
}

/* ---------- Layar pengaturan sebelum main ---------- */
export function SetupCard({ title, tagline, Icon, tema, rules, controls, tingkat, onTingkat, extra, onStart, startLabel, loading, error, onBack }) {
  const av = DUEL_AVATARS[tema] || DUEL_AVATARS.galaxy;
  return (
    <div className="relative z-20 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="mx-auto w-full max-w-3xl px-3 md:px-6 py-4 md:py-6 animate-fadeIn">
        <button type="button" onClick={onBack} className="glass-btn px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold mb-4">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>

        <div className="glass-panel p-5 md:p-8 flex flex-col gap-5 shadow-[var(--glow-shadow)]" style={{ borderTop: "4px solid var(--primary)" }}>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase px-4 py-1 rounded-full border border-[var(--glass-border)] text-[var(--primary)]">
              <Icon size={12} /> Barak · Duel 2 Pemain
            </span>
            <h1 className="mt-2 text-3xl md:text-4xl font-black text-gradient tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)] font-medium">{tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DUEL.map((p, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={{ border: `2px solid ${p.color}`, background: `${p.color}22` }}>
                <div className="text-4xl animate-floatY">{av[i]}</div>
                <p className="font-black mt-1" style={{ color: p.color }}>{p.nama}</p>
                <p className="text-xs text-[var(--text-muted)] font-bold">{controls[i]}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest">Cara Bermain</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm font-medium">
              {rules.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] mb-2 block">Tingkat Kesulitan</label>
            <Segmented
              value={tingkat}
              onChange={onTingkat}
              options={[{ value: "Mudah", label: "Mudah" }, { value: "Sedang", label: "Sedang" }, { value: "Sulit", label: "Sulit" }]}
            />
          </div>

          {extra && (
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-2 block">{extra.label}</label>
              <Segmented value={extra.value} onChange={extra.onChange} options={extra.options} />
            </div>
          )}

          {error && <p className="text-rose-400 text-sm font-bold text-center">⚠️ {error}</p>}

          <button
            type="button"
            disabled={loading}
            onClick={onStart}
            className="w-full py-4 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-[var(--glow-shadow)] disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            <Play fill="currentColor" size={20} /> {loading ? "MEMUAT SOAL..." : startLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Layar hasil ----------
   rows: [["Skor Akhir", skorP1, skorP2], ["Benar", .., ..], ...]
   winner: 0 (Pemain 1), 1 (Pemain 2), -1 (seri) */
export function ResultCard({ tema, winner, reason, rows, onAgain, onBack }) {
  const av = DUEL_AVATARS[tema] || DUEL_AVATARS.galaxy;
  return (
    <div className="relative z-20 flex-1 min-h-0 overflow-y-auto custom-scrollbar flex items-center justify-center p-4">
      <div className="w-full max-w-3xl text-center animate-fadeIn">
        <div className="text-5xl">{winner === -1 ? "🤝" : "🏆"}</div>
        <h2 className="text-3xl md:text-5xl font-black text-gradient my-2 tracking-tight">
          {winner === -1 ? "PERTANDINGAN SERI!" : `PEMAIN ${winner + 1} MENJADI JUARA!`}
        </h2>
        <p className="text-rose-400 font-bold mb-5 text-sm">{reason}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DUEL.map((pl, i) => {
            const win = winner === i;
            return (
              <div
                key={i}
                className={`glass-panel p-5 text-left ${win ? "scale-105" : ""}`}
                style={{ border: `4px solid ${win ? "#facc15" : pl.color}`, boxShadow: win ? "0 0 40px rgba(250,204,21,.5)" : undefined }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-3xl">{av[i]}</span>
                  <h3 className="text-xl font-black">{pl.nama}{win ? " 🏆" : ""}</h3>
                </div>
                <table className="w-full text-sm md:text-base font-bold">
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r[0]} className="border-b border-white/10 last:border-0">
                        <td className="py-1.5 text-[var(--text-muted)]">{r[0]}</td>
                        <td className="py-1.5 text-right text-lg" style={{ color: pl.color }}>{r[i + 1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <button onClick={onAgain} className="px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-transform hover:scale-105 shadow-[var(--glow-shadow)]" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
            <RotateCcw size={18} /> MAIN LAGI
          </button>
          <button onClick={onBack} className="glass-btn px-6 py-3 rounded-2xl font-black">KEMBALI KE DASHBOARD</button>
        </div>
      </div>
    </div>
  );
}
