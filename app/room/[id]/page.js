// lab-matematika-mps/mediapembelajarangame/app/room/[id]/page.js
"use client";
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, setDoc, deleteDoc, collection, query, orderBy, getDoc, getDocs, where } from "firebase/firestore";
import { db } from "../../../firebase";
// CATATAN: jangan pakai `new Map()` di file ini, karena "Map" di bawah adalah ikon lucide.
import { Trophy, Play, XSquare, Navigation, Gift, ShieldCheck, XOctagon, Settings2, BarChart, Hash, Map, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Timer, Flag, AlertTriangle, Crosshair, Users, Check } from "lucide-react";
import BackgroundCanvas from "../../../components/BackgroundCanvas";

/* ============================================================
   KONSTANTA
   ============================================================ */
const GRID_SIZE = 10;
const MAX_RACERS = 8; // maksimal lintasan mode Balapan Lari
const MATERI_TETAP = "Ciri-ciri Bangun Datar"; // materi dikunci (full bangun datar)

const MODE_HARTA = "Kumpulkan Harta";
const MODE_ATLET = "Atlet Lari";
const MODE_ALIEN = "Alien Shooter";

const MODES = [
  { id: MODE_HARTA, label: "Berburu Harta Karun", desc: "Jelajahi peta, temukan peti, jawab soalnya.", icon: Gift, start: "MULAI EKSPLORASI DUNIA!" },
  { id: MODE_ATLET, label: "Balapan Lari", desc: "Jawab cepat, majukan karaktermu ke garis finis.", icon: Flag, start: "MULAI BALAPAN!" },
  { id: MODE_ALIEN, label: "Alien Shooter", desc: "Tembak alien pembawa soal sebelum mendarat.", icon: Crosshair, start: "MULAI PERTEMPURAN!" },
];

// Karakter yang bisa dipilih siswa, sesuai tema dunia
const THEME_AVATARS = {
  galaxy: ["🚀", "🛸", "👽", "🪐", "☄️", "👨‍🚀", "🛰️", "👾", "🌙", "⭐", "🤖", "🌌"],
  ocean: ["🐙", "🐬", "🦈", "🐢", "🦀", "🐡", "🦑", "🐳", "🐠", "🦭", "🐋", "🦞"],
  sky: ["✈️", "🦅", "🎈", "☁️", "🕊️", "🚁", "🪁", "🌈", "🦉", "🦜", "🪂", "🌤️"],
};

// Musuh yang turun di mode Alien Shooter, menyesuaikan tema
const ENEMY_EMOJI = {
  galaxy: ["👽", "👾", "🛸", "🦑", "🐙"],
  ocean: ["🦑", "🐙", "🦈", "🦀", "🐡"],
  sky: ["🎈", "🪁", "☁️", "🦅", "🛸"],
};

const ALIEN_CFG = {
  Mudah: { rate: 5000, v: 0.6, amp: 0.06, fr: 90 },
  Sedang: { rate: 4000, v: 0.9, amp: 0.09, fr: 70 },
  Sulit: { rate: 3000, v: 1.3, amp: 0.12, fr: 55 },
};
const LETTERS = ["A", "B", "C", "D"];
const LETTER_COLORS = ["#2de2e6", "#ffd23f", "#5cf2a0", "#ff5d73"];
const LETTER_SHADOWS = ["#12929a", "#c29500", "#1e9e63", "#b02a43"];

/* ============================================================
   HELPER
   ============================================================ */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

// Avatar cadangan untuk pemain lama yang belum memilih karakter
const getIconForPlayer = (namaPemain, tema) => {
  const icons = THEME_AVATARS[tema || "galaxy"] || THEME_AVATARS.galaxy;
  let hash = 0;
  for (let i = 0; i < namaPemain.length; i++) {
    hash = namaPemain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return icons[Math.abs(hash) % icons.length];
};
const avatarOf = (p, tema) => p?.avatar || getIconForPlayer(p?.nama || "?", tema);

const getGameLimit = (cfg) => (cfg?.mode === MODE_ALIEN ? (parseInt(cfg.durasi) || 3) * 60 : 300);
const alasanWaktu = (cfg) => (cfg?.mode === MODE_ALIEN ? `WAKTU HABIS (${parseInt(cfg.durasi) || 3} Menit)!` : "WAKTU HABIS (5 Menit)!");

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ============================================================
   CSS GLOBAL (tema tetap sama, ditambah animasi game)
   ============================================================ */
const GLOBAL_CSS = `
.theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --on-primary: #05050f; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --on-primary: #ffffff; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --on-primary: #00121f; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: all 0.4s ease; }
.glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); }
.glass-btn:hover { box-shadow: var(--glow-shadow); border-color: var(--primary); }
.text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

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

/* animasi perubahan peringkat leaderboard */
@keyframes rankFlashUp { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } 25% { box-shadow: 0 0 28px 5px rgba(52,211,153,.75); background-color: rgba(52,211,153,.22); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
@keyframes rankFlashDown { 0% { box-shadow: 0 0 0 0 rgba(244,63,94,0); } 25% { box-shadow: 0 0 28px 5px rgba(244,63,94,.7); background-color: rgba(244,63,94,.2); } 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); } }
.rank-up { animation: rankFlashUp 1.8s ease-out; z-index: 2; }
.rank-down { animation: rankFlashDown 1.8s ease-out; }
@keyframes chipBounce { 0% { transform: translateY(8px); opacity: 0; } 40% { transform: translateY(-4px); opacity: 1; } 100% { transform: translateY(0); } }
.rank-chip { display: inline-flex; align-items: center; gap: .2rem; font-weight: 900; font-size: .75rem; padding: .15rem .5rem; border-radius: 999px; border: 1px solid; animation: chipBounce 1s ease-out; }

/* ukuran peta proporsional */
.mapbox { container-type: inline-size; }
.map-size { width: clamp(220px, min(92vw, calc(100dvh - 400px)), 520px); }
@media (min-width: 768px) { .map-size { width: clamp(300px, min(92vw, calc(100dvh - 200px)), 600px); } }
.map-avatar { font-size: 16px; font-size: 4.6cqw; line-height: 1; }
.map-tag { font-size: 8px; font-size: clamp(7px, 2.2cqw, 12px); }

/* Alien Shooter */
.hud-bar { background: var(--glass-bg); backdrop-filter: blur(12px); border-bottom: 2px solid var(--glass-border); }
.al-card { position: absolute; top: 0; left: 0; width: clamp(200px, 42vw, 300px); padding: .55rem .65rem .65rem; border-radius: 1.1rem; text-align: center; color: #1a1040; background: linear-gradient(180deg, #fff, #e9e4ff); border: 3px solid var(--primary); box-shadow: 0 0 18px var(--primary), 0 5px 0 rgba(0,0,0,.25); will-change: transform; z-index: 5; }
@media (min-width: 768px) { .al-card { width: clamp(320px, 34vw, 480px); } .al-opts { grid-template-columns: 1fr 1fr; } }
.al-emoji { font-size: clamp(1.6rem, 4vh, 2.6rem); line-height: 1.1; }
.al-q { font-weight: 800; font-size: clamp(.8rem, 1.3vw + .35rem, 1.2rem); line-height: 1.25; margin: .15rem 0 .45rem; }
.al-opts { display: grid; grid-template-columns: 1fr; gap: .3rem; text-align: left; }
.al-opt { display: flex; align-items: center; gap: .4rem; border-radius: .65rem; padding: .2rem .45rem; font-weight: 700; font-size: clamp(.7rem, .9vw + .3rem, 1rem); line-height: 1.15; background: rgba(26,16,64,.08); border: 2px solid rgba(26,16,64,.12); }
.al-opt b { flex: none; width: 1.5em; height: 1.5em; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #1a1040; font-size: .9em; }
.al-opt.wrong { opacity: .35; text-decoration: line-through; }
.beam { position: absolute; height: 6px; border-radius: 6px; background: #fff; box-shadow: 0 0 14px 5px var(--primary); transform-origin: 0 50%; animation: beamFade .28s ease-out forwards; pointer-events: none; z-index: 4; }
@keyframes beamFade { from { opacity: 1; } to { opacity: 0; } }
.boom { position: absolute; font-size: 2.6rem; line-height: 1; text-align: center; transform: translate(-50%, -50%); animation: boomPop .6s ease-out forwards; pointer-events: none; z-index: 6; }
.boom small { display: block; font-size: 1.1rem; font-weight: 900; color: #5cf2a0; text-shadow: 0 0 6px #000; }
.boom.bad small { color: #ff5d73; }
@keyframes boomPop { from { transform: translate(-50%, -50%) scale(.4); opacity: 1; } to { transform: translate(-50%, -110%) scale(1.4); opacity: 0; } }
.shake { animation: shake .35s; }
@keyframes shake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.ab-btn { height: clamp(56px, 11dvh, 104px); display: flex; align-items: center; justify-content: center; border: 0; border-radius: 1rem; font-weight: 900; font-size: clamp(1.6rem, 4.5vh, 3rem); color: #1a1040; cursor: pointer; touch-action: manipulation; transition: transform .08s, box-shadow .08s; box-shadow: 0 .3rem 0 var(--sh); }
.ab-btn:active { transform: translateY(.3rem); box-shadow: none; }
.ab-btn:disabled { opacity: .45; cursor: not-allowed; }

@media (prefers-reduced-motion: reduce) { .animate-floatY, .timer-warn { animation: none; } }
`;

/* ============================================================
   KOMPONEN (sengaja di luar Room supaya TIDAK dibuat ulang
   tiap detik, itulah penyebab layar balapan berkedip dulu)
   ============================================================ */
const AVATAR_SIZES = {
  sm: "w-8 h-8 text-lg",
  md: "w-11 h-11 text-2xl",
  lg: "w-16 h-16 text-4xl",
  xl: "w-24 h-24 text-6xl",
};

function AvatarBubble({ emoji, size = "md", glow = false, className = "" }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--primary)]/60 bg-[var(--primary)]/15 leading-none ${glow ? "shadow-[var(--glow-shadow)]" : ""} ${AVATAR_SIZES[size]} ${className}`}>
      <span className="drop-shadow-md">{emoji}</span>
    </span>
  );
}

function Segmented({ options, value, onChange }) {
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

function TimerPill({ sisa }) {
  const low = sisa <= 60;
  return (
    <div className={`glass-panel px-5 md:px-8 py-1.5 md:py-2.5 rounded-full border shadow-[var(--glow-shadow)] flex items-center gap-2 md:gap-3 ${low ? "border-rose-500 bg-rose-500/20 text-rose-400 timer-warn" : "border-[var(--primary)]/50"}`}>
      <Timer size={20} className={low ? "text-rose-400" : "text-[var(--text-main)]"} />
      <span className={`font-black text-xl md:text-2xl tracking-widest ${low ? "" : "text-[var(--text-main)]"}`}>{formatTime(sisa)}</span>
    </div>
  );
}

// Pil peringkat siswa: berubah warna + panah saat naik/turun
function RankPill({ rank, total }) {
  const prev = useRef(rank);
  const [dir, setDir] = useState(null);

  useEffect(() => {
    if (prev.current !== rank) {
      if (prev.current > 0 && rank > 0) setDir({ d: rank < prev.current ? "up" : "down", k: Date.now() });
      prev.current = rank;
    }
  }, [rank]);

  useEffect(() => {
    if (!dir) return;
    const t = setTimeout(() => setDir(null), 2800);
    return () => clearTimeout(t);
  }, [dir]);

  const tone = dir?.d === "up" ? "text-emerald-300 border-emerald-400/70 bg-emerald-500/20" : dir?.d === "down" ? "text-rose-300 border-rose-400/70 bg-rose-500/20" : "text-[var(--primary)] border-white/10 bg-black/60";
  return (
    <span className={`text-xs font-black px-4 py-1.5 rounded-full border shadow-lg flex items-center gap-1.5 pointer-events-auto transition-colors duration-500 ${tone}`}>
      <Trophy size={14} />
      <span>Peringkat</span>
      <span key={rank} className="score-pop">#{rank || "-"}</span>
      <span>dari {total}</span>
      {dir && <span className="rank-chip border-transparent">{dir.d === "up" ? "▲" : "▼"}</span>}
    </span>
  );
}

/* ---------- Leaderboard dengan animasi perpindahan peringkat (FLIP) ---------- */
const rowTone = (i) =>
  i === 0 ? "bg-yellow-500/20 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
  : i === 1 ? "bg-slate-300/10 border-slate-400"
  : i === 2 ? "bg-amber-600/10 border-amber-600/50"
  : "bg-[var(--primary)]/5 border-[var(--glass-border)]";
const badgeTone = (i) =>
  i === 0 ? "bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]"
  : i === 1 ? "bg-slate-300 text-black"
  : i === 2 ? "bg-amber-600 text-white"
  : "bg-[var(--primary)]/20 text-[var(--text-main)]";

function Leaderboard({ players, tema, showHp = false, singleColumn = false, className = "" }) {
  const listRef = useRef(null);
  const prevPos = useRef({});
  const prevRank = useRef({});
  const [changes, setChanges] = useState({});
  const orderKey = players.map((p) => p.nama).join("|");

  // 1) Deteksi siapa yang naik / turun peringkat
  useEffect(() => {
    const found = {};
    players.forEach((p, i) => {
      const old = prevRank.current[p.nama];
      if (old !== undefined && old !== i) found[p.nama] = { dir: i < old ? "up" : "down", delta: Math.abs(old - i) };
    });
    const nextRank = {};
    players.forEach((p, i) => { nextRank[p.nama] = i; });
    prevRank.current = nextRank;
    if (Object.keys(found).length) setChanges(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  useEffect(() => {
    if (!Object.keys(changes).length) return;
    const t = setTimeout(() => setChanges({}), 3500);
    return () => clearTimeout(t);
  }, [changes]);

  // 2) Animasi geser baris ke posisi barunya (FLIP)
  useIsoLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const next = {};
    el.querySelectorAll("[data-flip]").forEach((node) => {
      const key = node.getAttribute("data-flip");
      const pos = { x: node.offsetLeft, y: node.offsetTop };
      next[key] = pos;
      const old = prevPos.current[key];
      if (old && (old.x !== pos.x || old.y !== pos.y)) {
        node.style.transition = "none";
        node.style.transform = `translate(${old.x - pos.x}px, ${old.y - pos.y}px)`;
        void node.offsetWidth;
        node.style.transition = "transform 800ms cubic-bezier(.22,1,.36,1)";
        node.style.transform = "translate(0px, 0px)";
      }
    });
    prevPos.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  const twoCols = !singleColumn && players.length > 8;

  return (
    <div ref={listRef} className={`relative overflow-y-auto custom-scrollbar pr-1 ${className}`}>
      {players.length === 0 && <p className="text-[var(--text-muted)] italic text-center pt-10">Siswa belum ada yang masuk arena...</p>}
      <div className={`grid gap-2 md:gap-3 content-start grid-cols-1 ${twoCols ? "xl:grid-cols-2" : ""}`}>
        {players.map((p, i) => {
          const ch = changes[p.nama];
          const hp = Math.max(0, Math.min(3, p.hp ?? 3));
          return (
            <div
              key={p.nama}
              data-flip={p.nama}
              className={`relative flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 md:px-4 md:py-3 ${rowTone(i)} ${ch ? (ch.dir === "up" ? "rank-up" : "rank-down") : ""}`}
            >
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <span className={`w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm md:text-base ${badgeTone(i)}`}>{i + 1}</span>
                <AvatarBubble emoji={avatarOf(p, tema)} size="md" />
                <div className="min-w-0">
                  <p className="font-bold text-base md:text-lg truncate">{p.nama}</p>
                  {showHp && <p className="text-xs leading-none tracking-wider mt-0.5">{"❤️".repeat(hp)}{"🖤".repeat(3 - hp)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ch && (
                  <span className={`rank-chip ${ch.dir === "up" ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/50" : "text-rose-300 bg-rose-500/20 border-rose-400/50"}`}>
                    {ch.dir === "up" ? "▲" : "▼"} {ch.delta}
                  </span>
                )}
                <span key={p.skor} className={`score-pop font-black text-lg md:text-xl px-3 py-1 rounded-lg border ${i === 0 ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/50" : "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"}`}>
                  {p.skor} Pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Daftar petualang di lobi ---------- */
function PlayerRoster({ players, tema, myName, minSlots = 8 }) {
  const empty = Math.max(0, minSlots - players.length);
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 content-start">
      {players.map((p) => (
        <div key={p.nama} className="animate-popIn flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--primary)]/5 py-3 px-2">
          <div className="relative">
            <AvatarBubble emoji={avatarOf(p, tema)} size="lg" glow />
            {p.nama === myName && (
              <span className="absolute -top-1 -right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] font-black">KAMU</span>
            )}
          </div>
          <span className="text-xs md:text-sm font-bold truncate max-w-full">{p.nama}</span>
        </div>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <div key={`kosong-${i}`} className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--glass-border)] py-3 px-2 opacity-60">
          <span className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center text-2xl text-[var(--text-muted)]">?</span>
          <span className="text-xs text-[var(--text-muted)]">Menunggu...</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Lintasan balapan (maks. 8 lintasan) ---------- */
function TrackComponent({ players, pengaturan, tema, myName, compact = false }) {
  const racers = [...players].sort((a, b) => a.nama.localeCompare(b.nama)).slice(0, MAX_RACERS); // urutan lintasan tetap
  const target = Math.max(1, (parseInt(pengaturan?.jumlah) || 5) * 10);
  const size = compact ? 1.75 : racers.length > 5 ? 2.1 : 2.6; // rem
  return (
    <div className={`w-full glass-panel border border-[var(--primary)]/50 shadow-[var(--glow-shadow)] rounded-3xl relative overflow-hidden ${compact ? "p-3" : "p-4 md:p-6"}`}>
      <h3 className={`text-center font-black text-[var(--primary)] uppercase tracking-widest flex items-center justify-center gap-2 ${compact ? "text-xs mb-2" : "text-sm md:text-base mb-4"}`}>
        <Flag size={compact ? 14 : 18} /> Sirkuit Balapan Matematika <Flag size={compact ? 14 : 18} />
      </h3>
      <div className="flex flex-col gap-2">
        {racers.map((p) => {
          const prog = Math.min(p.skor / target, 1);
          const me = p.nama === myName;
          return (
            <div key={p.nama} className="flex items-center gap-2 md:gap-3">
              <div className={`shrink-0 text-right leading-tight ${compact ? "w-16 md:w-24" : "w-20 md:w-32"}`}>
                <p className={`font-black truncate ${compact ? "text-[11px]" : "text-xs md:text-sm"} ${me ? "text-[var(--primary)]" : ""}`}>{p.nama}</p>
                <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-bold">{p.skor} Pts</p>
              </div>
              <div className={`relative flex-1 rounded-full bg-black/30 border overflow-hidden ${me ? "border-[var(--primary)]" : "border-white/10"}`} style={{ height: `${size + 0.5}rem` }}>
                <div className="absolute inset-x-3 top-1/2 border-t border-dashed border-white/15" />
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-transparent to-[var(--primary)]/35"
                  style={{ width: `calc(${size / 2}rem + (100% - ${size}rem) * ${prog})`, transition: "width 1s ease-out" }}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-base md:text-xl opacity-80">🏁</span>
                <span
                  className="absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--primary)]/25 shadow-[var(--glow-shadow)]"
                  style={{ width: `${size}rem`, height: `${size}rem`, fontSize: `${size * 0.6}rem`, left: `calc((100% - ${size}rem) * ${prog})`, transition: "left 1s ease-out", lineHeight: 1 }}
                >
                  {avatarOf(p, tema)}
                </span>
              </div>
            </div>
          );
        })}
        {racers.length === 0 && <div className="text-center w-full py-8 text-[var(--text-muted)] font-bold italic">Menunggu pembalap masuk lintasan...</div>}
      </div>
    </div>
  );
}

/* ---------- Peta mini untuk layar host (mode Harta) ---------- */
function MiniMapKumpulkanHarta({ rData, rPlayers, tema }) {
  return (
    <div className="mapbox relative aspect-square bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-inner mx-auto" style={{ width: "min(100%, calc(100dvh - 17rem), 640px)" }}>
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
        {Array.from({ length: 100 }).map((_, i) => (<div key={i} className={`border border-white/5 ${(Math.floor(i / 10) + (i % 10)) % 2 === 0 ? "bg-white/5" : "bg-transparent"}`} />))}
      </div>
      {rData.soal?.map((s) => !s.isSelesai && (
        <div key={s.soalIndex} className="absolute w-[10%] h-[10%] flex items-center justify-center" style={{ left: `${s.x * 10}%`, top: `${s.y * 10}%` }}>
          <Gift style={{ width: "62%", height: "62%" }} className={`relative z-10 ${s.claimedBy ? "text-gray-500" : "text-amber-400 drop-shadow-md animate-pulse"}`} />
        </div>
      ))}
      {rPlayers.map((p) => (
        <div key={p.nama} className="absolute w-[10%] h-[10%] flex flex-col items-center justify-center z-20 transition-all duration-500" style={{ left: `${p.x * 10}%`, top: `${p.y * 10}%` }}>
          <div className="map-avatar w-[80%] h-[80%] bg-white/20 border border-white rounded-md flex items-center justify-center backdrop-blur-md shadow-md">{avatarOf(p, tema)}</div>
          <span className="map-tag absolute bg-black/80 px-1 rounded text-white font-bold whitespace-nowrap" style={{ bottom: "-14%" }}>{p.nama.substring(0, 6)}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ALIEN SHOOTER (layar siswa, satu layar penuh)
   Game loop memakai ref supaya tidak ikut ter-reset oleh render Room
   ============================================================ */
function AlienShooter({ pool, tingkat, tema, nama, avatar, initialScore, initialHp, sisaWaktu, myRank, total, onProgress }) {
  const cfg = ALIEN_CFG[tingkat] || ALIEN_CFG.Mudah;
  const zoneRef = useRef(null);
  const poolRef = useRef(pool);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const S = useRef(null);
  const [, setTick] = useState(0);

  if (S.current === null) {
    S.current = { aliens: [], lasers: [], fx: [], hp: initialHp, score: initialScore, seq: 0, next: 0, deck: [], over: initialHp <= 0, shakeUntil: 0, badBtn: -1, badUntil: 0 };
  }

  const enemies = ENEMY_EMOJI[tema] || ENEMY_EMOJI.galaxy;

  const spawn = () => {
    const s = S.current;
    if (!poolRef.current.length) return;
    if (!s.deck.length) s.deck = shuffle(poolRef.current.map((_, i) => i));
    const q = poolRef.current[s.deck.pop()];
    const lain = shuffle((q.opsi || []).filter((o) => o !== q.jawabanBenar)).slice(0, 3);
    const opsi = shuffle([q.jawabanBenar, ...lain].filter((o) => o !== undefined));
    s.aliens.push({ id: ++s.seq, q, opsi, emoji: pick(enemies), x: 0, y: 0, h: 0, w: 0, x0: 0, amp: 0, ph: Math.random() * 6.28, wrong: [], el: null });
  };

  const hurt = () => {
    const s = S.current;
    s.hp = Math.max(0, s.hp - 1);
    s.shakeUntil = performance.now() + 350;
    progressRef.current?.({ skor: s.score, hp: s.hp });
    if (s.hp <= 0) { s.over = true; s.aliens = []; }
  };

  const answer = (k) => {
    const s = S.current;
    const zone = zoneRef.current;
    if (s.over || !zone) return;
    // jawaban selalu menyasar alien paling bawah (terdekat) yang sudah terlihat
    let target = null;
    s.aliens.forEach((a) => { if (a.h && a.y + a.h > 0 && (!target || a.y > target.y)) target = a; });
    if (!target) return;
    const pilihan = target.opsi[k];
    if (pilihan === undefined || target.wrong.includes(k)) return;
    const tx = target.x, ty = target.y + target.h / 2;
    const fxId = ++s.seq;
    if (pilihan === target.q.jawabanBenar) {
      s.score += 10;
      s.aliens = s.aliens.filter((a) => a !== target);
      const cx = zone.clientWidth / 2, cy = zone.clientHeight - 40;
      s.lasers.push({ id: fxId, cx, cy, len: Math.hypot(tx - cx, ty - cy), ang: (Math.atan2(ty - cy, tx - cx) * 180) / Math.PI });
      s.fx.push({ id: fxId, x: tx, y: ty, txt: "💥", pts: "+10", bad: false });
      setTimeout(() => { s.lasers = s.lasers.filter((l) => l.id !== fxId); }, 300);
      setTimeout(() => { s.fx = s.fx.filter((f) => f.id !== fxId); }, 650);
      progressRef.current?.({ skor: s.score, hp: s.hp });
    } else {
      const before = s.score;
      s.score = Math.max(0, s.score - 5);
      target.wrong.push(k);
      s.badBtn = k;
      s.badUntil = performance.now() + 300;
      s.fx.push({ id: fxId, x: tx, y: ty, txt: "💢", pts: "-5", bad: true });
      setTimeout(() => { s.fx = s.fx.filter((f) => f.id !== fxId); }, 650);
      if (s.score !== before) progressRef.current?.({ skor: s.score, hp: s.hp });
    }
  };

  // Game loop
  useEffect(() => {
    const s = S.current;
    let raf;
    let last = performance.now();
    s.next = last + 600;
    const loop = (t) => {
      const ms = Math.min(t - last, 50);
      last = t;
      const dt = ms / 16.67;
      const zone = zoneRef.current;
      if (zone && !s.over) {
        const H = zone.clientHeight, Wz = zone.clientWidth;
        const v = (cfg.v * H / 700) * dt;
        for (let i = s.aliens.length - 1; i >= 0; i--) {
          const a = s.aliens[i];
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
          if (a.y + a.h >= H) { s.aliens.splice(i, 1); hurt(); }
        }
        // soal baru muncul hanya jika alien sebelumnya sudah turun cukup jauh (tidak bertumpuk)
        if (!s.over && t >= s.next && s.aliens.every((a) => a.h && a.y >= a.h * 0.25 + 14)) {
          spawn();
          s.next = t + cfg.rate;
        }
      }
      setTick((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: A B C D atau 1 2 3 4
  useEffect(() => {
    const onKey = (e) => {
      const map = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      const k = map[String(e.key).toLowerCase()];
      if (k !== undefined) answer(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = S.current;
  const now = performance.now();
  const hearts = "❤️".repeat(s.hp) + "🖤".repeat(Math.max(0, 3 - s.hp));

  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      {/* HUD: nyawa, waktu, skor, peringkat */}
      <div className="hud-bar shrink-0 flex items-center justify-between gap-2 md:gap-4 px-3 md:px-6 py-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <AvatarBubble emoji={avatar} size="md" glow />
          <div className="min-w-0">
            <p className="font-black text-sm md:text-base truncate">{nama}</p>
            <p className="text-sm md:text-lg tracking-widest leading-tight">{hearts}</p>
          </div>
        </div>
        <TimerPill sisa={sisaWaktu} />
        <div className="flex flex-col items-end gap-1 flex-1">
          <p className="font-black text-xl md:text-3xl text-[var(--primary)] leading-none">
            <span key={s.score} className="score-pop">{s.score}</span>
            <small className="text-xs md:text-sm ml-1 text-[var(--text-muted)]">Pts</small>
          </p>
          <RankPill rank={myRank} total={total} />
        </div>
      </div>

      {/* Area tembak */}
      <div ref={zoneRef} className={`relative flex-1 min-h-0 overflow-hidden ${now < s.shakeUntil ? "shake" : ""}`}>
        <div className="absolute inset-x-0 bottom-0 h-[7%] bg-gradient-to-t from-rose-500/40 to-transparent pointer-events-none" />

        {s.aliens.map((a) => (
          <div
            key={a.id}
            ref={(el) => { a.el = el; }}
            className="al-card"
            style={{ transform: `translate(${a.x - a.w / 2}px, ${a.y}px)`, opacity: a.h ? 1 : 0 }}
          >
            <div className="al-emoji">{a.emoji}</div>
            <p className="al-q">{a.q.pertanyaan}</p>
            <div className="al-opts">
              {a.opsi.map((o, i) => (
                <div key={i} className={`al-opt ${a.wrong.includes(i) ? "wrong" : ""}`}>
                  <b style={{ background: LETTER_COLORS[i] }}>{LETTERS[i]}</b>
                  <span>{o}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {s.lasers.map((l) => (
          <div key={l.id} className="beam" style={{ left: l.cx, top: l.cy, width: l.len, transform: `rotate(${l.ang}deg)` }} />
        ))}
        {s.fx.map((f) => (
          <div key={f.id} className={`boom ${f.bad ? "bad" : ""}`} style={{ left: f.x, top: f.y }}>
            {f.txt}<small>{f.pts}</small>
          </div>
        ))}

        {/* Penembak = karakter pilihan siswa */}
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 z-[3]">
          <span className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full text-3xl md:text-4xl border-2 border-[var(--primary)] bg-[var(--primary)]/25 shadow-[var(--glow-shadow)]">{avatar}</span>
        </div>

        {s.over && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center bg-black/70 backdrop-blur-sm p-6 animate-fadeIn">
            <div className="text-6xl mb-2">💀</div>
            <h2 className="text-2xl md:text-4xl font-black text-rose-400">NYAWA HABIS!</h2>
            <p className="mt-3 text-white/80 max-w-sm text-sm md:text-base">
              Skor akhirmu <b className="text-[var(--primary)]">{s.score}</b>. Tunggu permainan selesai, peringkat di atas tetap terus berubah.
            </p>
          </div>
        )}
      </div>

      {/* Tombol jawaban A B C D */}
      <div className="shrink-0 hud-bar px-2 md:px-4 py-2 md:py-3" style={{ borderBottom: "none", borderTop: "2px solid var(--glass-border)" }}>
        <div className="mx-auto w-full max-w-3xl grid grid-cols-4 gap-2 md:gap-4">
          {LETTERS.map((L, i) => (
            <button
              key={L}
              onClick={() => answer(i)}
              disabled={s.over}
              className={`ab-btn ${s.badBtn === i && now < s.badUntil ? "shake" : ""}`}
              style={{ background: LETTER_COLORS[i], "--sh": LETTER_SHADOWS[i] }}
            >
              {L}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HALAMAN ROOM
   ============================================================ */
export default function Room() {
  const { id } = useParams();
  const router = useRouter();

  const [roomData, setRoomData] = useState(null);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [players, setPlayers] = useState([]);

  const [posisi, setPosisi] = useState({ x: 0, y: 0 });
  const [soalAktif, setSoalAktif] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [atletView, setAtletView] = useState("SOAL");
  const [localSoalIndex, setLocalSoalIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const [pengaturan, setPengaturan] = useState({ mode: MODE_HARTA, materi: MATERI_TETAP, tingkat: "Mudah", jumlah: 5, durasi: 3 });

  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // --- STATE AFK (AUTO CLOSE) ---
  const [idleLimit, setIdleLimit] = useState(60000); // Default awal 60 detik (1 menit)
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(10);

  const activePlayers = useMemo(
    () => players.filter((p) => p.nama !== roomData?.host).sort((a, b) => (b.skor || 0) - (a.skor || 0) || a.nama.localeCompare(b.nama)),
    [players, roomData?.host]
  );
  const me = activePlayers.find((p) => p.nama === namaPeserta);
  const mySkor = me?.skor || 0;
  const isHost = roomData?.host === namaPeserta;
  const myRank = activePlayers.findIndex((p) => p.nama === namaPeserta) + 1;

  // data terbaru untuk timer (supaya interval tidak dibuat ulang tiap snapshot)
  const latest = useRef({});
  latest.current = { rd: roomData, host: isHost, ap: activePlayers };

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);

    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
    setMusicEnabled(localStorage.getItem("musicEnabled") === "true");
    const savedVol = localStorage.getItem("bgVolume");
    if (savedVol) setVolume(parseFloat(savedVol));

    const roomRef = doc(db, "rooms", id);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      } else {
        router.push("/dashboard");
      }
    });

    const unsubPlayers = onSnapshot(query(collection(db, `rooms/${id}/players`), orderBy("skor", "desc")), (snapshot) => {
      setPlayers(snapshot.docs.map((d) => d.data()));
    });

    return () => { unsubRoom(); unsubPlayers(); };
  }, [id, router]);

  useEffect(() => {
    if (!roomData?.host || !namaPeserta) return;
    if (roomData.host !== namaPeserta) {
      const initPlayer = async () => {
        const playerRef = doc(db, `rooms/${id}/players`, namaPeserta);
        const pSnap = await getDoc(playerRef);
        const avatarAwal = getIconForPlayer(namaPeserta, roomData.tema);

        if (!pSnap.exists()) {
          let startX, startY;
          let isSafe = false;
          while (!isSafe) {
            startX = Math.floor(Math.random() * GRID_SIZE);
            startY = Math.floor(Math.random() * GRID_SIZE);
            if (roomData.soal) {
              const onTreasure = roomData.soal.some((s) => s.x === startX && s.y === startY);
              isSafe = !onTreasure;
            } else {
              isSafe = true;
            }
          }
          await setDoc(playerRef, { nama: namaPeserta, skor: 0, x: startX, y: startY, avatar: avatarAwal, hp: 3 });
          setPosisi({ x: startX, y: startY });
        } else {
          const data = pSnap.data();
          if (!data.avatar) updateDoc(playerRef, { avatar: avatarAwal }).catch(() => {});
          setPosisi({ x: data.x, y: data.y });
        }
      };
      initPlayer();
    }
  }, [roomData?.host, namaPeserta, id]);

  // --- LOGIK PERINGATAN AFK ---
  useEffect(() => {
    if (!roomData) return;
    let warningTimer;
    // Timer AFK hanya berjalan ketika menunggu di lobby atau sesudah game selesai
    if (roomData.status === "waiting" || roomData.status === "finished") {
      warningTimer = setTimeout(() => {
        setShowIdleWarning(true);
        setIdleCountdown(10);
      }, idleLimit);
    }
    return () => { if (warningTimer) clearTimeout(warningTimer); };
  }, [roomData?.status, idleLimit]);

  // Efek Countdown saat Peringatan AFK muncul
  useEffect(() => {
    let interval;
    if (showIdleWarning && idleCountdown > 0) {
      interval = setInterval(() => {
        setIdleCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showIdleWarning && idleCountdown === 0) {
      const tutupRoom = async () => {
        if (isHost) {
          try { await deleteDoc(doc(db, "rooms", id)); } catch (e) {}
        }
        alert("Room ditutup karena tidak ada aktivitas.");
        router.push("/lobby");
      };
      tutupRoom();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [showIdleWarning, idleCountdown, isHost, id, router]);

  const tambahWaktuAFK = () => {
    setShowIdleWarning(false);
    setIdleLimit(300000); // Memperpanjang jadi 5 menit (300.000 ms)
  };

  // --- TIMER PERMAINAN ---
  useEffect(() => {
    if (!roomData || roomData.status !== "playing" || !roomData.startedAt) return;
    const startedAt = roomData.startedAt;
    let interval;
    const tick = () => {
      const { rd, host, ap } = latest.current;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setTimeElapsed(elapsed);
      if (!host || !rd?.pengaturan) return;
      const gameTime = elapsed - 4;
      const cfg = rd.pengaturan;
      const maxSkor = parseInt(cfg.jumlah) * 10;
      let alasan = null;
      if (gameTime >= getGameLimit(cfg)) alasan = alasanWaktu(cfg);
      else if (cfg.mode === MODE_HARTA && rd.soal && rd.soal.every((s) => s.isSelesai)) alasan = "SEMUA HARTA DITEMUKAN!";
      else if (cfg.mode === MODE_ATLET && ap.some((p) => p.skor >= maxSkor)) alasan = "BALAPAN SELESAI, ADA PEMENANG!";
      else if (cfg.mode === MODE_ALIEN && gameTime > 3 && ap.length > 0 && ap.every((p) => (p.hp ?? 3) <= 0)) alasan = "SEMUA PETUALANG KEHABISAN NYAWA!";
      if (alasan) {
        clearInterval(interval);
        akhiriGame(alasan);
      }
    };
    interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData?.status, roomData?.startedAt]);

  const gerak = async (arah) => {
    if (soalAktif || !roomData || roomData.status !== "playing" || timeElapsed < 4 || isHost) return;
    let newX = posisi.x; let newY = posisi.y;

    if (arah === "UP") newY = Math.max(0, newY - 1);
    if (arah === "DOWN") newY = Math.min(GRID_SIZE - 1, newY + 1);
    if (arah === "LEFT") newX = Math.max(0, newX - 1);
    if (arah === "RIGHT") newX = Math.min(GRID_SIZE - 1, newX + 1);

    if (newX !== posisi.x || newY !== posisi.y) {
      setPosisi({ x: newX, y: newY });
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { x: newX, y: newY });
      const currentTreasure = roomData.soal?.find((s) => s.x === newX && s.y === newY && !s.isSelesai);
      if (currentTreasure) {
        if (currentTreasure.claimedBy === null || currentTreasure.claimedBy === namaPeserta) {
          setSoalAktif(currentTreasure);
          if (currentTreasure.claimedBy === null) {
            const newSoal = [...roomData.soal];
            newSoal[newSoal.findIndex((s) => s.soalIndex === currentTreasure.soalIndex)].claimedBy = namaPeserta;
            updateDoc(doc(db, "rooms", id), { soal: newSoal });
          }
        } else {
          setFeedback({ type: "WARNING", text: `Sedang dikerjakan ${currentTreasure.claimedBy}!` });
          setTimeout(() => setFeedback(null), 2000);
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHost || roomData?.pengaturan?.mode !== MODE_HARTA) return;
      if (e.key === "ArrowUp" || e.key === "w") gerak("UP");
      if (e.key === "ArrowDown" || e.key === "s") gerak("DOWN");
      if (e.key === "ArrowLeft" || e.key === "a") gerak("LEFT");
      if (e.key === "ArrowRight" || e.key === "d") gerak("RIGHT");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posisi, soalAktif, roomData, id, namaPeserta, isHost, timeElapsed]);

  const pilihAvatar = async (emoji) => {
    if (!namaPeserta || isHost || roomData?.status !== "waiting" || !me) return;
    try { await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { avatar: emoji }); } catch (e) { console.error(e); }
  };

  const mulaiGame = async () => {
    try {
      const q = query(collection(db, "daftar_soal"), where("materi", "==", MATERI_TETAP), where("tingkat", "==", pengaturan.tingkat));
      const snapshot = await getDocs(q);
      const semua = shuffle(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      const isAlien = pengaturan.mode === MODE_ALIEN;
      // Alien Shooter memakai seluruh soal sebagai bank soal; mode lain dibatasi sesuai Jumlah
      const allSoal = isAlien ? semua : semua.slice(0, parseInt(pengaturan.jumlah));
      if (allSoal.length === 0) return alert("Soal tidak ditemukan untuk materi & tingkat ini!");

      let soalWithData;
      if (pengaturan.mode === MODE_HARTA) {
        const usedCoords = new Set();
        activePlayers.forEach((p) => usedCoords.add(`${p.x},${p.y}`));
        soalWithData = allSoal.map((soal, index) => {
          let rx, ry;
          do { rx = Math.floor(Math.random() * GRID_SIZE); ry = Math.floor(Math.random() * GRID_SIZE); } while (usedCoords.has(`${rx},${ry}`));
          usedCoords.add(`${rx},${ry}`);
          return { ...soal, soalIndex: index, x: rx, y: ry, claimedBy: null, isSelesai: false };
        });
      } else {
        soalWithData = allSoal.map((soal, index) => ({ ...soal, soalIndex: index, claimedBy: null, isSelesai: false }));
      }

      await updateDoc(doc(db, "rooms", id), {
        status: "playing", startedAt: Date.now(), alasanAkhir: null, pengaturan: { ...pengaturan, materi: MATERI_TETAP }, soal: soalWithData,
      });
    } catch (error) { alert("Gagal: " + error.message); }
  };

  const akhiriGame = async (alasan = "Dihentikan oleh Host") => {
    await updateDoc(doc(db, "rooms", id), { status: "finished", alasanAkhir: alasan });
  };

  const jawabSoalHarta = async (jawabanDipilih) => {
    const isBenar = jawabanDipilih === soalAktif.jawabanBenar;
    setFeedback({ type: isBenar ? "BENAR" : "SALAH", text: isBenar ? "HARTA DIDAPAT! 🎉" : "SALAH JAWAB! ❌" });

    const newSoal = [...roomData.soal];
    const tIndex = newSoal.findIndex((s) => s.soalIndex === soalAktif.soalIndex);
    if (isBenar) {
      const skorBaru = mySkor + 10;
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
      newSoal[tIndex].isSelesai = true;
    } else {
      newSoal[tIndex].claimedBy = null;
    }

    await updateDoc(doc(db, "rooms", id), { soal: newSoal });
    setTimeout(() => { setFeedback(null); setSoalAktif(null); }, 1500);
  };

  const jawabSoalAtlet = async (jawaban) => {
    const isBenar = jawaban === roomData.soal[localSoalIndex % roomData.soal.length]?.jawabanBenar;
    setFeedback({ type: isBenar ? "BENAR" : "SALAH", text: isBenar ? "LARI 1 LANGKAH! 🏃‍♂️💨" : "TETAP DI TEMPAT! ❌" });
    if (isBenar) {
      const skorBaru = mySkor + 10;
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
    }
    setAtletView("TRACK");
    setTimeout(() => {
      setFeedback(null);
      setLocalSoalIndex((prev) => prev + 1);
      setAtletView("SOAL");
    }, 2500);
  };

  // Alien Shooter: skor & nyawa disimpan ke data pemain supaya leaderboard host ikut bergerak
  const simpanProgressAlien = ({ skor, hp }) => {
    updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor, hp }).catch(() => {});
  };

  /* ---------- RENDER ---------- */
  if (!roomData) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Navigation size={48} className="text-[#00f3ff] animate-spin" />
        <h2 className="font-bold text-xl tracking-widest text-[#00f3ff]">MEMUAT ARENA...</h2>
      </div>
    </div>
  );

  const temaAktif = roomData.tema || "galaxy";
  const modeGame = roomData.pengaturan?.mode || MODE_HARTA;
  const isPlaying = roomData.status === "playing";
  const gameStarted = isPlaying && timeElapsed >= 4;
  const sisaWaktu = Math.max(0, getGameLimit(roomData.pengaturan) + 4 - timeElapsed);
  const avatarList = THEME_AVATARS[temaAktif] || THEME_AVATARS.galaxy;
  const myAvatar = me?.avatar || getIconForPlayer(namaPeserta || "?", temaAktif);
  const modeDipilih = MODES.find((m) => m.id === pengaturan.mode) || MODES[0];
  const terlaluBanyakPembalap = pengaturan.mode === MODE_ATLET && activePlayers.length > MAX_RACERS;
  const soalAtlet = roomData.soal?.[localSoalIndex % (roomData.soal?.length || 1)];

  return (
    <main className={`theme-${temaAktif} h-[100dvh] relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000 select-none`}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <BackgroundCanvas
        tema={temaAktif}
        particlesEnabled={particlesEnabled}
        musicEnabled={musicEnabled}
        volume={volume}
        forcePauseMusic={true}
      />

      {/* --- MODAL PERINGATAN AFK --- */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel p-8 md:p-10 w-full max-w-sm text-center border-t-4 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <AlertTriangle size={64} className="mx-auto text-rose-500 mb-4 animate-pulse" />
            <h2 className="text-2xl font-black mb-2 tracking-wide">ARENA SEPI!</h2>
            <p className="text-[var(--text-muted)] text-sm font-medium mb-6">
              Room akan segera ditutup dalam <br />
              <span className="text-5xl font-black text-rose-400 drop-shadow-md my-3 block">{idleCountdown}</span>
              detik untuk menghemat server.
            </p>
            <button
              onClick={tambahWaktuAFK}
              className="w-full py-4 rounded-xl font-black text-base bg-rose-500 text-white hover:bg-rose-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            >
              SAYA MASIH DI SINI! (+5 Menit)
            </button>
          </div>
        </div>
      )}

      {/* --- HITUNG MUNDUR --- */}
      {isPlaying && timeElapsed < 4 && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <span key={timeElapsed} className="animate-countPop text-[150px] md:text-[200px] leading-none font-black text-gradient drop-shadow-[0_0_50px_var(--primary)]">
            {timeElapsed < 3 ? 3 - timeElapsed : "GO!"}
          </span>
          <p className="mt-8 text-xl md:text-2xl text-white font-bold tracking-[0.5em] uppercase">Bersiaplah, Komandan!</p>
        </div>
      )}

      {/* --- TIMER + PERINGKAT (Alien Shooter siswa punya HUD sendiri) --- */}
      {gameStarted && (isHost || modeGame !== MODE_ALIEN) && (
        <div className="absolute top-4 w-full flex flex-col items-center gap-1.5 z-50 pointer-events-none">
          <TimerPill sisa={sisaWaktu} />
          {!isHost && <RankPill rank={myRank} total={activePlayers.length} />}
        </div>
      )}

      {/* ============ SISWA: BERBURU HARTA KARUN ============ */}
      {gameStarted && !isHost && modeGame === MODE_HARTA && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pb-20 pt-24">
          {feedback?.type === "WARNING" && (
            <div className="absolute top-24 bg-rose-500/90 text-white font-bold px-6 py-3 rounded-full z-50 animate-bounce shadow-2xl flex items-center gap-2 text-sm">
              <XOctagon size={18} /> {feedback.text}
            </div>
          )}

          <div className="mapbox map-size relative aspect-square glass-panel p-0 overflow-hidden shadow-[var(--glow-shadow)] mx-auto border-2 border-[var(--primary)]/30">
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
              {Array.from({ length: 100 }).map((_, i) => (<div key={i} className={`border border-white/5 ${(Math.floor(i / 10) + (i % 10)) % 2 === 0 ? "bg-white/5" : "bg-transparent"}`} />))}
            </div>
            {roomData.soal?.map((s) => !s.isSelesai && (
              <div key={s.soalIndex} className="absolute w-[10%] h-[10%] flex items-center justify-center" style={{ left: `${s.x * 10}%`, top: `${s.y * 10}%` }}>
                <div className={`relative w-full h-full flex items-center justify-center ${s.claimedBy ? "opacity-40 grayscale scale-90" : "animate-bounce"}`}>
                  <div className="absolute inset-[15%] bg-amber-400 blur-md opacity-40 rounded-full"></div>
                  <Gift style={{ width: "62%", height: "62%" }} className={`relative z-10 ${s.claimedBy ? "text-gray-400" : "text-amber-400 drop-shadow-lg"}`} />
                </div>
                {s.claimedBy && s.claimedBy !== namaPeserta && (<span className="map-tag absolute -top-1 bg-rose-500/90 px-1 rounded text-white font-bold z-30">{s.claimedBy}</span>)}
              </div>
            ))}

            {activePlayers.map((p) => {
              const aku = p.nama === namaPeserta;
              return (
                <div key={p.nama} className="absolute w-[10%] h-[10%] flex items-center justify-center transition-all duration-300 z-20" style={{ left: `${p.x * 10}%`, top: `${p.y * 10}%` }}>
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div className={`map-avatar w-[84%] h-[84%] rounded-full flex items-center justify-center transition-all border ${aku ? "bg-[var(--primary)]/90 border-white shadow-[var(--glow-shadow)] scale-110 z-30" : "bg-white/20 border-white/50 backdrop-blur-md z-10"}`}>
                      <span className="drop-shadow-md">{avatarOf(p, temaAktif)}</span>
                    </div>
                    <span className={`map-tag absolute font-black px-1.5 py-0.5 rounded whitespace-nowrap z-40 ${aku ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-md" : "bg-black/70 text-white"}`} style={{ bottom: "-16%" }}>{p.nama}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 z-30 md:hidden">
            <button onClick={() => gerak("UP")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronUp size={32} /></button>
            <div className="flex gap-4">
              <button onClick={() => gerak("LEFT")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronLeft size={32} /></button>
              <div className="w-14 h-14 flex items-center justify-center opacity-30"><Navigation size={24} className="text-[var(--primary)]" /></div>
              <button onClick={() => gerak("RIGHT")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronRight size={32} /></button>
            </div>
            <button onClick={() => gerak("DOWN")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronDown size={32} /></button>
          </div>

          {soalAktif && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="glass-panel p-6 md:p-10 w-full max-w-xl text-center relative border-[var(--primary)]/50 shadow-[var(--glow-shadow)]">
                {feedback && feedback.type !== "WARNING" && (
                  <div className="absolute inset-0 glass-panel border-none rounded-2xl flex flex-col items-center justify-center z-20" style={{ background: "var(--glass-bg)" }}>
                    {feedback.type === "BENAR" ? (
                      <><ShieldCheck size={80} className="text-emerald-400 mb-3 animate-bounce" /><h1 className="text-3xl md:text-4xl font-black text-emerald-400">{feedback.text}</h1><p className="mt-2 text-emerald-200 font-bold">+10 Poin</p></>
                    ) : (
                      <><XOctagon size={80} className="text-rose-400 mb-3 animate-pulse" /><h1 className="text-3xl md:text-4xl font-black text-rose-400">{feedback.text}</h1><p className="mt-2 text-rose-200 font-bold">Soal lepas ke arena!</p></>
                    )}
                  </div>
                )}
                <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-black px-5 py-2 rounded-full border border-[var(--primary)]/40 tracking-widest mb-6">SOAL HARTA KARUN</span>
                <p className="mb-6 text-lg md:text-xl font-bold leading-relaxed">{soalAktif.pertanyaan}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {soalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => jawabSoalHarta(opsi)} className="glass-btn p-5 rounded-xl font-bold text-base hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] active:scale-95 transition-all">{opsi}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ SISWA: BALAPAN LARI ============ */}
      {gameStarted && !isHost && modeGame === MODE_ATLET && (
        <div className="absolute inset-0 z-10 flex flex-col items-center gap-3 md:gap-4 px-3 md:px-6 pt-[7.5rem] pb-4 overflow-y-auto custom-scrollbar">
          {/* Lintasan selalu tampil dan tidak pernah dibuat ulang, jadi tidak berkedip */}
          <div className="w-full max-w-4xl shrink-0">
            <TrackComponent players={activePlayers} pengaturan={roomData.pengaturan} tema={temaAktif} myName={namaPeserta} compact />
          </div>

          <div className="glass-panel p-5 md:p-8 w-full max-w-3xl text-center relative border-[var(--primary)]/50 shadow-[var(--glow-shadow)] shrink-0">
            {atletView === "TRACK" && feedback && (
              <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center z-20 animate-fadeIn" style={{ background: "var(--glass-bg)", backdropFilter: "blur(10px)" }}>
                {feedback.type === "BENAR" ? <ShieldCheck size={56} className="text-emerald-400 mb-2" /> : <XOctagon size={56} className="text-rose-400 mb-2" />}
                <h2 className={`text-2xl md:text-3xl font-black ${feedback.type === "BENAR" ? "text-emerald-400" : "text-rose-400"}`}>{feedback.text}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)] font-bold">Pertanyaan selanjutnya segera muncul...</p>
              </div>
            )}
            <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-black px-6 py-2 rounded-full border border-[var(--primary)]/40 tracking-widest mb-5">PERTANYAAN #{localSoalIndex + 1}</span>
            <p className="mb-6 text-lg md:text-2xl font-bold leading-relaxed">{soalAtlet?.pertanyaan}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {soalAtlet?.opsi.map((opsi, idx) => (
                <button key={idx} disabled={atletView !== "SOAL"} onClick={() => jawabSoalAtlet(opsi)} className="glass-btn p-4 md:p-5 rounded-2xl font-bold text-base md:text-lg hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] active:scale-95 flex items-center justify-center transition-all disabled:opacity-60">{opsi}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ SISWA: ALIEN SHOOTER ============ */}
      {gameStarted && !isHost && modeGame === MODE_ALIEN && (
        <AlienShooter
          pool={roomData.soal || []}
          tingkat={roomData.pengaturan?.tingkat}
          tema={temaAktif}
          nama={namaPeserta}
          avatar={myAvatar}
          initialScore={mySkor}
          initialHp={me?.hp ?? 3}
          sisaWaktu={sisaWaktu}
          myRank={myRank}
          total={activePlayers.length}
          onProgress={simpanProgressAlien}
        />
      )}

      {/* ============ HOST: SELAMA PERMAINAN ============ */}
      {isHost && gameStarted && (
        <div className="absolute inset-0 z-10 flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 w-full max-w-[1500px] mx-auto overflow-y-auto lg:overflow-hidden pt-28 pb-6 custom-scrollbar">
          <section className={`glass-panel flex flex-col p-4 md:p-6 shadow-[var(--glow-shadow)] min-h-[360px] lg:min-h-0 overflow-hidden border-t-4 border-t-yellow-400 ${modeGame === MODE_ALIEN ? "w-full max-w-5xl mx-auto flex-1" : "lg:flex-1"}`}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--glass-border)]">
              <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
              <h2 className="text-xl md:text-2xl font-black text-yellow-400 tracking-wide drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">Live Leaderboard</h2>
              <span className="ml-auto text-xs font-black px-3 py-1 rounded-full border border-[var(--glass-border)] bg-[var(--primary)]/10 text-[var(--primary)]">{MODES.find((m) => m.id === modeGame)?.label}</span>
            </div>

            <Leaderboard players={activePlayers} tema={temaAktif} showHp={modeGame === MODE_ALIEN} className="flex-1 min-h-0" />

            <button onClick={() => akhiriGame("Dihentikan Paksa oleh Guru (Stop)")} className="mt-4 w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white py-3 md:py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <XSquare size={20} /> Hentikan Permainan
            </button>
          </section>

          {modeGame !== MODE_ALIEN && (
            <section className="lg:flex-[1.5] glass-panel p-4 md:p-6 shadow-[var(--glow-shadow)] flex flex-col relative overflow-hidden border-t-4 border-t-[var(--primary)] min-h-[360px] lg:min-h-0">
              <h2 className="text-lg md:text-xl font-black text-[var(--primary)] flex items-center gap-2 mb-4 border-b border-[var(--glass-border)] pb-4">
                <Map size={24} /> Pantauan Arena Live
              </h2>
              <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden w-full">
                {modeGame === MODE_HARTA ? (
                  <MiniMapKumpulkanHarta rData={roomData} rPlayers={activePlayers} tema={temaAktif} />
                ) : (
                  <TrackComponent players={activePlayers} pengaturan={roomData.pengaturan} tema={temaAktif} myName="" />
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ============ LOBI PETUALANG (menunggu) ============ */}
      {roomData.status === "waiting" && (
        <div className="relative z-20 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar">
          <div className="mx-auto w-full max-w-6xl min-h-full lg:h-full flex flex-col gap-3 md:gap-4 px-3 md:px-6 py-3 md:py-5 animate-fadeIn">
            <header className="shrink-0 text-center">
              <span className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase px-4 py-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)]">
                <Navigation size={12} /> Lobi Petualang
              </span>
              <h2 className="mt-2 text-3xl md:text-5xl font-black text-gradient tracking-tight">{roomData.nama_room}</h2>
              <p className="mt-1 text-[var(--text-muted)] font-medium uppercase tracking-widest text-xs md:text-sm">Tema Dunia: {roomData.tema}</p>
            </header>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 md:gap-4">
              {/* ---- KIRI ---- */}
              {isHost ? (
                <section className="glass-panel lg:w-[380px] xl:w-[420px] shrink-0 p-4 md:p-5 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar border-t-4 border-t-[var(--primary)] shadow-[var(--glow-shadow)]">
                  <h3 className="font-black text-lg flex items-center gap-2 pb-3 border-b border-[var(--glass-border)]">
                    <Settings2 size={20} className="text-[var(--primary)]" /> Pengaturan Permainan
                  </h3>

                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] mb-2">Pilih Mode Permainan</p>
                    <div className="grid gap-2">
                      {MODES.map((m) => {
                        const Icon = m.icon;
                        const aktif = pengaturan.mode === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPengaturan({ ...pengaturan, mode: m.id })}
                            className={`flex items-center gap-3 text-left rounded-xl border p-3 transition-all active:scale-[0.98] ${aktif ? "border-[var(--primary)] bg-[var(--primary)]/15 shadow-[var(--glow-shadow)]" : "border-[var(--glass-border)] bg-black/20 hover:border-[var(--primary)]/60"}`}
                          >
                            <span className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center ${aktif ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--primary)]/15 text-[var(--primary)]"}`}>
                              <Icon size={22} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <b className="block text-sm">{m.label}</b>
                              <small className="block text-xs text-[var(--text-muted)] leading-snug">{m.desc}</small>
                            </span>
                            {aktif && <Check size={18} className="shrink-0 text-[var(--primary)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-2"><BarChart size={14} /> Kesulitan</label>
                    <Segmented
                      value={pengaturan.tingkat}
                      onChange={(v) => setPengaturan({ ...pengaturan, tingkat: v })}
                      options={[{ value: "Mudah", label: "Mudah" }, { value: "Sedang", label: "Sedang" }, { value: "Sulit", label: "Sulit" }]}
                    />
                  </div>

                  {pengaturan.mode === MODE_ALIEN ? (
                    <div>
                      <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-2"><Timer size={14} /> Durasi Pertempuran</label>
                      <Segmented
                        value={pengaturan.durasi}
                        onChange={(v) => setPengaturan({ ...pengaturan, durasi: v })}
                        options={[{ value: 2, label: "2 Menit" }, { value: 3, label: "3 Menit" }, { value: 5, label: "5 Menit" }]}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-2">
                        <Hash size={14} /> {pengaturan.mode === MODE_HARTA ? "Jumlah Harta Karun" : "Langkah Menuju Finis"}
                      </label>
                      <Segmented
                        value={pengaturan.jumlah}
                        onChange={(v) => setPengaturan({ ...pengaturan, jumlah: v })}
                        options={[{ value: 5, label: "5" }, { value: 10, label: "10" }, { value: 15, label: "15" }]}
                      />
                    </div>
                  )}

                  {terlaluBanyakPembalap && (
                    <p className="text-rose-400 text-xs font-bold text-center">⚠️ Maksimal {MAX_RACERS} pemain untuk mode Balapan Lari!</p>
                  )}

                  <button
                    disabled={terlaluBanyakPembalap}
                    onClick={mulaiGame}
                    className="w-full py-4 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-2 mt-auto transition-transform hover:scale-[1.03] active:scale-95 shadow-[var(--glow-shadow)] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                  >
                    <Play fill="currentColor" size={20} /> {modeDipilih.start}
                  </button>
                </section>
              ) : (
                <section className="glass-panel lg:w-[380px] xl:w-[420px] shrink-0 p-4 md:p-5 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar border-t-4 border-t-[var(--primary)] shadow-[var(--glow-shadow)]">
                  <h3 className="font-black text-lg flex items-center gap-2 pb-3 border-b border-[var(--glass-border)]">
                    <Users size={20} className="text-[var(--primary)]" /> Pilih Karaktermu
                  </h3>

                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--primary)]/10 py-4">
                    <AvatarBubble emoji={myAvatar} size="xl" glow className="animate-floatY" />
                    <p className="font-black text-lg">{namaPeserta}</p>
                    <p className="text-xs text-[var(--text-muted)] text-center px-4">Karakter ini menemanimu sampai permainan selesai.</p>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
                    {avatarList.map((em) => {
                      const aktif = myAvatar === em;
                      return (
                        <button
                          key={em}
                          type="button"
                          onClick={() => pilihAvatar(em)}
                          className={`aspect-square rounded-2xl text-3xl flex items-center justify-center border-2 transition-all active:scale-90 ${aktif ? "border-[var(--primary)] bg-[var(--primary)]/25 shadow-[var(--glow-shadow)] scale-105" : "border-[var(--glass-border)] bg-black/20 hover:border-[var(--primary)]/60"}`}
                        >
                          {em}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto rounded-2xl border border-dashed border-[var(--glass-border)] p-4 text-center">
                    <p className="font-bold text-sm">Menunggu Host memulai petualangan...</p>
                  </div>
                </section>
              )}

              {/* ---- KANAN: petualang yang sudah masuk ---- */}
              <section className="glass-panel flex-1 min-w-0 min-h-[300px] lg:min-h-0 p-4 md:p-5 flex flex-col gap-3 border-t-4 border-t-[var(--secondary)]">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--glass-border)]">
                  <h3 className="font-black text-lg flex items-center gap-2"><Navigation size={20} className="text-[var(--primary)]" /> Pasukan Petualang</h3>
                  <span className="px-3 py-1 rounded-full text-sm font-black bg-[var(--primary)]/15 border border-[var(--glass-border)] text-[var(--primary)]">{activePlayers.length} Pemain</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                  <PlayerRoster players={activePlayers} tema={temaAktif} myName={namaPeserta} />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ============ KLASEMEN AKHIR ============ */}
      {roomData.status === "finished" && (
        <div className="relative z-20 flex-1 min-h-0 flex items-center justify-center p-4 md:p-6">
          <div className="glass-panel p-6 md:p-8 w-full max-w-2xl max-h-full flex flex-col text-center border-t-4 border-t-[var(--primary)] shadow-[var(--glow-shadow)] animate-fadeIn">
            <div className="shrink-0">
              <div className="inline-block p-4 rounded-full bg-[var(--primary)]/20 mb-3 border border-[var(--primary)]/30"><Trophy size={48} className="text-[var(--primary)] drop-shadow-[0_0_15px_var(--primary)]" /></div>
              <h2 className="text-3xl md:text-4xl font-black mb-2 text-gradient tracking-tight">KLASEMEN AKHIR</h2>
              <p className="text-rose-400 font-bold mb-4 text-sm flex items-center justify-center gap-2"><XOctagon size={16} /> {roomData.alasanAkhir || "Permainan Berakhir"}</p>
            </div>

            <Leaderboard players={activePlayers} tema={temaAktif} showHp={modeGame === MODE_ALIEN} singleColumn className="flex-1 min-h-0 text-left mb-5" />

            <button onClick={() => router.push("/lobby")} className="shrink-0 w-full py-4 rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-[var(--glow-shadow)]" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>Kembali ke Lobby</button>
          </div>
        </div>
      )}
    </main>
  );
}
