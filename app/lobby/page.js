"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Gamepad2, Plus, Users, LogOut, ArrowRight, Settings, Music, Volume2, Sparkles, X, RefreshCw } from "lucide-react";

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("galaxy");
  const router = useRouter();
  const canvasRef = useRef(null);

  // --- STATE SETTINGS ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  // --- CEK LOGIN & REAL-TIME LISTENER ARENA ---
  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    const tema = localStorage.getItem("tema_bg") || "galaxy";
    if (!nama) return router.push("/");
    setNamaPeserta(nama);
    setTemaBg(tema);

    // Ambil settingan dari localStorage
    setMusicEnabled(localStorage.getItem("musicEnabled") === "true");
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
    const savedVol = localStorage.getItem("bgVolume");
    if (savedVol) setVolume(parseFloat(savedVol));

    // REAL-TIME LISTENER FIRESTORE (Akan selalu update otomatis kapan pun user buka halaman)
    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
    }, (error) => {
      console.error("Gagal memuat arena:", error);
    });

    return () => unsubscribe();
  }, [router]);

  // --- LANJUTKAN GLOBAL AUDIO ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.bgMusic) {
      window.bgMusic.volume = volume;
      if (musicEnabled) {
        window.bgMusic.play().catch(() => {});
      } else {
        window.bgMusic.pause();
      }
      localStorage.setItem("musicEnabled", musicEnabled);
      localStorage.setItem("bgVolume", volume);
      localStorage.setItem("particlesEnabled", particlesEnabled);
    }
  }, [musicEnabled, volume, particlesEnabled]);

  const buatArenaBaru = async () => {
    const docRef = await addDoc(collection(db, "rooms"), { 
      nama_room: `Arena ${Math.floor(Math.random() * 1000)}`, 
      status: "waiting", 
      host: namaPeserta, 
      tema: temaBg 
    });
    router.push(`/room/${docRef.id}`);
  };

  const keluar = () => {
    localStorage.removeItem("nama_peserta");
    if (typeof window !== "undefined" && window.bgMusic) window.bgMusic.pause();
    router.push("/");
  };

  // --- ENGINE ANIMASI CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); };
    const initParticles = () => {
      particles = [];
      const w = canvas.width; const h = canvas.height;
      if (temaBg === 'galaxy') {
        for (let i = 0; i < 150; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5, alpha: Math.random(), alphaChange: (Math.random() * 0.02) - 0.01, type: 'star' });
        for (let i = 0; i < 3; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, length: Math.random() * 80 + 20, speedX: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1), speedY: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.1, type: 'comet' });
      } else if (temaBg === 'sky') {
        for (let i = 0; i < 5; i++) particles.push({ x: Math.random() * w, y: Math.random() * (h/2), w: Math.random() * 200 + 100, h: Math.random() * 40 + 20, speed: Math.random() * 0.5 + 0.1, alpha: Math.random() * 0.2 + 0.1, type: 'cloud' });
        for (let i = 0; i < 30; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 6 + 3, speedY: Math.random() * 1 + 0.5, angle: Math.random() * Math.PI * 2, angleSpeed: (Math.random() * 0.05) - 0.025, color: Math.random() > 0.5 ? '#ffb347' : '#ffcc33', type: 'leaf' });
      } else if (temaBg === 'ocean') {
        for (let i = 0; i < 80; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 4 + 1, speedY: -(Math.random() * 2 + 0.5), wobble: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 0.05, type: 'bubble' });
        for (let i = 0; i < 5; i++) particles.push({ x: Math.random() * w, y: Math.random() * h * 0.8 + h * 0.1, size: Math.random() * 20 + 10, speedX: -(Math.random() * 1.5 + 0.5), wobble: Math.random() * Math.PI * 2, type: 'fish' });
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!particlesEnabled) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        if (temaBg === 'galaxy') {
          if (p.type === 'star') { p.alpha += p.alphaChange; if (p.alpha <= 0 || p.alpha >= 1) p.alphaChange *= -1; ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.alpha)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
          else if (p.type === 'comet') { p.x += p.speedX; p.y += p.speedY; if (p.x > canvas.width + 100 || p.x < -100 || p.y > canvas.height + 100) { p.x = Math.random() * canvas.width; p.y = -50; } const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.speedX * 10, p.y - p.speedY * 10); gradient.addColorStop(0, `rgba(0, 243, 255, ${p.alpha})`); gradient.addColorStop(1, 'rgba(0, 243, 255, 0)'); ctx.strokeStyle = gradient; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.speedX * 10, p.y - p.speedY * 10); ctx.stroke(); }
        } else if (temaBg === 'sky') {
          if (p.type === 'cloud') { p.x += p.speed; if (p.x > canvas.width + p.w) p.x = -p.w; ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, p.h/2); ctx.fill(); }
          else if (p.type === 'leaf') { p.y += p.speedY; p.angle += p.angleSpeed; p.x += Math.sin(p.angle) * 1; if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size/2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        } else if (temaBg === 'ocean') {
          if (p.type === 'bubble') { p.y += p.speedY; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 0.5; if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; } ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke(); }
          else if (p.type === 'fish') { p.x += p.speedX; p.wobble += 0.05; p.y += Math.sin(p.wobble) * 0.5; if (p.x < -50) { p.x = canvas.width + 50; p.y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1; } ctx.fillStyle = `rgba(0, 0, 0, 0.15)`; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size/3, 0, 0, Math.PI*2); ctx.moveTo(p.x + p.size*0.8, p.y); ctx.lineTo(p.x + p.size*1.5, p.y - p.size/2); ctx.lineTo(p.x + p.size*1.5, p.y + p.size/2); ctx.fill(); }
        }
      });
    };

    window.addEventListener('resize', resize);
    resize();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
  }, [temaBg, particlesEnabled]);

  return (
    <main className={`theme-${temaBg} min-h-screen relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000`}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --font-main: 'Space Grotesk', sans-serif; }
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --primary-hover: #00d0ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --primary-hover: #f0716f; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --primary-hover: #00b0ff; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: all 0.4s ease; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--primary-hover)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none"></canvas>

      <div className="max-w-4xl mx-auto w-full p-6 relative z-10 flex-1 flex flex-col gap-6">
        
        {/* HEADER */}
        <header className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/20 flex items-center justify-center border border-[var(--primary)]/30">
              <Gamepad2 size={28} className="text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-gradient">Lobby Petualangan</h1>
              <p className="text-[var(--text-muted)] font-medium">Siap beraksi, <span className="font-bold text-[var(--primary)]">{namaPeserta}</span>?</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto flex-wrap md:flex-nowrap justify-center">
            <button onClick={() => setIsSettingsOpen(true)} className="glass-btn px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-sm hover:border-[var(--primary)] hover:text-[var(--primary)]">
              <Settings size={18} /> Pengaturan
            </button>

            <button onClick={keluar} className="glass-btn px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-sm hover:border-red-500 hover:text-red-500">
              <LogOut size={18} /> Keluar
            </button>
            <button onClick={buatArenaBaru} className="px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform" style={{ background: 'var(--primary)', color: temaBg === 'sky' ? '#fff' : '#000' }}>
              <Plus size={18} /> Buka Arena (Guru)
            </button>
          </div>
        </header>

        {/* DAFTAR ROOM LIVE */}
        <div className="glass-panel p-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-[var(--primary)]" />
              <h2 className="text-xl font-black">Arena yang Terbuka (Siswa)</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-full border border-[var(--primary)]/30">
              <RefreshCw size={12} className="animate-spin" /> Live Updates
            </span>
          </div>

          {rooms.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[var(--glass-border)] rounded-2xl bg-white/5">
              <div className="inline-block p-4 rounded-full bg-[var(--primary)]/10 mb-3">
                <Gamepad2 size={32} className="text-[var(--primary)] opacity-50" />
              </div>
              <p className="text-[var(--text-muted)] font-medium">Belum ada arena yang siap dimainkan.<br/>Tunggu gurumu membuka arena baru.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="glass-btn p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 group">
                  <div className="text-center md:text-left w-full md:w-auto">
                    <h3 className="font-black text-xl text-[var(--primary)]">{room.nama_room}</h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Host: {room.host}</p>
                  </div>
                  <button onClick={() => router.push(`/room/${room.id}`)} className="w-full md:w-auto px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)]" style={{ background: 'var(--primary)', color: temaBg === 'sky' ? '#fff' : '#000' }}>
                    JOIN <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity">
          <div className="glass-panel w-11/12 max-w-sm p-6 transform scale-100 transition-transform">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
              <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20}/> Pengaturan</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Music size={18}/> Suara & Musik</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={musicEnabled} onChange={() => setMusicEnabled(!musicEnabled)} />
                  <div className={`w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${musicEnabled ? 'bg-[var(--primary)]' : ''}`}></div>
                </label>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Volume2 size={18}/> Volume</span>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-24 accent-[var(--primary)] cursor-pointer" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Sparkles size={18}/> Efek Animasi</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={particlesEnabled} onChange={() => setParticlesEnabled(!particlesEnabled)} />
                  <div className={`w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${particlesEnabled ? 'bg-[var(--primary)]' : ''}`}></div>
                </label>
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-3 rounded-lg font-bold text-black" style={{ background: 'var(--primary)' }}>Simpan</button>
          </div>
        </div>
      )}
    </main>
  );
}