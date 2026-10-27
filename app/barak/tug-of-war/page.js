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
  
  // Masing-masing pemain punya soal sendiri agar bisa adu cepat mandiri
  const [p1SoalAktif, setP1SoalAktif] = useState(BANK_SOAL[0]);
  const [p2SoalAktif, setP2SoalAktif] = useState(BANK_SOAL[1]);
  
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
        // Tarik ke Kiri
        setRopePos(prev => { 
          const nextVal = prev - 8; 
          if (nextVal <= 0) akhiriGame(p1Name); 
          return Math.max(0, nextVal); 
        });
        setP1SoalAktif(getSoalAcak());
      } else {
        // Penalti ditarik lawan jika salah
        setRopePos(prev => Math.min(100, prev + 4));
      }
    } else {
      const isBenar = opsiPilihan === p2SoalAktif.jawabanBenar;
      if (isBenar) {
        setP2Score(prev => prev + 1);
        // Tarik ke Kanan
        setRopePos(prev => { 
          const nextVal = prev + 8; 
          if (nextVal >= 100) akhiriGame(p2Name); 
          return Math.min(100, nextVal); 
        });
        setP2SoalAktif(getSoalAcak());
      } else {
        // Penalti ditarik lawan jika salah
        setRopePos(prev => Math.max(0, prev - 4));
      }
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
        .btn-3d-merah { background-color: #e11d48; box-shadow: 0 6px 0 #9f1239; transition: all 0.1s; }
        .btn-3d-merah:active { transform: translateY(6px); box-shadow: 0 0px 0 #9f1239; }
        .btn-3d-biru { background-color: #0284c7; box-shadow: 0 6px 0 #075985; transition: all 0.1s; }
        .btn-3d-biru:active { transform: translateY(6px); box-shadow: 0 0px 0 #075985; }
      `}} />

      <BackgroundCanvas 
        tema="galaxy" 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled}
        volume={volume}
        forcePauseMusic={true} 
      />

      {/* HEADER & KEMBALI */}
      <div className="absolute top-4 left-4 z-50">
        <button onClick={() => router.push("/dashboard")} className="glass-btn px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg">
          <ArrowLeft size={16} /> Keluar Barak
        </button>
      </div>

      {gameState === "landing" && (
        <div className="flex-1 flex items-center justify-center container mx-auto px-4 z-10">
          <div className="glass-panel p-8 md:p-10 w-full max-w-lg text-center space-y-6">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient">MATH TUG OF WAR</h1>
            <p className="text-sm text-gray-300 font-medium">Mode Duel 1 Layar: Kiri (Merah) vs Kanan (Biru)</p>

            <div className="space-y-4 text-left bg-black/30 p-4 rounded-xl border border-white/10">
              <div>
                <label className="text-xs font-bold text-rose-400 mb-1 block">Tim Merah (Posisi Kiri):</label>
                <input type="text" value={p1Name} onChange={(e) => setP1Name(e.target.value)} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-bold outline-none focus:border-rose-400" maxLength={10} />
              </div>
              <div>
                <label className="text-xs font-bold text-sky-400 mb-1 block">Tim Biru (Posisi Kanan):</label>
                <input type="text" value={p2Name} onChange={(e) => setP2Name(e.target.value)} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/20 text-white font-bold outline-none focus:border-sky-400" maxLength={10} />
              </div>
            </div>

            <button onClick={mulaiGame} className="w-full py-4 rounded-full text-base font-black bg-gradient-to-r from-rose-500 to-sky-500 text-white shadow-lg hover:scale-105 transition-all border border-white/20">
              🚀 MULAI PERTANDINGAN!
            </button>
          </div>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex-1 flex flex-col z-10 w-full h-full">
          
          {/* AREA TALI TAMBANG (ATAS) */}
          <div className="h-28 md:h-36 w-full flex items-center justify-between px-8 md:px-20 border-b border-white/10 bg-black/40 relative shadow-xl">
            <div className="text-5xl md:text-6xl z-20 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] -scale-x-100">🧑‍🚀</div>
            
            <div className="absolute left-20 right-20 md:left-36 md:right-36 h-3 bg-[#654321] rounded-full border-y-2 border-dashed border-[#8B4513] shadow-lg">
              {/* Garis batas tengah */}
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1 h-16 bg-white/30 z-0"></div>
              
              {/* Indikator/Bola Tarikan */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 bg-yellow-400 rounded-full border-4 border-white shadow-[0_0_20px_rgba(250,204,21,1)] transition-all duration-300 z-10 flex items-center justify-center" style={{ left: `${ropePos}%` }}>
                 <div className="w-4 h-4 bg-yellow-600 rounded-full opacity-50"></div>
              </div>
            </div>

            <div className="text-5xl md:text-6xl z-20 drop-shadow-[0_0_15px_rgba(2,132,199,0.8)]">👽</div>
          </div>

          {/* AREA SOAL PEMAIN (BAWAH) - DIBELAH DUA */}
          <div className="flex-1 flex flex-row w-full overflow-hidden">
            
            {/* PLAYER 1 (KIRI - MERAH) */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 md:p-8 bg-rose-950/40 border-r-4 border-black/50 relative">
               <h2 className="text-xl md:text-2xl font-black text-rose-400 mb-4 bg-rose-900/30 px-6 py-2 rounded-full border border-rose-500/30 shadow-lg">{p1Name}</h2>
               
               {/* Kotak Soal P1 */}
               <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center text-slate-900 shadow-[0_0_30px_rgba(225,29,72,0.3)] mb-6 border-4 border-rose-500">
                  <h3 className="text-lg md:text-xl font-black leading-tight">{p1SoalAktif.pertanyaan}</h3>
               </div>
               
               {/* Tombol Opsi P1 */}
               <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-sm">
                  {p1SoalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => handleJawab(1, opsi)} className="btn-3d-merah text-white font-black py-5 md:py-7 rounded-xl text-lg md:text-xl px-2">
                      {opsi}
                    </button>
                  ))}
               </div>
            </div>

            {/* PLAYER 2 (KANAN - BIRU) */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 md:p-8 bg-sky-950/40 relative">
               <h2 className="text-xl md:text-2xl font-black text-sky-400 mb-4 bg-sky-900/30 px-6 py-2 rounded-full border border-sky-500/30 shadow-lg">{p2Name}</h2>
               
               {/* Kotak Soal P2 */}
               <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center text-slate-900 shadow-[0_0_30px_rgba(2,132,199,0.3)] mb-6 border-4 border-sky-500">
                  <h3 className="text-lg md:text-xl font-black leading-tight">{p2SoalAktif.pertanyaan}</h3>
               </div>
               
               {/* Tombol Opsi P2 */}
               <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-sm">
                  {p2SoalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => handleJawab(2, opsi)} className="btn-3d-biru text-white font-black py-5 md:py-7 rounded-xl text-lg md:text-xl px-2">
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
          <div className="glass-panel p-8 md:p-12 w-full max-w-md text-center space-y-6 shadow-[0_0_50px_rgba(250,204,21,0.3)] border-t-8 border-yellow-400 relative overflow-hidden">
            <Trophy size={80} className="mx-auto text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white tracking-widest">K.O!</h2>
              <p className="text-2xl font-bold text-amber-400 mt-2 bg-black/40 py-2 px-4 rounded-xl border border-white/10">
                🎉 {winner} Menang! 🎉
              </p>
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-white/10 space-y-3 text-lg relative z-10">
              <div className="flex justify-between font-black"><span className="text-rose-400">{p1Name}:</span><span className="text-white">{p1Score} Jawaban</span></div>
              <div className="flex justify-between font-black"><span className="text-sky-400">{p2Name}:</span><span className="text-white">{p2Score} Jawaban</span></div>
            </div>

            <div className="flex gap-4 relative z-10">
              <button onClick={mulaiGame} className="flex-1 py-4 rounded-xl font-black bg-yellow-400 text-slate-900 hover:bg-yellow-300 transition-all shadow-lg hover:scale-105">Main Lagi</button>
              <button onClick={() => setGameState("landing")} className="flex-1 py-4 rounded-xl font-black bg-white/10 border border-white/20 hover:bg-white/20 transition-all">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
