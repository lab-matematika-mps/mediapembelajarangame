"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, setDoc, collection, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import { Trophy, Play, XSquare, LogOut, Navigation, Gift, Target, ShieldCheck, XOctagon } from "lucide-react";

export default function Room() {
  const { id } = useParams();
  const router = useRouter();
  
  // --- STATE DATA ---
  const [roomData, setRoomData] = useState(null);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [skor, setSkor] = useState(0);
  const [players, setPlayers] = useState([]);
  
  // State Permainan
  const [posisi, setPosisi] = useState({ x: 50, y: 50 });
  const [indeksSoal, setIndeksSoal] = useState(0);
  const [soalAktif, setSoalAktif] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canvasRef = useRef(null);

  // --- INISIALISASI FIREBASE & PEMAIN ---
  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);

    // Daftarkan posisi awal pemain ke Firestore
    const playerRef = doc(db, `rooms/${id}/players`, nama);
    setDoc(playerRef, { nama, skor: 0, x: 50, y: 50, status: "menjelajah" }, { merge: true });

    // Listener Data Room
    const roomRef = doc(db, "rooms", id);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
      else router.push("/lobby");
    });

    // Listener Data Players
    const unsubPlayers = onSnapshot(query(collection(db, `rooms/${id}/players`), orderBy("skor", "desc")), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => doc.data()));
    });

    return () => { unsubRoom(); unsubPlayers(); };
  }, [id, router]);

  // --- KONTROL PERGERAKAN KARAKTER ---
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (soalAktif || !roomData || roomData.status !== "playing") return;
      
      let { x, y } = posisi;
      const step = 5; // Besar langkah pergerakan

      if (e.key === "ArrowUp" || e.key === "w") y = Math.max(0, y - step);
      if (e.key === "ArrowDown" || e.key === "s") y = Math.min(90, y + step);
      if (e.key === "ArrowLeft" || e.key === "a") x = Math.max(0, x - step);
      if (e.key === "ArrowRight" || e.key === "d") x = Math.min(90, x + step);

      if (x !== posisi.x || y !== posisi.y) {
        setPosisi({ x, y });
        // Update posisi ke Firebase agar terlihat oleh pemain lain
        await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { x, y });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posisi, soalAktif, roomData, id, namaPeserta]);

  // --- FUNGSI GURU (HOST) ---
  const mulaiGame = async () => await updateDoc(doc(db, "rooms", id), { status: "playing" });
  const akhiriGame = async () => await updateDoc(doc(db, "rooms", id), { status: "finished" });

  // --- FUNGSI MENJAWAB SOAL ---
  const jawabSoal = async (jawabanDipilih) => {
    const soalSekarang = roomData.soal[indeksSoal];
    const isBenar = jawabanDipilih === soalSekarang.jawabanBenar;
    
    setFeedback(isBenar ? "BENAR" : "SALAH");

    if (isBenar) {
      const skorBaru = skor + 10;
      setSkor(skorBaru);
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
    }

    setTimeout(() => {
      setFeedback(null);
      setSoalAktif(false);
      const nextIndex = (indeksSoal + 1) % (roomData.soal?.length || 1);
      setIndeksSoal(nextIndex);
    }, 1500); // Diperpanjang sedikit agar animasi terbaca
  };

  // --- ENGINE ANIMASI CANVAS (Menyesuaikan Tema dari roomData) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !roomData?.tema) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];
    const temaAktif = roomData.tema; // Tema diambil dari pengaturan Host

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;

      if (temaAktif === 'galaxy') {
        for (let i = 0; i < 150; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5, alpha: Math.random(), alphaChange: (Math.random() * 0.02) - 0.01, type: 'star' });
        for (let i = 0; i < 3; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, length: Math.random() * 80 + 20, speedX: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1), speedY: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.1, type: 'comet' });
      } else if (temaAktif === 'sky') {
        for (let i = 0; i < 5; i++) particles.push({ x: Math.random() * w, y: Math.random() * (h/2), w: Math.random() * 200 + 100, h: Math.random() * 40 + 20, speed: Math.random() * 0.5 + 0.1, alpha: Math.random() * 0.2 + 0.1, type: 'cloud' });
        for (let i = 0; i < 30; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 6 + 3, speedY: Math.random() * 1 + 0.5, angle: Math.random() * Math.PI * 2, angleSpeed: (Math.random() * 0.05) - 0.025, color: Math.random() > 0.5 ? '#ffb347' : '#ffcc33', type: 'leaf' });
      } else if (temaAktif === 'ocean') {
        for (let i = 0; i < 80; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 4 + 1, speedY: -(Math.random() * 2 + 0.5), wobble: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 0.05, type: 'bubble' });
        for (let i = 0; i < 5; i++) particles.push({ x: Math.random() * w, y: Math.random() * h * 0.8 + h * 0.1, size: Math.random() * 20 + 10, speedX: -(Math.random() * 1.5 + 0.5), wobble: Math.random() * Math.PI * 2, type: 'fish' });
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        if (temaAktif === 'galaxy') {
          if (p.type === 'star') {
            p.alpha += p.alphaChange;
            if (p.alpha <= 0 || p.alpha >= 1) p.alphaChange *= -1;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.alpha)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          } else if (p.type === 'comet') {
            p.x += p.speedX; p.y += p.speedY;
            if (p.x > canvas.width + 100 || p.x < -100 || p.y > canvas.height + 100) { p.x = Math.random() * canvas.width; p.y = -50; }
            const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.speedX * 10, p.y - p.speedY * 10);
            gradient.addColorStop(0, `rgba(0, 243, 255, ${p.alpha})`); gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
            ctx.strokeStyle = gradient; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.speedX * 10, p.y - p.speedY * 10); ctx.stroke();
          }
        } else if (temaAktif === 'sky') {
          if (p.type === 'cloud') {
            p.x += p.speed; if (p.x > canvas.width + p.w) p.x = -p.w;
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, p.h/2); ctx.fill();
          } else if (p.type === 'leaf') {
            p.y += p.speedY; p.angle += p.angleSpeed; p.x += Math.sin(p.angle) * 1;
            if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
            ctx.fillStyle = p.color; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size/2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
        } else if (temaAktif === 'ocean') {
          if (p.type === 'bubble') {
            p.y += p.speedY; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 0.5;
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
            ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
          } else if (p.type === 'fish') {
            p.x += p.speedX; p.wobble += 0.05; p.y += Math.sin(p.wobble) * 0.5;
            if (p.x < -50) { p.x = canvas.width + 50; p.y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1; }
            ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
            ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size/3, 0, 0, Math.PI*2);
            ctx.moveTo(p.x + p.size*0.8, p.y); ctx.lineTo(p.x + p.size*1.5, p.y - p.size/2); ctx.lineTo(p.x + p.size*1.5, p.y + p.size/2); ctx.fill();
          }
        }
      });
    };

    window.addEventListener('resize', resize);
    resize();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
  }, [roomData?.tema]);


  // Jika data belum dimuat
  if (!roomData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Navigation size={48} className="text-indigo-400 animate-spin" />
          <h2 className="font-bold text-xl tracking-widest text-indigo-200">MEMUAT ARENA...</h2>
        </div>
      </div>
    );
  }

  const isHost = roomData.host === namaPeserta;
  const temaAktif = roomData.tema || "galaxy";

  return (
    <main className={`theme-${temaAktif} min-h-screen relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000 select-none`}>
      
      {/* CSS VARIABLES */}
      <style dangerouslySetInnerHTML={{
        __html: `
        :root { --font-main: 'Space Grotesk', sans-serif; }
        .theme-galaxy {
          --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --primary-hover: #00d0ff; --secondary: #b900ff;
          --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2);
          --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom));
        }
        .theme-sky {
          --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --primary-hover: #f0716f; --secondary: #84a59d;
          --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3);
          --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom));
        }
        .theme-ocean {
          --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --primary-hover: #00b0ff; --secondary: #00ff88;
          --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3);
          --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom));
        }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: all 0.4s ease; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      {/* CANVAS BACKGROUND */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none"></canvas>

      {/* ========================================================================= */}
      {/* 1. TAMPILAN ARENA EXPLORE UNTUK SISWA (SAAT STATUS "PLAYING")             */}
      {/* ========================================================================= */}
      {roomData.status === "playing" && !isHost && (
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(rgba(255,255,255,0.07)_1.5px,transparent_1.5px)] [background-size:40px_40px] z-10 overflow-hidden">
          
          {/* Petunjuk Kontrol */}
          <div className="absolute top-6 left-6 z-20 glass-panel p-5 border-l-4 border-l-[var(--primary)] max-w-xs">
            <h3 className="font-black flex items-center gap-2 mb-2 text-[var(--primary)]"><Target size={20}/> Misi: Jelajahi Peta</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">Gunakan tombol <b>W, A, S, D</b> atau <b>Panah Keyboard</b> untuk mencari harta karun di peta!</p>
            <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--text-main)]">Skor Kamu:</span>
              <span className="text-lg font-black text-gradient">{skor} Pts</span>
            </div>
          </div>

          {/* Tombol Harta Karun di Peta */}
          <div 
            onClick={() => setSoalAktif(true)}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          >
            <div className="relative animate-bounce">
              {/* Glow Effect Harta */}
              <div className="absolute inset-0 bg-[var(--primary)] blur-xl opacity-40 group-hover:opacity-80 transition-opacity rounded-full"></div>
              <div className="w-20 h-20 glass-panel border-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-[var(--glow-shadow)] bg-[var(--primary)]/20">
                <Gift size={36} className="text-[var(--primary)] drop-shadow-md" />
              </div>
            </div>
            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 glass-panel px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap text-[var(--primary)] border-[var(--primary)]/50 backdrop-blur-md">
              Klik Ambil Harta!
            </span>
          </div>

          {/* Render Karakter Pemain */}
          {players.map((p, idx) => (
            <div 
              key={idx}
              className="absolute transition-all duration-300 ease-linear flex flex-col items-center"
              style={{ top: `${p.y || 50}%`, left: `${p.x || 50}%` }}
            >
              <span className="glass-panel text-[10px] font-bold px-3 py-1 rounded-full mb-2 whitespace-nowrap shadow-md">
                {p.nama} {p.nama === namaPeserta && <span className="text-[var(--primary)]">(Kamu)</span>}
              </span>
              
              {/* Box Pemain */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-2 ${
                p.nama === namaPeserta 
                  ? "bg-[var(--primary)]/20 border-[var(--primary)] shadow-[var(--glow-shadow)] backdrop-blur-md" 
                  : "bg-white/10 border-white/30 backdrop-blur-md"
              }`}>
                {p.nama === namaPeserta ? <Navigation size={24} className="text-[var(--primary)] -rotate-45" /> : <span className="text-white/70">📦</span>}
              </div>
            </div>
          ))}

          {/* Modal Pertanyaan (Pop Up) */}
          {soalAktif && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity">
              <div className="glass-panel p-8 md:p-10 w-full max-w-2xl text-center relative border-[var(--primary)]/50 shadow-[var(--glow-shadow)] overflow-hidden">
                
                {/* Overlay Feedback Benar/Salah */}
                {feedback && (
                  <div className="absolute inset-0 glass-panel border-none rounded-2xl flex flex-col items-center justify-center z-20" style={{ background: 'var(--glass-bg)'}}>
                    {feedback === "BENAR" ? (
                      <>
                        <ShieldCheck size={80} className="text-emerald-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        <h1 className="text-4xl md:text-5xl font-black text-emerald-400">HARTA DIDAPAT!</h1>
                        <p className="mt-2 text-emerald-200 font-bold">+10 Poin</p>
                      </>
                    ) : (
                      <>
                        <XOctagon size={80} className="text-rose-400 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]" />
                        <h1 className="text-4xl md:text-5xl font-black text-rose-400">GAGAL!</h1>
                        <p className="mt-2 text-rose-200 font-bold">Coba lagi nanti!</p>
                      </>
                    )}
                  </div>
                )}

                <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-black px-5 py-2 rounded-full border border-[var(--primary)]/40 tracking-widest mb-6 shadow-[0_0_10px_var(--primary)]">
                  UJI MATEMATIKA PETUALANG
                </span>
                
                <p className="mb-8 text-xl md:text-2xl font-bold leading-relaxed">{roomData.soal && roomData.soal[indeksSoal]?.pertanyaan}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roomData.soal && roomData.soal[indeksSoal]?.opsi.map((opsi, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => jawabSoal(opsi)}
                      className="glass-btn p-5 rounded-2xl font-bold text-lg hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] active:scale-95 flex items-center justify-center"
                    >
                      {opsi}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ========================================================================= */}
      {/* 2. TAMPILAN DASHBOARD HOST (GURU) & STATUS LAINNYA DI TENGAH LAYAR        */}
      {/* ========================================================================= */}
      {(isHost || roomData.status !== "playing") && (
        <div className="relative z-20 flex-1 flex items-center justify-center p-6 w-full">
          <div className="glass-panel p-8 md:p-10 w-full max-w-2xl text-center float-anim border-t-4 border-t-[var(--primary)]">
            
            {/* --- STATE: GAME SELESAI (KLASEMEN AKHIR) --- */}
            {roomData.status === "finished" && (
              <div>
                <div className="inline-block p-4 rounded-full bg-[var(--primary)]/20 mb-4 border border-[var(--primary)]/30">
                  <Trophy size={48} className="text-[var(--primary)] drop-shadow-md" />
                </div>
                <h2 className="text-3xl font-black mb-6 text-gradient tracking-tight">KLASEMEN AKHIR</h2>
                
                <div className="glass-panel bg-black/20 p-2 max-h-80 overflow-y-auto mb-8 border-none custom-scrollbar">
                  {players.map((p, index) => (
                    <div key={index} className="flex justify-between items-center glass-btn border-white/10 p-4 mb-2 rounded-xl">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10'}`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-lg">{p.nama}</span>
                      </div>
                      <span className="font-black text-[var(--primary)] text-xl">{p.skor} Pts</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => router.push("/lobby")} 
                  className="w-full py-4 rounded-2xl font-black text-lg transition-transform hover:scale-105"
                  style={{ background: 'var(--primary)', color: temaAktif === 'sky' ? '#fff' : '#000' }}
                >
                  Kembali ke Lobby
                </button>
              </div>
            )}

            {/* --- STATE: WAITING (MENUNGGU DIMULAI) --- */}
            {roomData.status === "waiting" && (
              <div>
                <h2 className="text-3xl font-black text-gradient mb-2">{roomData.nama_room}</h2>
                <p className="text-[var(--text-muted)] mb-8 font-medium uppercase tracking-widest text-sm">Tema: {roomData.tema}</p>
                
                {isHost && (
                  <button 
                    onClick={mulaiGame} 
                    className="pulse-slow w-full py-5 rounded-2xl font-black text-lg mb-8 flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                    style={{ background: 'var(--primary)', color: temaAktif === 'sky' ? '#fff' : '#000' }}
                  >
                    <Play fill="currentColor" size={24} /> MULAI EKSPLORASI DUNIA!
                  </button>
                )}

                <div className="text-left border-t border-[var(--glass-border)] pt-6">
                  <p className="text-sm font-bold text-[var(--text-muted)] mb-4 flex items-center gap-2">
                    <Navigation size={16}/> Pemain yang sudah bergabung:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {players.length === 0 && <span className="text-[var(--text-muted)] text-sm italic">Belum ada siswa yang masuk...</span>}
                    {players.map((p, idx) => (
                      <span key={idx} className="glass-btn px-4 py-2 rounded-full text-sm font-bold border-[var(--primary)]/30 text-[var(--text-main)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                        {p.nama}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- STATE: PLAYING - PANTUAN KHUSUS HOST --- */}
            {roomData.status === "playing" && isHost && (
              <div>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                  <h2 className="text-2xl font-black text-[var(--primary)] tracking-wide">Pantauan Live Guru</h2>
                </div>

                <div className="glass-panel bg-black/20 p-2 max-h-80 overflow-y-auto mb-8 border-none">
                  {players.map((p, index) => (
                    <div key={index} className="flex justify-between items-center glass-btn border-white/10 p-4 mb-2 rounded-xl text-left">
                      <span className="font-bold text-lg">{index + 1}. {p.nama}</span>
                      <span className="font-black text-[var(--primary)] text-xl bg-[var(--primary)]/10 px-3 py-1 rounded-lg">{p.skor} Pts</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={akhiriGame} 
                  className="w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <XSquare size={20} /> Akhiri Petualangan (Stop)
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      
    </main>
  );
}