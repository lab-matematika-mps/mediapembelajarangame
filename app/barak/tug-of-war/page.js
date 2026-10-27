// lab-matematika-mps/mediapembelajarangame/app/barak/tug-of-war/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import BackgroundCanvas from "../../../components/BackgroundCanvas"; 

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
  
  // Posisi tali: 50 = Tengah. 0 = P1 Menang (Kiri). 100 = P2 Menang (Kanan)
  const [ropePos, setRopePos] = useState(50);
  
  const [p1SoalAktif, setP1SoalAktif] = useState(BANK_SOAL[0]);
  const [p2SoalAktif, setP2SoalAktif] = useState(BANK_SOAL[1]);
  
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [winner, setWinner] = useState(null);

  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    setMusicEnabled(localStorage.getItem("musicEnabled") === "true");
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
    const savedVol = localStorage.getItem("bgVolume");
    if (savedVol) setVolume(parseFloat(savedVol));
  }, []);

  const getSoalAcak = () => {
    return BANK_SOAL[Math.floor(Math.random() * BANK_SOAL.length)];
  };

  const mulaiGame = () => {
    setGameState("playing");
    setRopePos(50);
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    setP1SoalAktif(getSoalAcak());
    setP2SoalAktif(getSoalAcak());
  };

  const handleJawab = (player, opsiPilihan) => {
    if (gameState !== "playing") return;

    if (player === 1) {
      const isBenar = opsiPilihan === p1SoalAktif.jawabanBenar;
      if (isBenar) {
        setP1Score(prev => prev + 1);
        setRopePos(prev => { 
          const nextVal = prev - 8; 
          if (nextVal <= 0) akhiriGame(p1Name); 
          return Math.max(0, nextVal); 
        });
      } else {
        setRopePos(prev => Math.min(100, prev + 4));
      }
      // P1: Selalu ganti soal setelah menjawab
      setP1SoalAktif(getSoalAcak());
    } else {
      const isBenar = opsiPilihan === p2SoalAktif.jawabanBenar;
      if (isBenar) {
        setP2Score(prev => prev + 1);
        setRopePos(prev => { 
          const nextVal = prev + 8; 
          if (nextVal >= 100) akhiriGame(p2Name); 
          return Math.min(100, nextVal); 
        });
      } else {
        setRopePos(prev => Math.max(0, prev - 4));
      }
      // P2: Selalu ganti soal setelah menjawab
      setP2SoalAktif(getSoalAcak());
    }
  };

  const akhiriGame = (namaPemenang) => {
    setWinner(namaPemenang);
    setGameState("finished");
  };

  return (
    <main className="theme-galaxy h-screen w-screen flex flex-col relative overflow-hidden font-sans text-white select-none">
      <style dangerouslySetInnerHTML={{
        __html: `
        .theme-galaxy { background: linear-gradient(135deg, #0a0a1a, #1a0b2e); }
        .glass-panel { background: rgba(20, 20, 40, 0.65); backdrop-filter: blur(12px); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 1rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
        .glass-btn { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; transition: all 0.2s ease; }
        .glass-btn:hover { transform: scale(1.02); border-color: #00f3ff; box-shadow: 0 0 15px rgba(0, 243, 255, 0.4); }
        .text-gradient { background: linear-gradient(to right, #00f3ff, #b900ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-3d-merah { background-color: #e11d48; box-shadow: 0 5px 0 #9f1239; transition: all 0.1s; }
        .btn-3d-merah:active { transform: translateY(5px); box-shadow: 0 0px 0 #9f1239; }
        .btn-3d-biru { background-color: #0284c7; box-shadow: 0 5px 0 #075985; transition: all 0.1s; }
        .btn-3d-biru:active { transform: translateY(5px); box-shadow: 0 0px 0 #075985; }
      `}} />

      <BackgroundCanvas 
        tema="galaxy" 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled}
        volume={volume}
        forcePauseMusic={true} 
      />

      <div className="absolute top-4 left-4 z-50">
        <button onClick={() => router.push("/dashboard")} className="glass-btn px-4 py-2 rounded-full flex items-center gap-2 text-xs md:text-sm font-bold shadow-lg">
          <ArrowLeft size={16} /> Keluar Barak
        </button>
      </div>

      {gameState === "landing" && (
        <div className="flex-1 flex items-center justify-center container mx-auto px-4 z-10">
          <div className="glass-panel p-6 md:p-8 w-full max-w-lg text-center space-y-6">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient">MATH TUG OF WAR</h1>
            <p className="text-xs md:text-sm text-gray-300 font-medium">Mode Duel 1 Layar: Kiri (Merah) vs Kanan (Biru)</p>

            <div className="space-y-4 text-left bg-black/30 p-4 rounded-xl border border-white/10">
              <div>
                <label className="text-xs font-bold text-rose-400 mb-1 block">Tim Merah (Posisi Kiri):</label>
                <input type="text" value={p1Name} onChange={(e) => setP1Name(e.target.value)} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-bold outline-none focus:border-rose-400 text-sm" maxLength={10} />
              </div>
              <div>
                <label className="text-xs font-bold text-sky-400 mb-1 block">Tim Biru (Posisi Kanan):</label>
                <input type="text" value={p2Name} onChange={(e) => setP2Name(e.target.value)} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-bold outline-none focus:border-sky-400 text-sm" maxLength={10} />
              </div>
            </div>

            <button onClick={mulaiGame} className="w-full py-3.5 rounded-full text-sm font-black bg-gradient-to-r from-rose-500 to-sky-500 text-white shadow-lg hover:scale-105 transition-all border border-white/20">
              🚀 MULAI PERTANDINGAN!
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex-1 flex flex-col z-10 w-full h-full">
          
          {/* AREA TALI TAMBANG (DIKECILKAN) */}
          <div className="h-20 md:h-28 w-full flex items-center justify-between px-6 md:px-12 border-b border-white/10 bg-black/40 relative shadow-xl">
            <div className="text-4xl md:text-5xl z-20 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] -scale-x-100">🧑‍🚀</div>
            
            <div className="absolute left-16 right-16 md:left-28 md:right-28 h-2.5 bg-[#654321] rounded-full border-y-2 border-dashed border-[#8B4513] shadow-lg">
              {/* Garis batas tengah */}
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1 h-12 bg-white/30 z-0"></div>
              
              {/* Indikator/Bola Tarikan */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(250,204,21,1)] transition-all duration-300 z-10 flex items-center justify-center" style={{ left: `${ropePos}%` }}>
                 <div className="w-3 h-3 bg-yellow-600 rounded-full opacity-50"></div>
              </div>
            </div>

            <div className="text-4xl md:text-5xl z-20 drop-shadow-[0_0_15px_rgba(2,132,199,0.8)]">👽</div>
          </div>

          {/* AREA SOAL PEMAIN - DIBELAH DUA */}
          <div className="flex-1 flex flex-row w-full overflow-hidden">
            
            {/* PLAYER 1 (KIRI - MERAH) */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center p-3 md:p-6 bg-rose-950/40 border-r-2 border-black/50 relative">
               <h2 className="text-base md:text-lg font-black text-rose-400 mb-3 bg-rose-900/30 px-5 py-1.5 rounded-full border border-rose-500/30 shadow-lg truncate max-w-full">{p1Name}</h2>
               
               {/* Kotak Soal P1 */}
               <div className="w-full max-w-[280px] bg-white rounded-xl p-4 text-center text-slate-900 shadow-[0_0_20px_rgba(225,29,72,0.3)] mb-4 border-[3px] border-rose-500">
                  <h3 className="text-sm md:text-base font-black leading-snug">{p1SoalAktif.pertanyaan}</h3>
               </div>
               
               {/* Tombol Opsi P1 */}
               <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                  {p1SoalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => handleJawab(1, opsi)} className="btn-3d-merah text-white font-black py-3 md:py-4 rounded-xl text-xs md:text-sm px-2">
                      {opsi}
                    </button>
                  ))}
               </div>
            </div>

            {/* PLAYER 2 (KANAN - BIRU) */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center p-3 md:p-6 bg-sky-950/40 relative">
               <h2 className="text-base md:text-lg font-black text-sky-400 mb-3 bg-sky-900/30 px-5 py-1.5 rounded-full border border-sky-500/30 shadow-lg truncate max-w-full">{p2Name}</h2>
               
               {/* Kotak Soal P2 */}
               <div className="w-full max-w-[280px] bg-white rounded-xl p-4 text-center text-slate-900 shadow-[0_0_20px_rgba(2,132,199,0.3)] mb-4 border-[3px] border-sky-500">
                  <h3 className="text-sm md:text-base font-black leading-snug">{p2SoalAktif.pertanyaan}</h3>
               </div>
               
               {/* Tombol Opsi P2 */}
               <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                  {p2SoalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => handleJawab(2, opsi)} className="btn-3d-biru text-white font-black py-3 md:py-4 rounded-xl text-xs md:text-sm px-2">
                      {opsi}
                    </button>
                  ))}
               </div>
            </div>

          </div>
        </div>
      )}

      {gameState === "finished" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-panel p-6 md:p-10 w-full max-w-sm text-center space-y-5 shadow-[0_0_50px_rgba(250,204,21,0.3)] border-t-8 border-yellow-400 relative overflow-hidden">
            <Trophy size={60} className="mx-auto text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-widest">K.O!</h2>
              <p className="text-xl font-bold text-amber-400 mt-2 bg-black/40 py-2 px-3 rounded-xl border border-white/10">
                🎉 {winner} Menang! 🎉
              </p>
            </div>

            <div className="bg-black/50 p-5 rounded-xl border border-white/10 space-y-2 text-sm relative z-10">
              <div className="flex justify-between font-black"><span className="text-rose-400">{p1Name}:</span><span className="text-white">{p1Score} Jawaban</span></div>
              <div className="flex justify-between font-black"><span className="text-sky-400">{p2Name}:</span><span className="text-white">{p2Score} Jawaban</span></div>
            </div>

            <div className="flex flex-col gap-3 relative z-10 mt-2">
              <button onClick={mulaiGame} className="w-full py-3.5 rounded-xl text-sm font-black bg-yellow-400 text-slate-900 hover:bg-yellow-300 transition-all shadow-lg hover:scale-105">MAIN LAGI</button>
              <div className="flex gap-3">
                <button onClick={() => setGameState("landing")} className="flex-1 py-3 rounded-xl text-sm font-black bg-white/10 border border-white/20 hover:bg-white/20 transition-all">Ganti Nama</button>
                <button onClick={() => router.push("/dashboard")} className="flex-1 py-3 rounded-xl text-sm font-black bg-sky-500/80 border border-sky-500/50 hover:bg-sky-500 transition-all shadow-lg">Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
