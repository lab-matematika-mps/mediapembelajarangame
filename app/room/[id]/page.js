"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, setDoc, collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { Trophy, Play, XSquare, Navigation, Gift, Target, ShieldCheck, XOctagon, Settings2, BookOpen, BarChart, Hash, Map, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const GRID_SIZE = 10; // Ukuran papan catur 10x10

export default function Room() {
  const { id } = useParams();
  const router = useRouter();
  
  // --- STATE DATA ---
  const [roomData, setRoomData] = useState(null);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [skor, setSkor] = useState(0);
  const [players, setPlayers] = useState([]);
  
  // State Permainan (Siswa)
  const [posisi, setPosisi] = useState({ x: 0, y: 0 });
  const [soalAktif, setSoalAktif] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // State Pengaturan (Guru/Host)
  const [pengaturan, setPengaturan] = useState({
    mode: "Kumpulkan Harta",
    materi: "Ciri-ciri Bangun Datar",
    tingkat: "Mudah",
    jumlah: 5
  });

  const canvasRef = useRef(null);
  const [particlesEnabled, setParticlesEnabled] = useState(true);

  // --- INISIALISASI & MATIKAN MUSIK ---
  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);
    
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");

    if (typeof window !== "undefined" && window.bgMusic) {
      window.bgMusic.pause();
    }

    const playerRef = doc(db, `rooms/${id}/players`, nama);
    setDoc(playerRef, { nama, skor: 0, x: 0, y: 0, status: "menjelajah" }, { merge: true });

    const roomRef = doc(db, "rooms", id);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
      else router.push("/lobby");
    });

    const unsubPlayers = onSnapshot(query(collection(db, `rooms/${id}/players`), orderBy("skor", "desc")), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => doc.data()));
    });

    return () => { unsubRoom(); unsubPlayers(); };
  }, [id, router]);

  // --- LOGIKA UTAMA PERGERAKAN KARAKTER (BISA DIPANGGUL KEYBOARD MAUPUN JOYSTICK HP) ---
  const gerak = async (arah) => {
    if (soalAktif || !roomData || roomData.status !== "playing") return;
    
    let newX = posisi.x;
    let newY = posisi.y;

    if (arah === "UP") newY = Math.max(0, newY - 1);
    if (arah === "DOWN") newY = Math.min(GRID_SIZE - 1, newY + 1);
    if (arah === "LEFT") newX = Math.max(0, newX - 1);
    if (arah === "RIGHT") newX = Math.min(GRID_SIZE - 1, newX + 1);

    if (newX !== posisi.x || newY !== posisi.y) {
      setPosisi({ x: newX, y: newY });
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { x: newX, y: newY });

      // Deteksi Tabrakan Harta Karun
      const currentTreasure = roomData.soal?.find(s => s.x === newX && s.y === newY && !s.isSelesai);
      
      if (currentTreasure) {
        if (currentTreasure.claimedBy === null || currentTreasure.claimedBy === namaPeserta) {
          setSoalAktif(currentTreasure);
          if (currentTreasure.claimedBy === null) {
            const newSoal = [...roomData.soal];
            const tIndex = newSoal.findIndex(s => s.soalIndex === currentTreasure.soalIndex);
            newSoal[tIndex] = { ...newSoal[tIndex], claimedBy: namaPeserta };
            updateDoc(doc(db, "rooms", id), { soal: newSoal });
          }
        } else {
          setFeedback({ type: "WARNING", text: `Diklaim oleh ${currentTreasure.claimedBy}!` });
          setTimeout(() => setFeedback(null), 2000);
        }
      }
    }
  };

  // --- KEYBOARD EVENT LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "w") gerak("UP");
      if (e.key === "ArrowDown" || e.key === "s") gerak("DOWN");
      if (e.key === "ArrowLeft" || e.key === "a") gerak("LEFT");
      if (e.key === "ArrowRight" || e.key === "d") gerak("RIGHT");
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posisi, soalAktif, roomData, id, namaPeserta]);

  // --- FUNGSI GURU (HOST): MULAI GAME & GENERATE SOAL ---
  const mulaiGame = async () => {
    try {
      const q = query(collection(db, "daftar_soal"), 
        where("materi", "==", pengaturan.materi),
        where("tingkat", "==", pengaturan.tingkat)
      );
      const snapshot = await getDocs(q);
      let allSoal = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      
      allSoal = allSoal.sort(() => 0.5 - Math.random()).slice(0, parseInt(pengaturan.jumlah));
      
      if(allSoal.length === 0) {
        alert("Soal tidak ditemukan untuk materi & tingkat ini! Cek Bank Soal Admin.");
        return;
      }

      const usedCoords = new Set();
      usedCoords.add("0,0"); 
      
      const soalWithCoords = allSoal.map((soal, index) => {
        let rx, ry;
        do {
          rx = Math.floor(Math.random() * GRID_SIZE);
          ry = Math.floor(Math.random() * GRID_SIZE);
        } while(usedCoords.has(`${rx},${ry}`));
        usedCoords.add(`${rx},${ry}`);
        
        return {
          ...soal,
          soalIndex: index,
          x: rx,
          y: ry,
          claimedBy: null,
          isSelesai: false
        };
      });

      await updateDoc(doc(db, "rooms", id), { 
        status: "playing",
        pengaturan: pengaturan,
        soal: soalWithCoords 
      });

    } catch (error) {
      alert("Gagal memulai game: " + error.message);
    }
  };

  const akhiriGame = async () => await updateDoc(doc(db, "rooms", id), { status: "finished" });

  // --- FUNGSI SISWA MENJAWAB SOAL ---
  const jawabSoal = async (jawabanDipilih) => {
    const isBenar = jawabanDipilih === soalAktif.jawabanBenar;
    
    setFeedback({ type: isBenar ? "BENAR" : "SALAH", text: isBenar ? "HARTA DIDAPAT! 🎉" : "SALAH JAWAB! ❌" });

    const newSoal = [...roomData.soal];
    const tIndex = newSoal.findIndex(s => s.soalIndex === soalAktif.soalIndex);

    if (isBenar) {
      const skorBaru = skor + 10;
      setSkor(skorBaru);
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
      newSoal[tIndex] = { ...newSoal[tIndex], isSelesai: true };
    } else {
      newSoal[tIndex] = { ...newSoal[tIndex], claimedBy: null };
    }
    
    await updateDoc(doc(db, "rooms", id), { soal: newSoal });

    setTimeout(() => {
      setFeedback(null);
      setSoalAktif(null);
    }, 1500); 
  };

  // --- ENGINE ANIMASI CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !roomData?.tema) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];
    const temaAktif = roomData.tema; 

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); };
    const initParticles = () => {
      particles = [];
      const w = canvas.width; const h = canvas.height;
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
      if (!particlesEnabled) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        if (temaAktif === 'galaxy') {
          if (p.type === 'star') { p.alpha += p.alphaChange; if (p.alpha <= 0 || p.alpha >= 1) p.alphaChange *= -1; ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.alpha)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
          else if (p.type === 'comet') { p.x += p.speedX; p.y += p.speedY; if (p.x > canvas.width + 100 || p.x < -100 || p.y > canvas.height + 100) { p.x = Math.random() * canvas.width; p.y = -50; } const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.speedX * 10, p.y - p.speedY * 10); gradient.addColorStop(0, `rgba(0, 243, 255, ${p.alpha})`); gradient.addColorStop(1, 'rgba(0, 243, 255, 0)'); ctx.strokeStyle = gradient; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.speedX * 10, p.y - p.speedY * 10); ctx.stroke(); }
        } else if (temaAktif === 'sky') {
          if (p.type === 'cloud') { p.x += p.speed; if (p.x > canvas.width + p.w) p.x = -p.w; ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, p.h/2); ctx.fill(); }
          else if (p.type === 'leaf') { p.y += p.speedY; p.angle += p.angleSpeed; p.x += Math.sin(p.angle) * 1; if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size/2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        } else if (temaAktif === 'ocean') {
          if (p.type === 'bubble') { p.y += p.speedY; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 0.5; if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; } ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke(); }
          else if (p.type === 'fish') { p.x += p.speedX; p.wobble += 0.05; p.y += Math.sin(p.wobble) * 0.5; if (p.x < -50) { p.x = canvas.width + 50; p.y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1; } ctx.fillStyle = `rgba(0, 0, 0, 0.15)`; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size/3, 0, 0, Math.PI*2); ctx.moveTo(p.x + p.size*0.8, p.y); ctx.lineTo(p.x + p.size*1.5, p.y - p.size/2); ctx.lineTo(p.x + p.size*1.5, p.y + p.size/2); ctx.fill(); }
        }
      });
    };

    window.addEventListener('resize', resize);
    resize();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
  }, [roomData?.tema, particlesEnabled]);

  if (!roomData) return ( <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans"><div className="animate-pulse flex flex-col items-center gap-4"><Navigation size={48} className="text-indigo-400 animate-spin" /><h2 className="font-bold text-xl tracking-widest text-indigo-200">MEMUAT ARENA...</h2></div></div> );

  const isHost = roomData.host === namaPeserta;
  const temaAktif = roomData.tema || "galaxy";

  return (
    <main className={`theme-${temaAktif} min-h-screen relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000 select-none pb-12`}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --font-main: 'Space Grotesk', sans-serif; }
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --primary-hover: #00d0ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --primary-hover: #f0716f; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --primary-hover: #00b0ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: all 0.4s ease; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover { box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none"></canvas>

      {/* ========================================================================= */}
      {/* 1. ARENA PAPAN CATUR UNTUK SISWA (SAAT STATUS "PLAYING")                  */}
      {/* ========================================================================= */}
      {roomData.status === "playing" && !isHost && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
          
          {/* Petunjuk HUD Kiri Atas */}
          <div className="absolute top-4 left-4 z-20 glass-panel p-3 border-l-4 border-l-[var(--primary)] max-w-[180px] hidden md:block">
            <h3 className="font-black flex items-center gap-1.5 text-xs text-[var(--primary)]"><Target size={16}/> Papan Catur</h3>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-1">Gunakan Keyboard atau D-Pad Layar HP.</p>
            <div className="mt-2 pt-2 border-t border-[var(--glass-border)] flex justify-between items-center">
              <span className="text-xs font-bold">Skor:</span>
              <span className="text-lg font-black text-gradient">{skor} Pts</span>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedback?.type === "WARNING" && (
            <div className="absolute top-6 bg-rose-500/90 text-white font-bold px-6 py-3 rounded-full z-50 animate-bounce shadow-2xl flex items-center gap-2 text-sm">
              <XOctagon size={18} /> {feedback.text}
            </div>
          )}

          {/* PAPAN CATUR ARENA (GRID 10x10) */}
          <div className="relative w-full max-w-[420px] aspect-square glass-panel p-0 overflow-hidden shadow-[var(--glow-shadow)] mx-auto mt-2">
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className={`border border-white/10 ${ (Math.floor(i/10) + i%10) % 2 === 0 ? 'bg-white/5' : 'bg-transparent' }`} />
              ))}
            </div>

            {/* Harta Karun */}
            {roomData.soal?.map((s) => !s.isSelesai && (
              <div key={s.soalIndex} className="absolute w-[10%] h-[10%] flex items-center justify-center transition-all duration-300" style={{ left: `${s.x * 10}%`, top: `${s.y * 10}%` }}>
                <div className={`relative ${s.claimedBy ? 'opacity-40 grayscale scale-90' : 'animate-bounce'}`}>
                  <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 rounded-full"></div>
                  <Gift size={26} className={`relative z-10 ${s.claimedBy ? 'text-gray-400' : 'text-amber-400 drop-shadow-lg'}`} />
                </div>
                {s.claimedBy && s.claimedBy !== namaPeserta && (
                  <span className="absolute -top-4 text-[8px] bg-rose-500/90 px-1 rounded text-white font-bold z-30">
                    {s.claimedBy}
                  </span>
                )}
              </div>
            ))}

            {/* Pemain */}
            {players.map((p, idx) => (
              <div key={idx} className="absolute w-[10%] h-[10%] flex items-center justify-center transition-all duration-300 z-20" style={{ left: `${p.x * 10}%`, top: `${p.y * 10}%` }}>
                <div className="relative flex flex-col items-center">
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black transition-all border ${ p.nama === namaPeserta ? "bg-[var(--primary)]/90 border-white shadow-[var(--glow-shadow)] scale-110 z-30" : "bg-white/20 border-white/50 backdrop-blur-md z-10" }`}>
                    {p.nama === namaPeserta ? <Navigation size={16} className="text-slate-900 -rotate-45" /> : <span className="text-white/80 text-xs">📦</span>}
                  </div>
                  <span className={`absolute -bottom-4 text-[8px] font-black px-1 rounded whitespace-nowrap z-40 ${p.nama === namaPeserta ? 'bg-[var(--primary)] text-slate-900' : 'bg-black/70 text-white'}`}>
                    {p.nama}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* D-PAD JOYSTICK VIRTUAL KHUSUS HP/TOUCH DEVICE */}
          <div className="mt-4 flex flex-col items-center justify-center gap-1 z-30">
            <button 
              onClick={() => gerak("UP")} 
              className="w-12 h-12 glass-panel border-[var(--primary)]/50 flex items-center justify-center active:scale-90 text-[var(--primary)] shadow-[var(--glow-shadow)] rounded-xl"
            >
              <ChevronUp size={28} />
            </button>
            <div className="flex gap-4">
              <button 
                onClick={() => gerak("LEFT")} 
                className="w-12 h-12 glass-panel border-[var(--primary)]/50 flex items-center justify-center active:scale-90 text-[var(--primary)] shadow-[var(--glow-shadow)] rounded-xl"
              >
                <ChevronLeft size={28} />
              </button>
              <button 
                onClick={() => gerak("RIGHT")} 
                className="w-12 h-12 glass-panel border-[var(--primary)]/50 flex items-center justify-center active:scale-90 text-[var(--primary)] shadow-[var(--glow-shadow)] rounded-xl"
              >
                <ChevronRight size={28} />
              </button>
            </div>
            <button 
              onClick={() => gerak("DOWN")} 
              className="w-12 h-12 glass-panel border-[var(--primary)]/50 flex items-center justify-center active:scale-90 text-[var(--primary)] shadow-[var(--glow-shadow)] rounded-xl"
            >
              <ChevronDown size={28} />
            </button>
          </div>

          {/* Modal Mengerjakan Soal Pop-up */}
          {soalAktif && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity">
              <div className="glass-panel p-6 md:p-10 w-full max-w-xl text-center relative border-[var(--primary)]/50 shadow-[var(--glow-shadow)] overflow-hidden">
                {feedback && feedback.type !== "WARNING" && (
                  <div className="absolute inset-0 glass-panel border-none rounded-2xl flex flex-col items-center justify-center z-20" style={{ background: 'var(--glass-bg)'}}>
                    {feedback.type === "BENAR" ? (
                      <><ShieldCheck size={70} className="text-emerald-400 mb-3 animate-bounce" /><h1 className="text-3xl md:text-4xl font-black text-emerald-400">{feedback.text}</h1><p className="mt-1 text-emerald-200 font-bold">+10 Poin</p></>
                    ) : (
                      <><XOctagon size={70} className="text-rose-400 mb-3 animate-pulse" /><h1 className="text-3xl md:text-4xl font-black text-rose-400">{feedback.text}</h1><p className="mt-1 text-rose-200 font-bold">Soal kembali disebar!</p></>
                    )}
                  </div>
                )}

                <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-black px-4 py-1.5 rounded-full border border-[var(--primary)]/40 tracking-widest mb-4">SOAL TERKUNCI OLEHMU</span>
                <p className="mb-6 text-lg md:text-xl font-bold leading-relaxed">{soalAktif.pertanyaan}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {soalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => jawabSoal(opsi)} className="glass-btn p-4 rounded-xl font-bold text-base hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] active:scale-95 flex items-center justify-center">
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
      {/* 2. DASHBOARD HOST & STATUS LAINNYA                                        */}
      {/* ========================================================================= */}
      {(isHost || roomData.status !== "playing") && (
        <div className="relative z-20 flex-1 flex items-center justify-center p-6 w-full">
          <div className="glass-panel p-8 md:p-10 w-full max-w-2xl text-center border-t-4 border-t-[var(--primary)] shadow-[var(--glow-shadow)]">
            
            {/* KLASEMEN AKHIR */}
            {roomData.status === "finished" && (
              <div>
                <div className="inline-block p-4 rounded-full bg-[var(--primary)]/20 mb-4 border border-[var(--primary)]/30"><Trophy size={48} className="text-[var(--primary)] drop-shadow-md" /></div>
                <h2 className="text-3xl font-black mb-6 text-gradient tracking-tight">KLASEMEN AKHIR</h2>
                <div className="glass-panel bg-black/20 p-2 max-h-80 overflow-y-auto mb-8 border-none custom-scrollbar">
                  {players.map((p, index) => (
                    <div key={index} className="flex justify-between items-center glass-btn border-white/10 p-4 mb-2 rounded-xl">
                      <div className="flex items-center gap-4"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10'}`}>{index + 1}</span><span className="font-bold text-lg">{p.nama}</span></div>
                      <span className="font-black text-[var(--primary)] text-xl">{p.skor} Pts</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/lobby")} className="w-full py-4 rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-[var(--glow-shadow)]" style={{ background: 'var(--primary)', color: temaAktif === 'sky' ? '#fff' : '#000' }}>Kembali ke Lobby</button>
              </div>
            )}

            {/* WAITING ROOM & PENGATURAN HOST */}
            {roomData.status === "waiting" && (
              <div>
                <h2 className="text-3xl font-black text-gradient mb-2">{roomData.nama_room}</h2>
                <p className="text-[var(--text-muted)] mb-8 font-medium uppercase tracking-widest text-sm">Tema Dunia: {roomData.tema}</p>
                
                {isHost ? (
                  <div className="bg-black/20 p-6 rounded-2xl border border-[var(--glass-border)] text-left mb-8 space-y-5">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                      <Settings2 size={20} className="text-[var(--primary)]"/> Pengaturan Permainan
                    </h3>
                    
                    <div>
                      <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-1.5"><Map size={14}/> Mode Permainan</label>
                      <select value={pengaturan.mode} onChange={(e) => setPengaturan({...pengaturan, mode: e.target.value})} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-[var(--primary)] outline-none cursor-pointer">
                        <option className="bg-slate-900" value="Kumpulkan Harta">Kumpulkan Harta (Papan Catur)</option>
                        <option className="bg-slate-900" value="Atlet Lari">Atlet Lari</option>
                        <option className="bg-slate-900" value="Menyebrang Sungai">Menyebrang Sungai</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-1.5"><BookOpen size={14}/> Materi Latihan</label>
                        <select value={pengaturan.materi} onChange={(e) => setPengaturan({...pengaturan, materi: e.target.value})} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-[var(--primary)] outline-none cursor-pointer">
                          <option className="bg-slate-900" value="Ciri-ciri Bangun Datar">Ciri-ciri Bangun Datar</option>
                          <option className="bg-slate-900" value="Luas Bangun Datar">Luas Bangun Datar</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-1.5"><BarChart size={14}/> Kesulitan</label>
                        <select value={pengaturan.tingkat} onChange={(e) => setPengaturan({...pengaturan, tingkat: e.target.value})} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-[var(--primary)] outline-none cursor-pointer">
                          <option className="bg-slate-900" value="Mudah">Mudah</option>
                          <option className="bg-slate-900" value="Sedang">Sedang</option>
                          <option className="bg-slate-900" value="Sulit">Sulit</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-1.5"><Hash size={14}/> Jumlah Soal Disebar</label>
                      <select value={pengaturan.jumlah} onChange={(e) => setPengaturan({...pengaturan, jumlah: e.target.value})} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-[var(--primary)] outline-none cursor-pointer">
                        <option className="bg-slate-900" value="5">5 Harta Karun</option>
                        <option className="bg-slate-900" value="10">10 Harta Karun</option>
                        <option className="bg-slate-900" value="15">15 Harta Karun</option>
                      </select>
                    </div>

                    {pengaturan.mode === "Kumpulkan Harta" ? (
                      <button onClick={mulaiGame} className="w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 mt-4 transition-transform hover:scale-105 shadow-[var(--glow-shadow)]" style={{ background: 'var(--primary)', color: temaAktif === 'sky' ? '#fff' : '#000' }}>
                        <Play fill="currentColor" size={20} /> MULAI EKSPLORASI DUNIA!
                      </button>
                    ) : (
                      <button disabled className="w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 mt-4 bg-white/10 text-gray-400 cursor-not-allowed border border-white/10">
                        <XOctagon size={20} /> Mode Ini Masih Coming Soon wkwk
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-2xl mb-8 animate-pulse">
                    <p className="text-[var(--text-main)] font-bold text-lg">Menunggu Host mengatur dan memulai permainan...</p>
                  </div>
                )}

                <div className="text-left border-t border-[var(--glass-border)] pt-6">
                  <p className="text-sm font-bold text-[var(--text-muted)] mb-4 flex items-center gap-2"><Navigation size={16}/> Pemain yang sudah bergabung:</p>
                  <div className="flex flex-wrap gap-3">
                    {players.length === 0 && <span className="text-[var(--text-muted)] text-sm italic">Belum ada siswa yang masuk...</span>}
                    {players.map((p, idx) => (
                      <span key={idx} className="glass-btn px-4 py-2 rounded-full text-sm font-bold border-[var(--primary)]/30 text-[var(--text-main)] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shadow-[var(--glow-shadow)]"></span>{p.nama}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PANTUAN LIVE GURU */}
            {roomData.status === "playing" && isHost && (
              <div>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="relative flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-[0_0_10px_red]"></span></span>
                  <h2 className="text-2xl font-black text-[var(--primary)] tracking-wide">Pantauan Live Guru</h2>
                </div>
                <div className="glass-panel bg-black/20 p-2 max-h-80 overflow-y-auto mb-8 border-none">
                  {players.map((p, index) => (
                    <div key={index} className="flex justify-between items-center glass-btn border-white/10 p-4 mb-2 rounded-xl text-left">
                      <span className="font-bold text-lg">{index + 1}. {p.nama}</span><span className="font-black text-[var(--primary)] text-xl bg-[var(--primary)]/10 px-3 py-1 rounded-lg">{p.skor} Pts</span>
                    </div>
                  ))}
                </div>
                <button onClick={akhiriGame} className="w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]"><XSquare size={20} /> Akhiri Permainan (Stop)</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}