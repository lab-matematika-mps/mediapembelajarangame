// lab-matematika-mps/mediapembelajarangame/app/barak/tug-of-war/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Trophy, Flame } from "lucide-react";
import BackgroundCanvas from "../../../components/BackgroundCanvas"; // Path diperbaiki

const BANK_SOAL = [
  { pertanyaan: "Aku memiliki 4 sisi yang sama panjang dan 4 sudut siku-siku. Siapakah aku?", opsi: ["Persegi", "Persegi Panjang", "Segitiga", "Lingkaran"], jawabanBenar: "Persegi" },
  { pertanyaan: "Aku memiliki 3 sisi dan 3 sudut. Bangun datar apakah aku?", opsi: ["Persegi", "Segitiga", "Lingkaran", "Trapesium"], jawabanBenar: "Segitiga" },
  { pertanyaan: "Aku memiliki 4 sisi, sisi berhadapan sama panjang, dan 4 sudut siku-siku. Siapakah aku?", opsi: ["Persegi Panjang", "Lingkaran", "Belah Ketupat", "Layang-layang"], jawabanBenar: "Persegi Panjang" },
  { pertanyaan: "Aku tidak memiliki sisi lurus dan tidak memiliki sudut sama sekali. Siapakah aku?", opsi: ["Persegi", "Segitiga", "Lingkaran", "Jajar Genjang"], jawabanBenar: "Lingkaran" },
  { pertanyaan: "Aku memiliki 4 sisi sama panjang, tetapi sudut-sudutku bukan siku-siku. Siapakah aku?", opsi: ["Belah Ketupat", "Persegi", "Persegi Panjang", "Segitiga"], jawabanBenar: "Belah Ketupat" }
];

export default function TugOfWar2P() {
  const router = useRouter();

  const [gameState, setGameState] = useState("landing");
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const [ropePos, setRopePos] = useState(50);
  const [currentSoalIndex, setCurrentSoalIndex] = useState(0);
  const [soalAktif, setSoalAktif] = useState(BANK_SOAL[0]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [winner, setWinner] = useState(null);

  // States untuk sinkronisasi BackgroundCanvas
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    setMusicEnabled(localStorage.getItem("musicEnabled") === "true");
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
    const savedVol = localStorage.getItem("bgVolume");
    if (savedVol) setVolume(parseFloat(savedVol));
  }, []);

  const ambilSoalBaru = () => {
    const randomIndex = Math.floor(Math.random() * BANK_SOAL.length);
    setSoalAktif(BANK_SOAL[randomIndex]);
  };

  const mulaiGame = () => {
    setGameState("playing");
    setRopePos(50);
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    ambilSoalBaru();
  };

  const handleJawab = (player, opsiPilihan) => {
    if (gameState !== "playing") return;
    const isBenar = opsiPilihan === soalAktif.jawabanBenar;

    if (player === 1) {
      if (isBenar) {
        setP1Score(prev => prev + 1);
        setRopePos(prev => { const nextVal = prev - 8; if (nextVal <= 0) akhiriGame("Player 1"); return Math.max(0, nextVal); });
        ambilSoalBaru();
      } else {
        setRopePos(prev => Math.min(100, prev + 4));
      }
    } else {
      if (isBenar) {
        setP2Score(prev => prev + 1);
        setRopePos(prev => { const nextVal = prev + 8; if (nextVal >= 100) akhiriGame("Player 2"); return Math.min(100, nextVal); });
        ambilSoalBaru();
      } else {
        setRopePos(prev => Math.max(0, prev - 4));
      }
    }
  };

  const akhiriGame = (namaPemenang) => {
    setWinner(namaPemenang);
    setGameState("finished");
  };

  return (
    <main className="theme-galaxy h-screen w-screen flex flex-col justify-between relative overflow-hidden font-sans text-white select-none">
      <style dangerouslySetInnerHTML={{
        __html: `
        .theme-galaxy { background: linear-gradient(135deg, #0a0a1a, #1a0b2e); }
        .glass-panel { background: rgba(20, 20, 40, 0.65); backdrop-filter: blur(12px); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 1rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
        .glass-btn { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; transition: all 0.2s ease; }
        .glass-btn:hover { transform: scale(1.02); border-color: #00f3ff; box-shadow: 0 0 15px rgba(0, 243, 255, 0.4); }
        .text-gradient { background: linear-gradient(to right, #00f3ff, #b900ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      {/* Terhubung ke Global Background & Audio, dimatikan musiknya saat main agar fokus */}
      <BackgroundCanvas 
        tema="galaxy" 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled}
        volume={volume}
        forcePauseMusic={true} 
      />

      <div className="absolute top-4 left-4 z-50">
        <button onClick={() => router.push("/dashboard")} className="glass-btn px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold">
          <ArrowLeft size={16} /> Keluar Barak
        </button>
      </div>

      {gameState === "landing" && (
        <div className="flex-1 flex items-center justify-center container mx-auto px-4 z-10">
          <div className="glass-panel p-8 md:p-10 w-full max-w-lg text-center space-y-6">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient">MATH TUG OF WAR</h1>
            <p className="text-sm text-gray-300 font-medium">Mode 2 Player: Adu Cepat Jawab Soal Ciri-Ciri Bangun Datar!</p>

            <div className="space-y-4 text-left bg-black/30 p-4 rounded-xl border border-white/10">
              <div>
                <label className="text-xs font-bold text-cyan-400 mb-1 block">Nama Player 1 (Kiri/Atas):</label>
                <input type="text" value={p1Name} onChange={(e) => setP1Name(e.target.value)} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-bold outline-none focus:border-cyan-400" maxLength={10} />
              </div>
              <div>
                <label className="text-xs font-bold text-pink-400 mb-1 block">Nama Player 2 (Kanan/Bawah):</label>
                <input type="text" value={p2Name} onChange={(e) => setP2Name(e.target.value)} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-bold outline-none focus:border-pink-400" maxLength={10} />
              </div>
            </div>

            <button onClick={mulaiGame} className="w-full py-4 rounded-full text-base font-black bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:scale-105 transition-all">
              🚀 MULAI TARIK TAMBANG!
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex-1 flex flex-col z-10 h-full p-3 gap-2 overflow-hidden">
          
          <div className="flex-1 glass-panel p-3 flex flex-col justify-between border-cyan-500/40 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs md:text-sm font-bold px-2">
              <span className="text-cyan-400 flex items-center gap-1">🛡️ {p1Name} (P1)</span>
              <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">Skor: {p1Score}</span>
            </div>
            
            <div className="text-center my-1">
              <p className="text-xs md:text-sm font-bold text-white bg-black/40 py-1.5 px-4 rounded-lg inline-block border border-white/10 max-w-xl">{soalAktif.pertanyaan}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {soalAktif.opsi.map((opsi, idx) => (
                <button key={idx} onClick={() => handleJawab(1, opsi)} className="glass-btn py-2 px-3 rounded-lg text-xs md:text-sm font-bold hover:bg-cyan-500/20 hover:border-cyan-400 active:scale-95">{opsi}</button>
              ))}
            </div>
          </div>

          <div className="h-16 md:h-20 glass-panel flex flex-col justify-center items-center px-4 relative border-white/20 shadow-inner">
            <div className="absolute inset-x-6 h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-400 via-amber-400 to-pink-500 transition-all duration-300" style={{ width: `${ropePos}%` }}></div>
            </div>
            <div className="absolute w-6 h-6 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_10px_white] flex items-center justify-center text-[10px] font-black transition-all duration-300 z-20" style={{ left: `calc(${ropePos}% - 12px)` }}>⚡</div>
            <div className="flex justify-between w-full text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-wider">
              <span>◄ Menang {p1Name}</span>
              <span>TENGAH ARENA</span>
              <span>Menang {p2Name} ►</span>
            </div>
          </div>

          <div className="flex-1 glass-panel p-3 flex flex-col justify-between border-pink-500/40 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs md:text-sm font-bold px-2">
              <span className="text-pink-400 flex items-center gap-1">⚔️ {p2Name} (P2)</span>
              <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full border border-pink-500/30">Skor: {p2Score}</span>
            </div>
            
            <div className="text-center my-1">
              <p className="text-xs md:text-sm font-bold text-white bg-black/40 py-1.5 px-4 rounded-lg inline-block border border-white/10 max-w-xl">{soalAktif.pertanyaan}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {soalAktif.opsi.map((opsi, idx) => (
                <button key={idx} onClick={() => handleJawab(2, opsi)} className="glass-btn py-2 px-3 rounded-lg text-xs md:text-sm font-bold hover:bg-pink-500/20 hover:border-pink-400 active:scale-95">{opsi}</button>
              ))}
            </div>
          </div>

        </div>
      )}

      {gameState === "finished" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 w-full max-w-md text-center space-y-6 border-cyan-400/50 shadow-[0_0_30px_rgba(0,243,255,0.4)] animate-pulse">
            <Trophy size={64} className="mx-auto text-amber-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
            <div>
              <h2 className="text-3xl font-black text-gradient">PEMENANG TARIK TAMBANG!</h2>
              <p className="text-2xl font-bold text-amber-300 mt-2">🎉 {winner === "Player 1" ? p1Name : p2Name} Berhasil Menarik Lawan! 🎉</p>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2 text-sm">
              <div className="flex justify-between font-bold"><span className="text-cyan-400">{p1Name}:</span><span>{p1Score} Poin</span></div>
              <div className="flex justify-between font-bold"><span className="text-pink-400">{p2Name}:</span><span>{p2Score} Poin</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={mulaiGame} className="flex-1 py-3 rounded-xl font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all">Main Lagi</button>
              <button onClick={() => setGameState("landing")} className="flex-1 py-3 rounded-xl font-bold bg-white/10 border border-white/20 hover:bg-white/20 transition-all">Menu Utama</button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full text-center py-2 bg-transparent z-20 text-[10px] text-gray-400">
        &copy; 2026 Mugeb Primary School &bull; Math Tug of War 2-Player Edition
      </footer>
    </main>
  );
}
