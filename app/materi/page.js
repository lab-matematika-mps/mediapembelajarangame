"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, XCircle, 
  RotateCcw, Sparkles, MousePointerClick, AlertTriangle, ShieldCheck,
  Volume2
} from "lucide-react";
import BackgroundCanvas from "../../components/BackgroundCanvas";

// ==========================================
// DATA & KONSTANTA SVG (AKURASI GEOMETRI)
// ==========================================
const SHAPES = {
  samaSisi: <polygon points="50,15.36 10,84.64 90,84.64" />, 
  samaKaki: <polygon points="50,10 20,90 80,90" />, 
  sembarang: <polygon points="10,80 80,90 40,10" />, 
  persegi: <polygon points="20,20 80,20 80,80 20,80" />, 
  persegiPanjang: <polygon points="10,30 90,30 90,70 10,70" />, 
  trapesium: <polygon points="30,20 70,20 90,80 10,80" />, 
  jajarGenjang: <polygon points="30,20 90,20 70,80 10,80" />, 
  layangLayang: <polygon points="50,10 80,40 50,90 20,40" />, 
  belahKetupat: <polygon points="50,10 90,50 50,90 10,50" />, 
  lingkaran: <circle cx="50" cy="50" r="40" />,
  segiLima: <polygon points="50,10 88,38 74,82 26,82 12,38" />,
  segiEnam: <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" />
};

// Warna bangun mengikuti tema: kode lama dipetakan ke token --sc1..--sc8 (didefinisikan per tema di CSS)
const COLOR_TOKEN = {
  "#fef08a": 1, "#a7f3d0": 2, "#fbcfe8": 3, "#bfdbfe": 4, "#fde047": 5, "#e9d5ff": 6,
  "#99f6e4": 7, "#fecaca": 8, "#fed7aa": 5, "#d9f99d": 7, "#bae6fd": 4,
};
const themed = (c) => (COLOR_TOKEN[c] ? `var(--sc${COLOR_TOKEN[c]})` : c);

// Data Slide: Identifikasi Segitiga
const SLIDE2_DATA = [
  { id: "s2_1", shape: SHAPES.samaSisi, isTriangle: true, color: "#fef08a" },
  { id: "s2_2", shape: SHAPES.persegi, isTriangle: false, color: "#a7f3d0" },
  { id: "s2_3", shape: SHAPES.samaKaki, isTriangle: true, color: "#fbcfe8", rotate: "rotate(45deg)" },
  { id: "s2_4", shape: SHAPES.sembarang, isTriangle: true, color: "#bfdbfe" },
  { id: "s2_5", shape: SHAPES.trapesium, isTriangle: false, color: "#fde047" },
  { id: "s2_6", shape: SHAPES.persegiPanjang, isTriangle: false, color: "#e9d5ff" },
  { id: "s2_7", shape: SHAPES.samaSisi, isTriangle: true, color: "#99f6e4", rotate: "rotate(180deg)" },
  { id: "s2_8", shape: SHAPES.layangLayang, isTriangle: false, color: "#fecaca" },
  { id: "s2_9", shape: SHAPES.samaKaki, isTriangle: true, color: "#fed7aa" },
  { id: "s2_10", shape: SHAPES.sembarang, isTriangle: true, color: "#d9f99d", rotate: "rotate(-30deg)" },
  { id: "s2_11", shape: SHAPES.jajarGenjang, isTriangle: false, color: "#bae6fd" },
];

// Data Slide: Klasifikasi Segitiga
const SLIDE4_DATA = [
  { id: "c4_1", shape: SHAPES.samaSisi, type: "SAMA_SISI", color: "#fef08a" },
  { id: "c4_2", shape: SHAPES.samaKaki, type: "SAMA_KAKI", color: "#a7f3d0", rotate: "rotate(90deg)" },
  { id: "c4_3", shape: SHAPES.sembarang, type: "SEMBARANG", color: "#fbcfe8" },
  { id: "c4_4", shape: SHAPES.samaSisi, type: "SAMA_SISI", color: "#bfdbfe", rotate: "rotate(180deg)" },
  { id: "c4_5", shape: SHAPES.sembarang, type: "SEMBARANG", color: "#e9d5ff", rotate: "rotate(45deg)" },
  { id: "c4_6", shape: SHAPES.samaKaki, type: "SAMA_KAKI", color: "#fde047" },
  { id: "c4_7", shape: SHAPES.samaSisi, type: "SAMA_SISI", color: "#fecaca", rotate: "rotate(30deg)" },
  { id: "c4_8", shape: SHAPES.samaKaki, type: "SAMA_KAKI", color: "#bae6fd", rotate: "rotate(-45deg)" },
  { id: "c4_9", shape: SHAPES.sembarang, type: "SEMBARANG", color: "#d9f99d", rotate: "rotate(120deg)" },
];

// Data Slide: Identifikasi Segi Empat
const SLIDE5_DATA = [
  { id: "s5_1", shape: SHAPES.persegi, isQuad: true, color: "#a7f3d0" },
  { id: "s5_2", shape: SHAPES.samaKaki, isQuad: false, color: "#fbcfe8" },
  { id: "s5_3", shape: SHAPES.trapesium, isQuad: true, color: "#fef08a" },
  { id: "s5_4", shape: SHAPES.lingkaran, isQuad: false, color: "#bfdbfe" },
  { id: "s5_5", shape: SHAPES.belahKetupat, isQuad: true, color: "#e9d5ff" },
  { id: "s5_6", shape: SHAPES.segiLima, isQuad: false, color: "#fde047" },
  { id: "s5_7", shape: SHAPES.layangLayang, isQuad: true, color: "#fecaca" },
  { id: "s5_8", shape: SHAPES.samaSisi, isQuad: false, color: "#99f6e4" },
  { id: "s5_9", shape: SHAPES.jajarGenjang, isQuad: true, color: "#fed7aa" },
  { id: "s5_10", shape: SHAPES.segiEnam, isQuad: false, color: "#d9f99d" },
  { id: "s5_11", shape: SHAPES.persegiPanjang, isQuad: true, color: "#bae6fd" },
];

// Data Slide: Klasifikasi Segi Empat 1 (Persegi, Persegi Panjang, Trapesium)
const SLIDE7_DATA = [
  { id: "c7_1", shape: SHAPES.persegi, type: "PERSEGI", color: "#fef08a" },
  { id: "c7_2", shape: SHAPES.persegiPanjang, type: "PERSEGI_PANJANG", color: "#a7f3d0", rotate: "rotate(90deg)" },
  { id: "c7_3", shape: SHAPES.trapesium, type: "TRAPESIUM", color: "#fbcfe8" },
  { id: "c7_4", shape: SHAPES.persegi, type: "PERSEGI", color: "#bfdbfe", rotate: "rotate(45deg)" },
  { id: "c7_5", shape: SHAPES.trapesium, type: "TRAPESIUM", color: "#e9d5ff", rotate: "rotate(180deg)" },
  { id: "c7_6", shape: SHAPES.persegiPanjang, type: "PERSEGI_PANJANG", color: "#fde047" },
  { id: "c7_7", shape: SHAPES.trapesium, type: "TRAPESIUM", color: "#fecaca", rotate: "rotate(90deg)" },
  { id: "c7_8", shape: SHAPES.persegi, type: "PERSEGI", color: "#bae6fd", rotate: "rotate(15deg)" },
  { id: "c7_9", shape: SHAPES.persegiPanjang, type: "PERSEGI_PANJANG", color: "#d9f99d", rotate: "rotate(45deg)" },
];

// Data Slide: Klasifikasi Segi Empat 2 (Jajar Genjang, Layang-layang, Belah Ketupat)
const SLIDE9_DATA = [
  { id: "c9_1", shape: SHAPES.jajarGenjang, type: "JAJAR_GENJANG", color: "#fef08a" },
  { id: "c9_2", shape: SHAPES.layangLayang, type: "LAYANG_LAYANG", color: "#a7f3d0", rotate: "rotate(90deg)" },
  { id: "c9_3", shape: SHAPES.belahKetupat, type: "BELAH_KETUPAT", color: "#fbcfe8" },
  { id: "c9_4", shape: SHAPES.jajarGenjang, type: "JAJAR_GENJANG", color: "#bfdbfe", rotate: "rotate(180deg)" },
  { id: "c9_5", shape: SHAPES.belahKetupat, type: "BELAH_KETUPAT", color: "#e9d5ff", rotate: "rotate(45deg)" },
  { id: "c9_6", shape: SHAPES.layangLayang, type: "LAYANG_LAYANG", color: "#fde047" },
  { id: "c9_7", shape: SHAPES.belahKetupat, type: "BELAH_KETUPAT", color: "#fecaca", rotate: "rotate(90deg)" },
  { id: "c9_8", shape: SHAPES.jajarGenjang, type: "JAJAR_GENJANG", color: "#bae6fd", rotate: "rotate(45deg)" },
  { id: "c9_9", shape: SHAPES.layangLayang, type: "LAYANG_LAYANG", color: "#d9f99d", rotate: "rotate(180deg)" },
];

// ==========================================
// DATA SLIDE BARU: BAGIAN-BAGIAN BANGUN DATAR (PERSEGI)
// Koordinat persegi pada kanvas 240 x 240
// ==========================================
const PART_INFO = {
  sisi: {
    label: "Sisi", total: 4,
    def: "Sisi adalah garis lurus yang membatasi sebuah bangun datar.",
    result: "Persegi memiliki 4 sisi.",
    extra: "Keempat sisinya sama panjang.",
  },
  sudut: {
    label: "Sudut", total: 4,
    def: "Sudut terbentuk saat dua sisi bertemu. Titik pertemuannya disebut titik sudut.",
    result: "Persegi memiliki 4 sudut.",
    extra: "Semua sudutnya siku-siku, besarnya 90°.",
  },
  diagonal: {
    label: "Diagonal", total: 2,
    def: "Diagonal adalah garis yang menghubungkan dua titik sudut yang tidak bersebelahan.",
    result: "Persegi memiliki 2 diagonal.",
    extra: "Kedua diagonalnya sama panjang dan berpotongan tegak lurus.",
  },
};

const SQ_SIDES = [
  { x1: 50, y1: 50, x2: 190, y2: 50, lx: 120, ly: 26, tick: [120, 44, 120, 56] },
  { x1: 190, y1: 50, x2: 190, y2: 190, lx: 214, ly: 120, tick: [184, 120, 196, 120] },
  { x1: 190, y1: 190, x2: 50, y2: 190, lx: 120, ly: 214, tick: [120, 184, 120, 196] },
  { x1: 50, y1: 190, x2: 50, y2: 50, lx: 26, ly: 120, tick: [44, 120, 56, 120] },
];
const SQ_CORNERS = [
  { x: 50, y: 50, l: "A", nx: 28, ny: 28, m: "M66 50 L66 66 L50 66" },
  { x: 190, y: 50, l: "B", nx: 212, ny: 28, m: "M174 50 L174 66 L190 66" },
  { x: 190, y: 190, l: "C", nx: 212, ny: 212, m: "M174 190 L174 174 L190 174" },
  { x: 50, y: 190, l: "D", nx: 28, ny: 212, m: "M66 190 L66 174 L50 174" },
];
const SQ_DIAGS = [
  { x1: 50, y1: 50, x2: 190, y2: 190, bx: 78, by: 78, name: "AC" },
  { x1: 190, y1: 50, x2: 50, y2: 190, bx: 162, by: 78, name: "BD" },
];

// Peta petualangan (dipakai di slide pembatas)
const ADVENTURE_STOPS = ["Bagian Bangun Datar", "Segitiga", "Segi Empat", "Evaluasi"];

// ==========================================
// KOMPONEN BANTU SVG
// ==========================================
const ShapeSVG = ({ shape, color, rotate = "none", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full overflow-visible ${className}`} style={{ transform: rotate, filter: "drop-shadow(0 0 6px var(--shape-glow))" }}>
    <g fill={themed(color)} stroke="var(--shape-stroke)" strokeWidth="4" strokeLinejoin="round">{shape}</g>
  </svg>
);

// Ikon kecil untuk kotak Sisi / Sudut / Diagonal
const PartIcon = ({ kind }) => (
  <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {kind === "sisi" && (<><rect x="8" y="8" width="24" height="24" strokeOpacity=".3" /><line x1="8" y1="8" x2="32" y2="8" strokeWidth="5" /></>)}
    {kind === "sudut" && (<><path d="M8 8 V32 H32" /><path d="M8 24 H16 V32" strokeWidth="2.5" /></>)}
    {kind === "diagonal" && (<><rect x="8" y="8" width="24" height="24" strokeOpacity=".3" /><line x1="8" y1="8" x2="32" y2="32" strokeDasharray="3 4" /></>)}
  </svg>
);

// Peta kemajuan petualangan: menunjukkan batas tiap bagian materi
const AdventureRail = ({ active }) => {
  const last = ADVENTURE_STOPS.length - 1;
  const pct = (i) => `${(i / last) * 100}%`;
  return (
    <div className="w-full max-w-2xl mx-auto mb-10 px-8">
      <div className="relative flex justify-between">
        <div className="absolute top-4 left-4 right-4 h-1.5 rounded-full bg-black/30 border border-white/10 overflow-hidden">
          <div className="rail-fill h-full rounded-full bg-[var(--primary)]" style={{ "--from": pct(Math.max(0, active - 1)), "--to": pct(active) }} />
        </div>
        {ADVENTURE_STOPS.map((name, i) => {
          const isDone = i < active;
          const isActive = i === active;
          return (
            <div key={name} className="relative z-10 w-8 flex flex-col items-center">
              {isActive && <span className="corner-ring absolute top-0 w-8 h-8 rounded-full border-2 border-[var(--primary)]" />}
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${isDone ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--on-primary)]" : isActive ? "bg-[var(--primary)] border-white text-[var(--on-primary)] shadow-[var(--glow-shadow)]" : "bg-black/40 border-white/20 text-[var(--text-muted)]"}`}>
                {isDone ? <CheckCircle2 size={16} /> : i + 1}
              </span>
              <span className={`absolute top-10 text-[10px] md:text-xs font-bold whitespace-nowrap ${isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function PetualanganMateri() {
  const router = useRouter();

  // STATE GLOBAL
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("galaxy");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 15; // 12 slide lama + 3 slide baru

  // State Slide Bagian-Bagian Bangun Datar
  const [partActive, setPartActive] = useState(null); // 'sisi' | 'sudut' | 'diagonal' | null
  const [partStep, setPartStep] = useState(0);
  const [partExplored, setPartExplored] = useState([]);

  // State Slide Identifikasi Segitiga
  const [s2Selected, setS2Selected] = useState([]);
  const [s2Checked, setS2Checked] = useState(false);
  // State Slide Flashcard Segitiga
  const [s3Flipped, setS3Flipped] = useState({ 1: false, 2: false, 3: false });
  
  // State Slide D&D Segitiga
  const [s4Placements, setS4Placements] = useState({});
  const [s4Checked, setS4Checked] = useState(false);
  const [s4SelectedCard, setS4SelectedCard] = useState(null);

  // State Slide Identifikasi Segi Empat
  const [s5Selected, setS5Selected] = useState([]);
  const [s5Checked, setS5Checked] = useState(false);
  // State Slide Flashcard Segi Empat 1
  const [s6Flipped, setS6Flipped] = useState({ 1: false, 2: false, 3: false });
  
  // State Slide D&D Segi Empat 1
  const [s7Placements, setS7Placements] = useState({});
  const [s7Checked, setS7Checked] = useState(false);
  const [s7SelectedCard, setS7SelectedCard] = useState(null);

  // State Slide Flashcard Segi Empat 2
  const [s8Flipped, setS8Flipped] = useState({ 1: false, 2: false, 3: false });

  // State Slide D&D Segi Empat 2
  const [s9Placements, setS9Placements] = useState({});
  const [s9Checked, setS9Checked] = useState(false);
  const [s9SelectedCard, setS9SelectedCard] = useState(null);

  // State Quiz
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizChecked, setQuizChecked] = useState({});

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    const tema = localStorage.getItem("tema_bg") || "galaxy";
    if (!nama) return router.push("/");
    setNamaPeserta(nama);
    setTemaBg(tema);
    setMusicEnabled(localStorage.getItem("musicEnabled") === "true");
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
    const savedVol = localStorage.getItem("bgVolume");
    if (savedVol) setVolume(parseFloat(savedVol));
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (s4SelectedCard || s7SelectedCard || s9SelectedCard) return; 

      if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) setCurrentSlide(prev => prev + 1);
      if (e.key === 'ArrowLeft' && currentSlide > 0) setCurrentSlide(prev => prev - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, s4SelectedCard, s7SelectedCard, s9SelectedCard]);

  // ==========================================
  // FITUR TEXT-TO-SPEECH (SUARA)
  // ==========================================
  const playTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9; // Agak diperlambat agar jelas untuk anak-anak
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Maaf, browsermu tidak mendukung fitur suara.");
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  // Hentikan suara & tutup penjelasan bagian bangun datar jika pindah slide
  useEffect(() => { stopTTS(); setPartActive(null); }, [currentSlide]);

  // Animasi berurutan pada slide Bagian-Bagian: 1, 2, 3, 4 muncul satu per satu
  useEffect(() => {
    setPartStep(0);
    if (!partActive) return;
    const total = PART_INFO[partActive].total;
    const gap = partActive === "diagonal" ? 1100 : 750;
    const timers = [];
    for (let i = 1; i <= total; i++) {
      timers.push(setTimeout(() => {
        setPartStep(i);
        if (i === total) setPartExplored(prev => (prev.includes(partActive) ? prev : [...prev, partActive]));
      }, 300 + (i - 1) * gap));
    }
    return () => timers.forEach(clearTimeout);
  }, [partActive]);

  const togglePart = (key) => setPartActive(prev => (prev === key ? null : key));

  // ==========================================
  // RENDERER KOMPONEN
  // ==========================================

  const renderSlide1 = () => (
    <div className="relative flex flex-col items-center justify-center h-full text-center animate-materi-fade py-6 md:py-10">
      {/* Dekorasi melayang: di samping kiri & kanan, tidak menutupi tulisan */}
      <div className="hidden lg:block pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[3%] top-[48%] w-24 h-24 animate-materi-float" style={{ animationDelay: '0s' }}><ShapeSVG shape={SHAPES.samaSisi} color="#fef08a" rotate="rotate(15deg)" /></div>
        <div className="absolute left-[11%] top-[72%] w-16 h-16 animate-materi-float" style={{ animationDelay: '1s' }}><ShapeSVG shape={SHAPES.belahKetupat} color="#a7f3d0" rotate="rotate(-10deg)" /></div>
        <div className="absolute left-[1%] top-[78%] w-12 h-12 animate-materi-float" style={{ animationDelay: '2s' }}><ShapeSVG shape={SHAPES.lingkaran} color="#bfdbfe" /></div>
        <div className="absolute right-[3%] top-[50%] w-24 h-24 animate-materi-float" style={{ animationDelay: '0.5s' }}><ShapeSVG shape={SHAPES.trapesium} color="#fbcfe8" rotate="rotate(5deg)" /></div>
        <div className="absolute right-[11%] top-[74%] w-16 h-16 animate-materi-float" style={{ animationDelay: '1.5s' }}><ShapeSVG shape={SHAPES.persegi} color="#bae6fd" rotate="rotate(-15deg)" /></div>
        <div className="absolute right-[1%] top-[80%] w-12 h-12 animate-materi-float" style={{ animationDelay: '2.5s' }}><ShapeSVG shape={SHAPES.layangLayang} color="#fecaca" /></div>
      </div>

      <h1 className="relative text-4xl md:text-5xl lg:text-6xl font-black text-gradient mb-4 drop-shadow-lg leading-tight">PETUALANGAN BANGUN DATAR</h1>
      <h2 className="relative text-lg md:text-2xl font-bold text-[var(--text-main)] mb-10">Mengenal Ciri-Ciri Segitiga dan Segi Empat</h2>

      <div className="relative glass-panel p-6 max-w-xl mx-auto text-left mb-10">
        <h3 className="font-bold text-[var(--primary)] flex items-center gap-2 mb-3 text-lg"><BookOpen size={20}/> Apa yang akan kita pelajari?</h3>
        <ul className="space-y-2 text-[var(--text-main)] text-sm md:text-base font-medium">
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Mengenali ciri berbagai jenis segitiga.</li>
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Mengelompokkan segitiga berdasarkan bentuknya.</li>
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Mengenali ciri berbagai jenis segi empat.</li>
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Menguji pemahaman melalui evaluasi interaktif.</li>
        </ul>
      </div>

      <button onClick={() => setCurrentSlide(1)} className="relative glass-btn px-8 py-4 rounded-full text-lg font-black flex items-center gap-2 bg-[var(--primary)] text-slate-900 border-none hover:bg-[var(--primary)] shadow-[var(--glow-shadow)] hover:scale-105 transition-transform">
        Mulai Petualangan <ArrowRight size={24} />
      </button>
    </div>
  );

  // ---------- SLIDE BARU: BAGIAN-BAGIAN BANGUN DATAR ----------
  const renderBagianSlide = () => {
    const info = partActive ? PART_INFO[partActive] : null;
    const done = !!info && partStep >= info.total;
    const allExplored = partExplored.length === 3;

    return (
      <div className="flex flex-col h-full animate-materi-fade pb-8">
        <div className="text-center mb-4 shrink-0 px-2">
          <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] px-4 py-1 rounded-full font-black text-xs mb-3 border border-[var(--primary)]/30 tracking-widest">PENGENALAN</span>
          <h2 className="text-2xl md:text-4xl font-black text-gradient mb-2">BAGIAN-BAGIAN BANGUN DATAR</h2>
          <p className="text-sm md:text-base text-[var(--text-main)] font-medium max-w-2xl mx-auto">Kenali sisi, sudut, dan diagonal lewat sebuah persegi. Klik salah satu kotak untuk menjelajah!</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 md:gap-6 max-w-5xl mx-auto w-full items-center">
          {/* KIRI: gambar persegi */}
          <div className="glass-panel p-4 md:p-6 flex items-center justify-center" style={{ backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--primary) 28%, transparent) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
            <svg viewBox="0 0 240 240" className="w-full max-w-[340px] aspect-square overflow-visible" role="img" aria-label="Persegi beserta sisi, sudut, dan diagonalnya">
              <defs>
                {SQ_DIAGS.map((d, i) => (
                  <mask key={i} id={`mask-diag-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
                    <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="#fff" strokeWidth="18" pathLength="1" className="draw-on" style={{ animationDuration: ".8s" }} />
                  </mask>
                ))}
              </defs>

              <polygon points="50,50 190,50 190,190 50,190" fill="var(--sc1)" fillOpacity=".35" stroke="var(--shape-stroke)" strokeWidth="3" strokeLinejoin="round" />

              {/* MODE SISI */}
              {partActive === "sisi" && SQ_SIDES.map((s, i) => i < partStep && (
                <g key={`sisi-${i}`}>
                  <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} pathLength="1" className="part-glow draw-on" />
                  <g className="svg-pop" style={{ animationDelay: ".3s" }}>
                    <circle cx={s.lx} cy={s.ly} r="13" fill="var(--primary)" />
                    <text x={s.lx} y={s.ly} className="part-num">{i + 1}</text>
                  </g>
                  {done && <line x1={s.tick[0]} y1={s.tick[1]} x2={s.tick[2]} y2={s.tick[3]} className="part-tick" />}
                </g>
              ))}

              {/* MODE SUDUT */}
              {partActive === "sudut" && SQ_CORNERS.map((c, i) => i < partStep && (
                <g key={`sudut-${i}`}>
                  <path d={c.m} className="part-glow svg-pop" style={{ strokeWidth: 4 }} />
                  <circle cx={c.x} cy={c.y} r="7" fill="var(--primary)" className="svg-pop part-dot" />
                  <circle cx={c.x} cy={c.y} r="7" fill="none" stroke="var(--primary)" strokeWidth="2" className="corner-ring" />
                  <g className="svg-pop" style={{ animationDelay: ".25s" }}>
                    <circle cx={c.nx} cy={c.ny} r="13" fill="var(--primary)" />
                    <text x={c.nx} y={c.ny} className="part-num">{i + 1}</text>
                  </g>
                </g>
              ))}

              {/* MODE DIAGONAL */}
              {partActive === "diagonal" && (
                <g>
                  {SQ_CORNERS.map((c) => (
                    <g key={`huruf-${c.l}`} className="svg-pop">
                      <circle cx={c.x} cy={c.y} r="5" fill="var(--primary)" />
                      <text x={c.nx} y={c.ny} className="part-letter">{c.l}</text>
                    </g>
                  ))}
                  {SQ_DIAGS.map((d, i) => i < partStep && (
                    <g key={`diag-${i}`}>
                      <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} className="diag-line" mask={`url(#mask-diag-${i})`} />
                      <g className="svg-pop" style={{ animationDelay: ".6s" }}>
                        <circle cx={d.bx} cy={d.by} r="13" fill="var(--primary)" />
                        <text x={d.bx} y={d.by} className="part-num">{i + 1}</text>
                      </g>
                    </g>
                  ))}
                  {done && (
                    <g>
                      <circle cx="120" cy="120" r="5" fill="var(--shape-stroke)" className="svg-pop" />
                      <circle cx="120" cy="120" r="5" fill="none" stroke="var(--primary)" strokeWidth="2" className="corner-ring" />
                    </g>
                  )}
                </g>
              )}
            </svg>
          </div>

          {/* KANAN: 3 kotak + keterangan */}
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3">
              {["sisi", "sudut", "diagonal"].map((key) => {
                const act = partActive === key;
                const seen = partExplored.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => togglePart(key)}
                    aria-pressed={act}
                    className={`glass-btn relative p-3 md:p-4 rounded-2xl flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left ${act ? "ring-2 ring-[var(--primary)] shadow-[var(--glow-shadow)] bg-[var(--primary)]/15" : ""}`}
                  >
                    <span className={`w-10 h-10 md:w-12 md:h-12 shrink-0 p-2 rounded-xl border ${act ? "bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]" : "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"}`}>
                      <PartIcon kind={key} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block text-base md:text-lg font-black">{PART_INFO[key].label}</b>
                      <small className="hidden md:block text-xs text-[var(--text-muted)]">{act ? "Klik lagi untuk menutup" : "Klik untuk menjelajah"}</small>
                    </span>
                    {seen && <CheckCircle2 size={20} className="absolute top-2 right-2 md:static text-[var(--ok)] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div key={partActive || "idle"} className="glass-panel p-4 md:p-5 min-h-[170px] flex flex-col justify-center animate-materi-fade">
              {!info ? (
                <div className="text-center py-2">
                  <MousePointerClick size={32} className="mx-auto mb-2 text-[var(--primary)] animate-bounce" />
                  <p className="font-bold">Pilih salah satu kotak di atas</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Lihat bagian persegi bersinar satu per satu.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-black text-[var(--primary)]">Apa itu {info.label.toLowerCase()}?</h3>
                    <button onClick={() => playTTS(`${info.def} ${info.result} ${info.extra}`)} className="glass-btn p-2 rounded-xl shrink-0 bg-[var(--primary)]/15 border border-[var(--primary)]" title="Dengarkan penjelasan" aria-label="Dengarkan penjelasan">
                      <Volume2 size={18} className="text-[var(--primary)]" />
                    </button>
                  </div>
                  <p className="text-sm md:text-base font-medium leading-relaxed">{info.def}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="shrink-0 min-w-[84px] text-center px-3 py-2 rounded-2xl border border-[var(--primary)]/40 bg-[var(--primary)]/10">
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Jumlah {info.label.toLowerCase()}</p>
                      <p className="text-2xl font-black text-[var(--primary)] leading-none mt-0.5"><span key={partStep} className="score-pop">{partStep}</span><span className="text-sm text-[var(--text-muted)]">/{info.total}</span></p>
                    </div>
                    <p className={`font-black text-base md:text-lg transition-all duration-500 ${done ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>{info.result}</p>
                  </div>
                  <p className={`mt-2 text-sm text-[var(--text-muted)] font-medium transition-all duration-500 delay-300 ${done ? "opacity-100" : "opacity-0"}`}>{info.extra}</p>
                </>
              )}
            </div>

            {allExplored && (
              <div className="animate-materi-fade flex items-center gap-3 glass-panel p-3 border-[var(--ok)] bg-[var(--ok)]/10">
                <Sparkles size={22} className="text-[var(--ok)] shrink-0 animate-pulse" />
                <p className="text-sm font-bold">Hebat! Kamu sudah mengenal sisi, sudut, dan diagonal. Lanjut ke slide berikutnya ya!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------- SLIDE PEMBATAS (peta petualangan) ----------
  const renderTransition = ({ badge, title, subtitle, stop, items, note }) => (
    <div className="relative flex flex-col items-center justify-center h-full text-center animate-materi-fade py-6">
      <AdventureRail active={stop} />
      <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] px-4 py-1 rounded-full font-black text-xs mb-4 border border-[var(--primary)]/30 tracking-widest">{badge}</span>
      <h2 className="text-3xl md:text-5xl font-black text-gradient leading-tight mb-3 px-4">{title}</h2>
      <p className="text-sm md:text-lg font-medium text-[var(--text-main)] max-w-2xl px-4 mb-2">{subtitle}</p>
      {note && (
        <p className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[var(--ok)] bg-[var(--ok)]/10 border border-[var(--ok)]/40 px-3 py-1 rounded-full mt-1"><CheckCircle2 size={16} /> {note}</p>
      )}

      <div className="flex flex-wrap justify-center gap-4 md:gap-6 my-8 px-4 max-w-3xl">
        {items.map((it, i) => (
          <div key={it.label} className="animate-materi-pop flex flex-col items-center gap-2 w-20 md:w-28" style={{ animationDelay: `${0.25 + i * 0.15}s` }}>
            <div className="w-16 h-16 md:w-24 md:h-24 animate-materi-float" style={{ animationDelay: `${i * 0.4}s` }}>
              <ShapeSVG shape={it.shape} color={it.color} rotate={it.rotate} />
            </div>
            <span className="text-[11px] md:text-sm font-bold leading-tight">{it.label}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setCurrentSlide(prev => prev + 1)} className="glass-btn px-8 py-4 rounded-full text-lg font-black flex items-center gap-2 bg-[var(--primary)] text-slate-900 border-none hover:bg-[var(--primary)] shadow-[var(--glow-shadow)] hover:scale-105 transition-transform">
        Mulai Menjelajah <ArrowRight size={24} />
      </button>
    </div>
  );

  const renderMultiSelectSlide = (data, selected, setSelected, isChecked, setChecked, targetProp, question, instruction) => {
    const targetCount = data.filter(d => d[targetProp]).length;
    const toggleSelect = (id) => {
      if (isChecked) return;
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    let correctSelected = 0; let wrongSelected = 0; let missed = 0;
    if (isChecked) {
      selected.forEach(id => { if(data.find(d => d.id === id)[targetProp]) correctSelected++; else wrongSelected++; });
      missed = targetCount - correctSelected;
    }
    const allPerfect = isChecked && correctSelected === targetCount && wrongSelected === 0;

    return (
      <div className="flex flex-col h-full animate-materi-fade pb-8">
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-2xl md:text-3xl font-black text-[var(--primary)] mb-2">{question}</h2>
          <p className="text-sm md:text-base text-[var(--text-main)] font-medium px-4">{instruction}</p>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 max-w-5xl mx-auto w-full mb-8">
            {data.map((item) => {
              const isSel = selected.includes(item.id);
              let cardClass = "glass-panel p-3 md:p-4 aspect-square flex items-center justify-center relative transition-all cursor-pointer ";
              let overlay = null;

              if (!isChecked) {
                cardClass += isSel ? "ring-4 ring-[var(--primary)] shadow-[var(--glow-shadow)] scale-105 bg-[var(--primary)]/10" : "hover:scale-105 glass-btn";
                if(isSel) overlay = <div className="absolute top-2 right-2 bg-[var(--primary)] rounded-full p-0.5 text-slate-900 shadow-md"><CheckCircle2 size={16}/></div>;
              } else {
                const isTarget = item[targetProp];
                if (isSel && isTarget) {
                  cardClass += "ring-4 ring-[var(--ok)] bg-[var(--ok)]/20 scale-105";
                  overlay = <div className="absolute top-2 right-2 bg-[var(--ok)] rounded-full text-slate-900 shadow-md"><CheckCircle2 size={20}/></div>;
                } else if (isSel && !isTarget) {
                  cardClass += "ring-4 ring-[var(--bad)] bg-[var(--bad)]/20";
                  overlay = <div className="absolute top-2 right-2 bg-[var(--bad)] rounded-full text-slate-900 shadow-md"><XCircle size={20}/></div>;
                } else if (!isSel && isTarget) {
                  cardClass += "ring-4 ring-yellow-400 opacity-60";
                  overlay = <div className="absolute top-2 right-2 bg-yellow-400 rounded-full text-slate-900 text-[10px] px-2 py-0.5 font-bold shadow-md">Terlewat</div>;
                } else cardClass += "opacity-40 grayscale";
              }

              return (
                <button key={item.id} onClick={() => toggleSelect(item.id)} className={cardClass} disabled={isChecked}>
                  <ShapeSVG shape={item.shape} color={item.color} rotate={item.rotate} />
                  {overlay}
                </button>
              );
            })}
          </div>

          <div className="shrink-0 w-full flex justify-center">
            {!isChecked ? (
              <button onClick={() => setChecked(true)} disabled={selected.length===0} className="glass-btn px-8 py-3 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center gap-2 hover:bg-[var(--primary)]/20">
                <MousePointerClick size={20}/> Periksa Jawaban
              </button>
            ) : (
              <div className="glass-panel p-5 text-center flex flex-col items-center max-w-lg mx-auto w-full border-[var(--primary)] shadow-[var(--glow-shadow)]">
                {allPerfect ? (
                  <><ShieldCheck size={40} className="text-[var(--ok)] mb-2 animate-bounce"/><h3 className="text-xl font-black text-[var(--ok)] mb-2">Hebat! Jawabanmu Benar Semua!</h3></>
                ) : (
                  <><AlertTriangle size={40} className="text-yellow-400 mb-2 animate-pulse"/><h3 className="text-xl font-black text-yellow-400 mb-2">Belum Tepat, Yuk Periksa Lagi!</h3></>
                )}
                <div className="flex gap-4 text-sm font-bold mb-4">
                  <span className="text-[var(--ok)]">{correctSelected} Benar</span>
                  <span className="text-[var(--bad)]">{wrongSelected} Keliru</span>
                  <span className="text-yellow-400">{missed} Terlewat</span>
                </div>
                <button onClick={() => { setChecked(false); setSelected([]); }} className="glass-btn px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                  <RotateCcw size={16}/> Coba Lagi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFlashcards = (title, intro, cardsData, flippedState, setFlippedState) => {
    const toggleFlip = (id) => setFlippedState(prev => ({ ...prev, [id]: !prev[id] }));

    return (
      <div className="flex flex-col h-full animate-materi-fade pb-10">
        <div className="text-center mb-8 shrink-0">
          <h2 className="text-2xl md:text-3xl font-black text-[var(--primary)] mb-2">{title}</h2>
          <p className="text-sm md:text-base text-[var(--text-main)] font-medium max-w-3xl mx-auto px-4">{intro}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full flex-1 min-h-[350px]">
          {cardsData.map((card) => {
            const isFlipped = flippedState[card.id];
            return (
              <div key={card.id} className="glass-panel p-6 flex flex-col items-center relative overflow-hidden transition-all duration-500 min-h-[320px]">
                {!isFlipped ? (
                  <div className="flex flex-col items-center justify-between h-full w-full animate-materi-fade">
                    <h3 className="text-xl font-black mb-4 text-center">{card.name}</h3>
                    <div className="w-32 h-32 md:w-40 md:h-40 mb-6">
                      <ShapeSVG shape={card.shape} color={card.color} rotate={card.rotate} />
                    </div>
                    <button onClick={() => toggleFlip(card.id)} className="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-[var(--primary)]/10 hover:bg-[var(--primary)]/30 border border-[var(--primary)]/30 mt-auto">
                      Buka Ciri-Ciri
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col h-full w-full animate-materi-fade">
                    <h3 className="text-xl font-black mb-4 text-[var(--primary)] text-center shrink-0">{card.name}</h3>
                    <ul className="flex-1 space-y-3 text-sm md:text-base font-medium text-[var(--text-main)] mb-6 overflow-y-auto custom-scrollbar pr-2">
                      {card.traits.map((trait, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={18} className="text-[var(--primary)] shrink-0 mt-0.5"/>
                          <span className="leading-snug">{trait}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="shrink-0 flex gap-2 w-full mt-auto">
                      {/* Tombol Fitur Suara (Text-to-Speech) */}
                      <button onClick={() => playTTS(`Ciri-ciri ${card.name} adalah: ${card.traits.join(", ")}`)} className="glass-btn p-3 rounded-xl font-bold text-sm bg-[var(--primary)]/20 hover:bg-[var(--primary)]/40 border border-[var(--primary)] flex-shrink-0" title="Dengarkan Ciri-Ciri">
                        <Volume2 size={20} className="text-[var(--primary)]" />
                      </button>
                      <button onClick={() => toggleFlip(card.id)} className="glass-btn flex-1 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20">
                        Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    );
  }

  // Komponen Reusable untuk Drag & Drop Klasifikasi (Segitiga & Segi Empat)
  const renderDragAndDrop = (title, instruction, data, zones, placements, setPlacements, isChecked, setChecked, selectedCard, setSelectedCard) => {
    const handleDragStart = (e, cardId) => e.dataTransfer.setData("cardId", cardId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, zoneId) => {
      e.preventDefault();
      if(isChecked) return;
      const cardId = e.dataTransfer.getData("cardId");
      if (cardId) setPlacements(prev => ({ ...prev, [cardId]: zoneId }));
    };

    const handleCardClick = (cardId) => {
      if(isChecked) return;
      if (placements[cardId]) {
        setPlacements(prev => { const next = {...prev}; delete next[cardId]; return next; });
        setSelectedCard(null);
      } else setSelectedCard(selectedCard === cardId ? null : cardId);
    };

    const handleZoneClick = (zoneId) => {
      if (isChecked || !selectedCard) return;
      setPlacements(prev => ({ ...prev, [selectedCard]: zoneId }));
      setSelectedCard(null);
    };

    const placedCount = Object.keys(placements).length;
    const isAllPlaced = placedCount === data.length;

    let correctCount = 0;
    if (isChecked) {
      Object.entries(placements).forEach(([cardId, zoneId]) => {
        if (data.find(c => c.id === cardId).type === zoneId) correctCount++;
      });
    }
    const unplacedCards = data.filter(c => !placements[c.id]);

    return (
      <div className="flex flex-col h-full animate-materi-fade select-none pb-10">
        <div className="text-center mb-4 shrink-0 px-2">
          <h2 className="text-xl md:text-3xl font-black text-[var(--primary)] mb-2">{title}</h2>
          <p className="text-sm md:text-base font-medium">{instruction}</p>
        </div>

        {/* POOL KARTU */}
        <div className="glass-panel p-4 mb-4 min-h-[100px] md:min-h-[120px] flex flex-wrap justify-center gap-3 border-dashed border-white/30 shrink-0">
          {unplacedCards.length === 0 ? <p className="text-[var(--text-muted)] font-bold my-auto italic">Semua kartu telah dipindahkan.</p> : null}
          {unplacedCards.map(card => (
            <div key={card.id} draggable={!isChecked} onDragStart={(e) => handleDragStart(e, card.id)} onClick={() => handleCardClick(card.id)}
              className={`w-14 h-14 md:w-20 md:h-20 p-2 glass-btn rounded-xl cursor-grab active:cursor-grabbing transition-transform ${selectedCard === card.id ? 'ring-4 ring-[var(--primary)] scale-110' : 'hover:scale-105'}`}>
              <ShapeSVG shape={card.shape} color={card.color} rotate={card.rotate} />
            </div>
          ))}
        </div>

        {/* ZONA DROP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 flex-1 min-h-[200px]">
          {zones.map(zone => {
            const cardsInZone = data.filter(c => placements[c.id] === zone.id);
            return (
              <div key={zone.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, zone.id)} onClick={() => handleZoneClick(zone.id)}
                className={`glass-panel p-3 border-2 flex flex-col transition-colors ${selectedCard && !isChecked ? 'border-[var(--primary)] bg-[var(--primary)]/10 cursor-pointer' : 'border-white/10'}`}>
                <h3 className="text-center font-black text-xs md:text-sm border-b border-white/20 pb-2 mb-2 text-[var(--primary)]">{zone.label}</h3>
                <div className="flex-1 flex flex-wrap content-start gap-2 justify-center">
                  {cardsInZone.map(card => {
                    const isCorrect = isChecked && card.type === zone.id;
                    const isWrong = isChecked && card.type !== zone.id;
                    return (
                      <div key={card.id} draggable={!isChecked} onDragStart={(e) => handleDragStart(e, card.id)} onClick={() => handleCardClick(card.id)}
                        className={`w-12 h-12 md:w-16 md:h-16 p-1.5 glass-btn rounded-lg cursor-pointer relative ${isCorrect ? 'ring-2 ring-[var(--ok)] bg-[var(--ok)]/20' : isWrong ? 'ring-2 ring-[var(--bad)] bg-[var(--bad)]/20' : 'hover:scale-105'}`}>
                        <ShapeSVG shape={card.shape} color={card.color} rotate={card.rotate} />
                        {isCorrect && <div className="absolute -top-2 -right-2 bg-[var(--ok)] text-slate-900 rounded-full shadow"><CheckCircle2 size={12}/></div>}
                        {isWrong && <div className="absolute -top-2 -right-2 bg-[var(--bad)] text-white rounded-full shadow"><XCircle size={12}/></div>}
                      </div>
                    )
                  })}
                  {cardsInZone.length === 0 && <span className="text-[var(--text-muted)] opacity-60 text-xs italic my-auto">Tarik ke sini</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* KONTROL */}
        <div className="text-center shrink-0">
          {!isChecked ? (
            <button onClick={() => setChecked(true)} disabled={!isAllPlaced} className="glass-btn px-6 py-3 rounded-xl font-bold text-base disabled:opacity-50">
              {isAllPlaced ? "Periksa Pengelompokan" : `Masih ada ${data.length - placedCount} kartu tersisa`}
            </button>
          ) : (
            <div className="flex flex-col items-center glass-panel p-4 max-w-xl mx-auto border-[var(--primary)] shadow-[var(--glow-shadow)]">
              {correctCount === data.length ? (
                <p className="text-[var(--ok)] font-black text-lg mb-3 flex items-center gap-2"><Sparkles/> Sempurna! Semua dikelompokkan dengan tepat.</p>
              ) : (
                <p className="text-yellow-400 font-bold text-base mb-3 flex items-center gap-2"><AlertTriangle/> Ada yang belum tepat. Perhatikan cirinya lagi ya!</p>
              )}
              <button onClick={() => { setChecked(false); setPlacements({}); setSelectedCard(null); }} className="glass-btn px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                <RotateCcw size={16}/> Ulangi Permainan
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuiz = (qId, question, image, options, correctAnswer, feedback) => {
    const selected = quizAnswers[qId];
    const isChecked = quizChecked[qId];
    const isCorrect = selected === correctAnswer;

    const handleSelect = (opt) => { if(!isChecked) setQuizAnswers(prev => ({...prev, [qId]: opt})) };

    return (
      <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full animate-materi-fade pb-10">
        <span className="bg-[var(--primary)]/20 text-[var(--primary)] px-4 py-1 rounded-full font-black text-sm mb-6 border border-[var(--primary)]/30 tracking-widest shrink-0">EVALUASI {qId - 9}</span>
        
        <div className="glass-panel p-6 w-full text-center relative border-[var(--primary)]/30 mb-6 shrink-0">
          <h2 className="text-lg md:text-2xl font-bold mb-4 leading-relaxed">{question}</h2>
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6">{image}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map(opt => {
              const letter = opt.substring(0, 1);
              const isSel = selected === letter;
              let btnClass = "glass-btn p-3 rounded-xl text-left font-bold text-sm md:text-base flex items-center gap-3 transition-all ";
              if (!isChecked) btnClass += isSel ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/20 scale-[1.02]" : "hover:bg-white/10";
              else {
                if (letter === correctAnswer) btnClass += "ring-2 ring-[var(--ok)] bg-[var(--ok)]/20";
                else if (isSel) btnClass += "ring-2 ring-[var(--bad)] bg-[var(--bad)]/20 opacity-70";
                else btnClass += "opacity-40";
              }
              return (
                <button key={letter} onClick={() => handleSelect(letter)} disabled={isChecked} className={btnClass}>
                  <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border ${isSel && !isChecked ? 'bg-[var(--primary)] text-slate-900 border-[var(--primary)]' : isChecked && letter===correctAnswer ? 'bg-[var(--ok)] text-slate-900 border-[var(--ok)]' : isChecked && isSel ? 'bg-[var(--bad)] text-white border-[var(--bad)]' : 'bg-white/10 border-white/20'}`}>{letter}</span>
                  <span className="flex-1">{opt.substring(3)}</span>
                  {isChecked && letter === correctAnswer && <CheckCircle2 className="text-[var(--ok)] shrink-0"/>}
                  {isChecked && isSel && letter !== correctAnswer && <XCircle className="text-[var(--bad)] shrink-0"/>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="w-full shrink-0 flex justify-center">
          {!isChecked ? (
            <button onClick={() => setQuizChecked(prev => ({...prev, [qId]: true}))} disabled={!selected} className="glass-btn px-8 py-3 rounded-full font-black text-lg disabled:opacity-50">Periksa Jawaban</button>
          ) : (
            <div className={`w-full glass-panel p-5 flex flex-col md:flex-row items-center gap-4 text-left border-l-8 ${isCorrect ? 'border-l-[var(--ok)] bg-[var(--ok)]/10' : 'border-l-[var(--bad)] bg-[var(--bad)]/10'}`}>
              <div className={`p-3 rounded-full shrink-0 ${isCorrect ? 'bg-[var(--ok)]/20 text-[var(--ok)]' : 'bg-[var(--bad)]/20 text-[var(--bad)]'}`}>
                {isCorrect ? <CheckCircle2 size={32}/> : <XCircle size={32}/>}
              </div>
              <div className="flex-1">
                <h3 className={`font-black text-lg ${isCorrect ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>{isCorrect ? "Tepat Sekali!" : "Masih Belum Tepat!"}</h3>
                <p className="text-sm font-medium mt-1 leading-relaxed"><span className="font-bold">Kunci: {correctAnswer}.</span> {feedback}</p>
              </div>
              <button onClick={() => setQuizChecked(prev => ({...prev, [qId]: false}))} className="glass-btn px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap shrink-0">Ubah Jawaban</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const FIRST_QUIZ_SLIDE = 12; // indeks (mulai 0) slide Evaluasi 1

  const renderFinalResult = () => {
    const qIds = [10, 11, 12];
    let answered = 0; let correct = 0;

    qIds.forEach(id => {
      if (quizChecked[id]) {
        answered++;
        if (quizAnswers[id] === (id===10 ? 'B' : id===11 ? 'C' : 'D')) correct++;
      }
    });

    const isComplete = answered === qIds.length;
    const score = Math.round((correct / qIds.length) * 100);

    if (!isComplete) {
      return (
        <div className="glass-panel p-8 max-w-xl mx-auto text-center mt-8 animate-materi-fade border-yellow-400/50">
          <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-4 animate-pulse"/>
          <h3 className="text-2xl font-black mb-2">Evaluasi Belum Selesai</h3>
          <p className="font-medium text-[var(--text-muted)] mb-6">Kamu belum memeriksa jawaban untuk {qIds.length - answered} soal. Yuk periksa lagi ke atas!</p>
        </div>
      );
    }

    return (
      <div className="glass-panel p-6 md:p-8 max-w-2xl mx-auto text-center mt-10 mb-10 animate-materi-fade shadow-[var(--glow-shadow)] border-[var(--primary)] shrink-0">
        <div className="w-20 h-20 mx-auto bg-[var(--primary)]/20 rounded-full flex items-center justify-center mb-6 border-4 border-[var(--primary)] shadow-[0_0_30px_var(--primary)]">
          {correct === qIds.length ? <Sparkles size={40} className="text-[var(--primary)] animate-pulse"/> : <ShieldCheck size={40} className="text-[var(--primary)]"/>}
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-gradient mb-2">Evaluasi Selesai!</h2>
        <p className="text-sm md:text-base font-medium text-[var(--text-main)] mb-6">Kerja bagus menyelesaikan petualangan bangun datar hari ini!</p>
        
        <div className="flex justify-center gap-4 md:gap-6 mb-8">
          <div className="bg-black/30 p-3 md:p-4 rounded-2xl w-24 md:w-32 border border-white/10">
            <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Skor</p>
            <p className="text-2xl md:text-3xl font-black text-[var(--primary)]">{score}</p>
          </div>
          <div className="bg-black/30 p-3 md:p-4 rounded-2xl w-24 md:w-32 border border-white/10">
            <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Benar</p>
            <p className="text-2xl md:text-3xl font-black text-[var(--ok)]">{correct}</p>
          </div>
          <div className="bg-black/30 p-3 md:p-4 rounded-2xl w-24 md:w-32 border border-white/10">
            <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Salah</p>
            <p className="text-2xl md:text-3xl font-black text-[var(--bad)]">{qIds.length - correct}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3">
          <button onClick={() => { setQuizAnswers({}); setQuizChecked({}); setCurrentSlide(FIRST_QUIZ_SLIDE); }} className="glass-btn px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <RotateCcw size={18}/> Ulangi Evaluasi
          </button>
          <button onClick={() => router.push("/dashboard")} className="glass-btn px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-[var(--primary)]/10">
            <ArrowLeft size={18}/> Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // PENGATURAN SLIDE (15 SLIDE)
  // ==========================================
  const SLIDES = [
    // 1. Pembuka
    { content: renderSlide1 },
    // 2. BARU: Bagian-bagian bangun datar
    { content: renderBagianSlide },
    // 3. BARU: Pembatas, mulai belajar segitiga
    { content: () => renderTransition({
        badge: "PETUALANGAN 1",
        title: "Ayo Kenalan dengan Segitiga!",
        subtitle: "Bangun datar bersisi tiga ini punya tiga anggota keluarga. Kita akan mengenali ciri-cirinya, lalu mengelompokkannya.",
        stop: 1,
        items: [
          { shape: SHAPES.samaSisi, color: "#fef08a", label: "Sama Sisi" },
          { shape: SHAPES.samaKaki, color: "#fbcfe8", label: "Sama Kaki" },
          { shape: SHAPES.sembarang, color: "#bfdbfe", label: "Sembarang" },
        ],
      })
    },
    // 4. Identifikasi segitiga
    { content: () => renderMultiSelectSlide(SLIDE2_DATA, s2Selected, setS2Selected, s2Checked, setS2Checked, 'isTriangle', "COBA KAMU CEK!", "Di antara gambar berikut, mana saja yang termasuk bangun segitiga?") },
    // 5. Flashcard segitiga
    { content: () => renderFlashcards("MENGENAL KELUARGA SEGITIGA", "Semua segitiga memiliki 3 sisi, 3 titik sudut, dan 3 sudut. Namun, panjang sisinya dapat berbeda.", [
        { id: 1, name: "Segitiga Sama Sisi", shape: SHAPES.samaSisi, color: "#fef08a", traits: ["Memiliki 3 sisi sama panjang.", "Memiliki 3 sudut sama besar.", "Setiap sudut besarnya 60°."] },
        { id: 2, name: "Segitiga Sama Kaki", shape: SHAPES.samaKaki, color: "#fbcfe8", traits: ["Memiliki 2 sisi sama panjang.", "Dua sudut alas sama besar.", "Memiliki 3 sisi dan 3 titik sudut."] },
        { id: 3, name: "Segitiga Sembarang", shape: SHAPES.sembarang, color: "#bfdbfe", traits: ["Ketiga sisinya berbeda panjang.", "Ketiga sudutnya berbeda besar.", "Memiliki 3 sisi dan 3 titik sudut."] }
      ], s3Flipped, setS3Flipped) 
    },
    // 6. Klasifikasi segitiga
    { content: () => renderDragAndDrop("MISI KLASIFIKASI SEGITIGA", "Seret/klik segitiga ke kelompok yang tepat berdasarkan panjang sisinya!", SLIDE4_DATA, 
        [{ id: "SAMA_SISI", label: "SEGITIGA SAMA SISI" }, { id: "SAMA_KAKI", label: "SEGITIGA SAMA KAKI" }, { id: "SEMBARANG", label: "SEGITIGA SEMBARANG" }], 
        s4Placements, setS4Placements, s4Checked, setS4Checked, s4SelectedCard, setS4SelectedCard) 
    },
    // 7. BARU: Pembatas, mulai belajar segi empat
    { content: () => renderTransition({
        badge: "PETUALANGAN 2",
        title: "Sekarang, Ayo Belajar Segi Empat!",
        subtitle: "Ada enam anggota keluarga segi empat yang menunggumu. Siap mengenali ciri khas mereka satu per satu?",
        note: "Petualangan segitiga selesai!",
        stop: 2,
        items: [
          { shape: SHAPES.persegi, color: "#a7f3d0", label: "Persegi" },
          { shape: SHAPES.persegiPanjang, color: "#bae6fd", label: "Persegi Panjang" },
          { shape: SHAPES.trapesium, color: "#fef08a", label: "Trapesium" },
          { shape: SHAPES.jajarGenjang, color: "#fed7aa", label: "Jajar Genjang" },
          { shape: SHAPES.layangLayang, color: "#fecaca", label: "Layang-Layang" },
          { shape: SHAPES.belahKetupat, color: "#e9d5ff", label: "Belah Ketupat" },
        ],
      })
    },
    // 8. Identifikasi segi empat
    { content: () => renderMultiSelectSlide(SLIDE5_DATA, s5Selected, setS5Selected, s5Checked, setS5Checked, 'isQuad', "SAATNYA MENJELAJAHI SEGI EMPAT!", "Pilih semua gambar yang merupakan bangun segi empat. Jangan klik bangun yang lain!") },
    // 9. Flashcard segi empat 1
    { content: () => renderFlashcards("KELUARGA SEGI EMPAT: BAGIAN 1", "Segi empat adalah bangun datar yang memiliki 4 sisi, 4 titik sudut, dan 4 sudut.", [
        { id: 1, name: "Persegi", shape: SHAPES.persegi, color: "#a7f3d0", traits: ["Memiliki 4 sisi sama panjang.", "Memiliki 4 sudut siku-siku (90°).", "Sisi yang berhadapan sejajar."] },
        { id: 2, name: "Persegi Panjang", shape: SHAPES.persegiPanjang, color: "#bae6fd", traits: ["2 pasang sisi berhadapan sama panjang.", "Memiliki 4 sudut siku-siku.", "Sisi yang berhadapan sejajar."] },
        { id: 3, name: "Trapesium", shape: SHAPES.trapesium, color: "#fef08a", traits: ["Memiliki 4 sisi.", "Tepat sepasang sisi berhadapan sejajar.", "Pasangan sisi lain tidak sejajar."] }
      ], s6Flipped, setS6Flipped) 
    },
    // 10. Klasifikasi segi empat 1
    { content: () => renderDragAndDrop("MISI KELOMPOK SEGI EMPAT 1", "Kelompokkan bangun persegi, persegi panjang, dan trapesium!", SLIDE7_DATA, 
        [{ id: "PERSEGI", label: "PERSEGI" }, { id: "PERSEGI_PANJANG", label: "PERSEGI PANJANG" }, { id: "TRAPESIUM", label: "TRAPESIUM" }], 
        s7Placements, setS7Placements, s7Checked, setS7Checked, s7SelectedCard, setS7SelectedCard) 
    },
    // 11. Flashcard segi empat 2
    { content: () => renderFlashcards("LANJUTKAN PETUALANGANMU!", "Masih ada anggota keluarga segi empat yang lain dengan ciri khasnya masing-masing.", [
        { id: 1, name: "Jajar Genjang", shape: SHAPES.jajarGenjang, color: "#fed7aa", traits: ["2 pasang sisi berhadapan sejajar.", "Sisi yang berhadapan sama panjang.", "Sudut yang berhadapan sama besar."] },
        { id: 2, name: "Layang-Layang", shape: SHAPES.layangLayang, color: "#fecaca", traits: ["2 pasang sisi sama panjang berdekatan.", "Satu pasang sudut berhadapan sama besar.", "Diagonalnya saling tegak lurus."] },
        { id: 3, name: "Belah Ketupat", shape: SHAPES.belahKetupat, color: "#e9d5ff", traits: ["4 sisi sama panjang.", "Sisi yang berhadapan sejajar.", "Sudut berhadapan sama besar (bukan siku)."] }
      ], s8Flipped, setS8Flipped) 
    },
    // 12. Klasifikasi segi empat 2
    { content: () => renderDragAndDrop("MISI KELOMPOK SEGI EMPAT 2", "Kelompokkan bangun jajar genjang, layang-layang, dan belah ketupat!", SLIDE9_DATA, 
        [{ id: "JAJAR_GENJANG", label: "JAJAR GENJANG" }, { id: "LAYANG_LAYANG", label: "LAYANG-LAYANG" }, { id: "BELAH_KETUPAT", label: "BELAH KETUPAT" }], 
        s9Placements, setS9Placements, s9Checked, setS9Checked, s9SelectedCard, setS9SelectedCard) 
    },
    // 13-15. Evaluasi
    { content: () => renderQuiz(10, "Bangun datar apakah yang ditunjukkan pada gambar berikut?", <ShapeSVG shape={SHAPES.samaKaki} color="#fbcfe8" />, ["A. Segitiga sama sisi", "B. Segitiga sama kaki", "C. Segitiga sembarang", "D. Persegi"], "B", "Perhatikan bahwa bangun ini memiliki tepat dua sisi miring yang sama panjang, sedangkan alasnya berbeda.") },
    { content: () => renderQuiz(11, "Bangun datar apakah yang ditunjukkan pada gambar berikut?", <ShapeSVG shape={SHAPES.trapesium} color="#fef08a" />, ["A. Persegi panjang", "B. Jajar genjang", "C. Trapesium", "D. Layang-layang"], "C", "Ciri pembeda utama trapesium adalah memiliki tepat satu pasang sisi berhadapan yang sejajar (atas dan bawah).") },
    { content: () => (
        <div className="flex flex-col">
          {renderQuiz(12, "Bangun datar apakah yang ditunjukkan pada gambar berikut?", <ShapeSVG shape={SHAPES.belahKetupat} color="#e9d5ff" />, ["A. Persegi", "B. Persegi panjang", "C. Layang-layang", "D. Belah ketupat"], "D", "Keempat sisinya sama panjang, namun sudut-sudutnya bukan siku-siku, sehingga bangun ini adalah belah ketupat, bukan persegi.")}
          {quizChecked[12] && renderFinalResult()}
        </div>
      )
    }
  ];

  return (
    <main className={`theme-${temaBg} fixed inset-0 flex flex-col font-sans text-[var(--text-main)] select-none p-3 md:p-6`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --on-primary: #05050f; --glass-bg: rgba(20, 20, 40, 0.55); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.4); --shape-stroke: #ffffff; --shape-glow: rgba(0, 243, 255, 0.35); --ok: #4ade80; --bad: #fb7185; --sc1: #67e8f9; --sc2: #818cf8; --sc3: #f0abfc; --sc4: #38bdf8; --sc5: #c084fc; --sc6: #a78bfa; --sc7: #22d3ee; --sc8: #f472b6; background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --on-primary: #ffffff; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); --shape-stroke: #2b2d42; --shape-glow: rgba(242, 132, 130, 0.3); --ok: #16a34a; --bad: #e11d48; --sc1: #f6bd60; --sc2: #84a59d; --sc3: #f28482; --sc4: #e5989b; --sc5: #e29578; --sc6: #b5838d; --sc7: #6d9886; --sc8: #f5cac3; background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --on-primary: #00121f; --glass-bg: rgba(0, 30, 60, 0.55); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.4); --shape-stroke: #ffffff; --shape-glow: rgba(0, 212, 255, 0.35); --ok: #4ade80; --bad: #fb7185; --sc1: #67e8f9; --sc2: #5eead4; --sc3: #7dd3fc; --sc4: #38bdf8; --sc5: #34d399; --sc6: #a5f3fc; --sc7: #2dd4bf; --sc8: #86efac; background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover:not(:disabled) { transform: translateY(-4px) scale(1.02); box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .glass-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        @keyframes materi-fade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-materi-fade { animation: materi-fade 0.5s ease-out forwards; }
        @keyframes materi-float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
        .animate-materi-float { animation: materi-float 4s ease-in-out infinite; }
        @keyframes materi-pop { 0% { opacity: 0; transform: scale(0.3) translateY(20px); } 70% { transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        .animate-materi-pop { animation: materi-pop 0.6s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes scorePop { 0% { transform: scale(1.5); } 100% { transform: scale(1); } }
        .score-pop { display: inline-block; animation: scorePop 0.45s ease-out; }

        /* ---- Slide Bagian-Bagian Bangun Datar ---- */
        @keyframes drawOn { to { stroke-dashoffset: 0; } }
        .draw-on { stroke-dasharray: 1; stroke-dashoffset: 1; animation: drawOn 0.55s ease-out forwards; }
        @keyframes glowPulse { from { filter: drop-shadow(0 0 4px var(--primary)); } to { filter: drop-shadow(0 0 10px var(--primary)) drop-shadow(0 0 18px var(--primary)); } }
        .part-glow { fill: none; stroke: var(--primary); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 6px var(--primary)); }
        .part-glow.draw-on { animation: drawOn 0.55s ease-out forwards, glowPulse 1.6s 0.55s ease-in-out infinite alternate; }
        .part-glow.svg-pop { animation: svgPop 0.45s cubic-bezier(.34,1.56,.64,1) both, glowPulse 1.6s 0.45s ease-in-out infinite alternate; }
        @keyframes svgPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .svg-pop { transform-box: fill-box; transform-origin: center; animation: svgPop 0.45s cubic-bezier(.34,1.56,.64,1) both; }
        .part-dot { filter: drop-shadow(0 0 6px var(--primary)); }
        @keyframes ringPing { from { transform: scale(0.8); opacity: 0.9; } to { transform: scale(2.4); opacity: 0; } }
        .corner-ring { transform-box: fill-box; transform-origin: center; animation: ringPing 1.5s ease-out infinite; }
        @keyframes dashMarch { to { stroke-dashoffset: -34; } }
        .diag-line { stroke: var(--primary); stroke-width: 4; stroke-dasharray: 9 8; stroke-linecap: round; filter: drop-shadow(0 0 5px var(--primary)); animation: dashMarch 1s linear infinite; }
        .part-tick { stroke: var(--primary); stroke-width: 3.5; stroke-linecap: round; animation: materi-fade 0.5s ease-out both; }
        .part-num { fill: var(--on-primary); font-weight: 900; font-size: 15px; text-anchor: middle; dominant-baseline: central; font-family: inherit; }
        .part-letter { fill: var(--text-main); font-weight: 800; font-size: 15px; text-anchor: middle; dominant-baseline: central; font-family: inherit; }
        @keyframes railGrow { from { width: var(--from); } }
        .rail-fill { width: var(--to); animation: railGrow 1.2s 0.3s ease-out both; box-shadow: 0 0 10px var(--primary); }

        @media (prefers-reduced-motion: reduce) {
          .animate-materi-float, .corner-ring, .diag-line, .part-glow, .part-glow.draw-on, .part-glow.svg-pop { animation: none; }
          .draw-on { stroke-dashoffset: 0; animation: none; }
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--primary) 50%, transparent); border-radius: 10px; }
      `}} />

      <BackgroundCanvas tema={temaBg} particlesEnabled={particlesEnabled} musicEnabled={musicEnabled} volume={volume} />

      {/* HEADER NAVIGASI (Dibuat shrink-0 agar tidak ikut tergulung) */}
      <header className="glass-panel p-3 md:p-4 flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto w-full z-20 relative mb-4 shrink-0 gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => router.push("/dashboard")} className="glass-btn p-2 rounded-xl flex items-center justify-center shrink-0" aria-label="Kembali ke Dashboard">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base md:text-xl font-black text-gradient leading-tight">Ciri Bangun Datar</h1>
            <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-medium">Petualang: <span className="font-bold text-[var(--primary)]">{namaPeserta}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-bold w-12 md:w-14 text-right">{currentSlide + 1} / {totalSlides}</span>
            <div className="w-20 md:w-32 h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentSlide(prev => prev - 1)} disabled={currentSlide === 0} className="glass-btn p-2 rounded-lg md:rounded-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none">
              <ArrowLeft size={18} />
            </button>
            <button onClick={() => setCurrentSlide(prev => prev + 1)} disabled={currentSlide === totalSlides - 1} className="glass-btn p-2 rounded-lg md:rounded-xl disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* AREA KONTEN (Area ini memiliki fitur Scrollable vertikal) */}
      <div className="flex-1 w-full max-w-6xl mx-auto z-10 relative overflow-y-auto custom-scrollbar px-1 pb-4">
        {SLIDES[currentSlide].content()}
      </div>

      {/* FOOTER */}
      <footer className="w-full text-center pb-2 bg-transparent z-10 relative shrink-0 mt-2 hidden md:block">
        <p className="font-bold text-[10px] md:text-xs text-gradient">Berakhlak Mulia dan Berprestasi</p>
        <p className="text-[9px] md:text-[10px] text-[var(--text-muted)] mt-0.5">&copy; 2026 Mugeb Primary School (SD Muhammadiyah 1 GKB)</p>
      </footer>
    </main>
  );
}
