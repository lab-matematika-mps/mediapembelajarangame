"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, XCircle, 
  RotateCcw, Sparkles, MousePointerClick, AlertTriangle, ShieldCheck,
  Volume2, VolumeX
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

// Data Slide 2: Identifikasi Segitiga
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

// Data Slide 4: Klasifikasi Segitiga
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

// Data Slide 5: Identifikasi Segi Empat
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

// Data Slide 7: Klasifikasi Segi Empat 1 (Persegi, Persegi Panjang, Trapesium)
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

// Data Slide 9: Klasifikasi Segi Empat 2 (Jajar Genjang, Layang-layang, Belah Ketupat)
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
// KOMPONEN BANTU SVG
// ==========================================
const ShapeSVG = ({ shape, color, rotate = "none", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full overflow-visible drop-shadow-md ${className}`} style={{ transform: rotate }}>
    <g fill={color} stroke="var(--shape-stroke)" strokeWidth="4" strokeLinejoin="round">{shape}</g>
  </svg>
);

export default function PetualanganMateri() {
  const router = useRouter();

  // STATE GLOBAL
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("galaxy");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 12; // Diperbarui menjadi 12 slide

  // State Slide 2
  const [s2Selected, setS2Selected] = useState([]);
  const [s2Checked, setS2Checked] = useState(false);
  // State Slide 3
  const [s3Flipped, setS3Flipped] = useState({ 1: false, 2: false, 3: false });
  
  // State Slide 4 (D&D Segitiga)
  const [s4Placements, setS4Placements] = useState({});
  const [s4Checked, setS4Checked] = useState(false);
  const [s4SelectedCard, setS4SelectedCard] = useState(null);

  // State Slide 5
  const [s5Selected, setS5Selected] = useState([]);
  const [s5Checked, setS5Checked] = useState(false);
  // State Slide 6
  const [s6Flipped, setS6Flipped] = useState({ 1: false, 2: false, 3: false });
  
  // State Slide 7 (D&D Segi Empat 1)
  const [s7Placements, setS7Placements] = useState({});
  const [s7Checked, setS7Checked] = useState(false);
  const [s7SelectedCard, setS7SelectedCard] = useState(null);

  // State Slide 8 (Flashcard Segi Empat 2)
  const [s8Flipped, setS8Flipped] = useState({ 1: false, 2: false, 3: false });

  // State Slide 9 (D&D Segi Empat 2)
  const [s9Placements, setS9Placements] = useState({});
  const [s9Checked, setS9Checked] = useState(false);
  const [s9SelectedCard, setS9SelectedCard] = useState(null);

  // State Quiz (Slide 10, 11, 12)
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

  // Hentikan suara jika pindah slide
  useEffect(() => { stopTTS(); }, [currentSlide]);

  // ==========================================
  // RENDERER KOMPONEN
  // ==========================================

  const renderSlide1 = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-materi-fade py-10">
      <div className="relative mb-8 w-full max-w-2xl h-40 flex items-center justify-center">
        <div className="absolute top-0 left-10 w-20 h-20 animate-materi-float" style={{ animationDelay: '0s' }}><ShapeSVG shape={SHAPES.samaSisi} color="#fef08a" rotate="rotate(15deg)" /></div>
        <div className="absolute bottom-0 left-1/4 w-16 h-16 animate-materi-float" style={{ animationDelay: '1s' }}><ShapeSVG shape={SHAPES.belahKetupat} color="#a7f3d0" rotate="rotate(-10deg)" /></div>
        <div className="absolute top-4 right-1/4 w-24 h-24 animate-materi-float" style={{ animationDelay: '0.5s' }}><ShapeSVG shape={SHAPES.trapesium} color="#fbcfe8" rotate="rotate(5deg)" /></div>
        <div className="absolute bottom-5 right-10 w-16 h-16 animate-materi-float" style={{ animationDelay: '1.5s' }}><ShapeSVG shape={SHAPES.persegi} color="#bae6fd" rotate="rotate(-15deg)" /></div>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black text-gradient mb-4 drop-shadow-lg leading-tight">PETUALANGAN BANGUN DATAR</h1>
      <h2 className="text-lg md:text-2xl font-bold text-[var(--text-main)] mb-10">Mengenal Ciri-Ciri Segitiga dan Segi Empat</h2>

      <div className="glass-panel p-6 max-w-xl mx-auto text-left mb-10">
        <h3 className="font-bold text-[var(--primary)] flex items-center gap-2 mb-3 text-lg"><BookOpen size={20}/> Apa yang akan kita pelajari?</h3>
        <ul className="space-y-2 text-[var(--text-main)] text-sm md:text-base font-medium">
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Mengenali ciri berbagai jenis segitiga.</li>
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Mengelompokkan segitiga berdasarkan bentuknya.</li>
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Mengenali ciri berbagai jenis segi empat.</li>
          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)] shrink-0"/> Menguji pemahaman melalui evaluasi interaktif.</li>
        </ul>
      </div>

      <button onClick={() => setCurrentSlide(1)} className="glass-btn px-8 py-4 rounded-full text-lg font-black flex items-center gap-2 bg-[var(--primary)] text-slate-900 border-none hover:bg-[var(--primary)] shadow-[var(--glow-shadow)] hover:scale-105 transition-transform">
        Mulai Petualangan <ArrowRight size={24} />
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
                  cardClass += "ring-4 ring-dashed ring-yellow-400 opacity-60";
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
                    <div className="w-32 h-32 md:w-40 md:h-40 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
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
          {unplacedCards.length === 0 ? <p className="text-white/50 font-bold my-auto italic">Semua kartu telah dipindahkan.</p> : null}
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
                  {cardsInZone.length === 0 && <span className="text-white/30 text-xs italic my-auto">Tarik ke sini</span>}
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
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 drop-shadow-xl">{image}</div>
          
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
          <button onClick={() => { setQuizAnswers({}); setQuizChecked({}); setCurrentSlide(9); }} className="glass-btn px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
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
  // PENGATURAN SLIDE (12 SLIDE)
  // ==========================================
  const SLIDES = [
    { content: renderSlide1 },
    { content: () => renderMultiSelectSlide(SLIDE2_DATA, s2Selected, setS2Selected, s2Checked, setS2Checked, 'isTriangle', "COBA KAMU CEK!", "Di antara gambar berikut, mana saja yang termasuk bangun segitiga?") },
    { content: () => renderFlashcards("MENGENAL KELUARGA SEGITIGA", "Semua segitiga memiliki 3 sisi, 3 titik sudut, dan 3 sudut. Namun, panjang sisinya dapat berbeda.", [
        { id: 1, name: "Segitiga Sama Sisi", shape: SHAPES.samaSisi, color: "#fef08a", traits: ["Memiliki 3 sisi sama panjang.", "Memiliki 3 sudut sama besar.", "Setiap sudut besarnya 60°."] },
        { id: 2, name: "Segitiga Sama Kaki", shape: SHAPES.samaKaki, color: "#fbcfe8", traits: ["Memiliki 2 sisi sama panjang.", "Dua sudut alas sama besar.", "Memiliki 3 sisi dan 3 titik sudut."] },
        { id: 3, name: "Segitiga Sembarang", shape: SHAPES.sembarang, color: "#bfdbfe", traits: ["Ketiga sisinya berbeda panjang.", "Ketiga sudutnya berbeda besar.", "Memiliki 3 sisi dan 3 titik sudut."] }
      ], s3Flipped, setS3Flipped) 
    },
    { content: () => renderDragAndDrop("MISI KLASIFIKASI SEGITIGA", "Seret/klik segitiga ke kelompok yang tepat berdasarkan panjang sisinya!", SLIDE4_DATA, 
        [{ id: "SAMA_SISI", label: "SEGITIGA SAMA SISI" }, { id: "SAMA_KAKI", label: "SEGITIGA SAMA KAKI" }, { id: "SEMBARANG", label: "SEGITIGA SEMBARANG" }], 
        s4Placements, setS4Placements, s4Checked, setS4Checked, s4SelectedCard, setS4SelectedCard) 
    },
    { content: () => renderMultiSelectSlide(SLIDE5_DATA, s5Selected, setS5Selected, s5Checked, setS5Checked, 'isQuad', "SAATNYA MENJELAJAHI SEGI EMPAT!", "Pilih semua gambar yang merupakan bangun segi empat. Jangan klik bangun yang lain!") },
    { content: () => renderFlashcards("KELUARGA SEGI EMPAT: BAGIAN 1", "Segi empat adalah bangun datar yang memiliki 4 sisi, 4 titik sudut, dan 4 sudut.", [
        { id: 1, name: "Persegi", shape: SHAPES.persegi, color: "#a7f3d0", traits: ["Memiliki 4 sisi sama panjang.", "Memiliki 4 sudut siku-siku (90°).", "Sisi yang berhadapan sejajar."] },
        { id: 2, name: "Persegi Panjang", shape: SHAPES.persegiPanjang, color: "#bae6fd", traits: ["2 pasang sisi berhadapan sama panjang.", "Memiliki 4 sudut siku-siku.", "Sisi yang berhadapan sejajar."] },
        { id: 3, name: "Trapesium", shape: SHAPES.trapesium, color: "#fef08a", traits: ["Memiliki 4 sisi.", "Tepat sepasang sisi berhadapan sejajar.", "Pasangan sisi lain tidak sejajar."] }
      ], s6Flipped, setS6Flipped) 
    },
    { content: () => renderDragAndDrop("MISI KELOMPOK SEGI EMPAT 1", "Kelompokkan bangun persegi, persegi panjang, dan trapesium!", SLIDE7_DATA, 
        [{ id: "PERSEGI", label: "PERSEGI" }, { id: "PERSEGI_PANJANG", label: "PERSEGI PANJANG" }, { id: "TRAPESIUM", label: "TRAPESIUM" }], 
        s7Placements, setS7Placements, s7Checked, setS7Checked, s7SelectedCard, setS7SelectedCard) 
    },
    { content: () => renderFlashcards("LANJUTKAN PETUALANGANMU!", "Masih ada anggota keluarga segi empat yang lain dengan ciri khasnya masing-masing.", [
        { id: 1, name: "Jajar Genjang", shape: SHAPES.jajarGenjang, color: "#fed7aa", traits: ["2 pasang sisi berhadapan sejajar.", "Sisi yang berhadapan sama panjang.", "Sudut yang berhadapan sama besar."] },
        { id: 2, name: "Layang-Layang", shape: SHAPES.layangLayang, color: "#fecaca", traits: ["2 pasang sisi sama panjang berdekatan.", "Satu pasang sudut berhadapan sama besar.", "Diagonalnya saling tegak lurus."] },
        { id: 3, name: "Belah Ketupat", shape: SHAPES.belahKetupat, color: "#e9d5ff", traits: ["4 sisi sama panjang.", "Sisi yang berhadapan sejajar.", "Sudut berhadapan sama besar (bukan siku)."] }
      ], s8Flipped, setS8Flipped) 
    },
    { content: () => renderDragAndDrop("MISI KELOMPOK SEGI EMPAT 2", "Kelompokkan bangun jajar genjang, layang-layang, dan belah ketupat!", SLIDE9_DATA, 
        [{ id: "JAJAR_GENJANG", label: "JAJAR GENJANG" }, { id: "LAYANG_LAYANG", label: "LAYANG-LAYANG" }, { id: "BELAH_KETUPAT", label: "BELAH KETUPAT" }], 
        s9Placements, setS9Placements, s9Checked, setS9Checked, s9SelectedCard, setS9SelectedCard) 
    },
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
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.55); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.4); --shape-stroke: #ffffff; --ok: #4ade80; --bad: #fb7185; background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); --shape-stroke: #2b2d42; --ok: #16a34a; --bad: #e11d48; background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.55); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.4); --shape-stroke: #ffffff; --ok: #4ade80; --bad: #fb7185; background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover:not(:disabled) { transform: translateY(-4px) scale(1.02); box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .glass-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        @keyframes materi-fade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-materi-fade { animation: materi-fade 0.5s ease-out forwards; }
        @keyframes materi-float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
        .animate-materi-float { animation: materi-float 4s ease-in-out infinite; }
        
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
