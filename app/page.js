// lab-matematika-mps/mediapembelajarangame/app/page.js
"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sun, Waves, Settings, X, Music, Volume2, Sparkles, User, Calculator } from "lucide-react";

export default function Login() {
  const [nama, setNama] = useState("");
  const [tema, setTema] = useState("galaxy");
  const router = useRouter();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const canvasRef = useRef(null);

  const masukDashboard = () => {
    if (!nama.trim()) return alert("Halo! Silakan masukkan nama kamu terlebih dahulu!");
    localStorage.setItem("nama_peserta", nama);
    localStorage.setItem("tema_bg", tema);
    router.push("/dashboard");
  };

  // --- ENGINE CANVAS TEMA ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;

      if (tema === 'galaxy') {
        for (let i = 0; i < 150; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5, alpha: Math.random(), alphaChange: (Math.random() * 0.02) - 0.01, type: 'star' });
        }
        for (let i = 0; i < 3; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, length: Math.random() * 80 + 20, speedX: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1), speedY: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.1, type: 'comet' });
        }
      } else if (tema === 'sky') {
        for (let i = 0; i < 5; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * (h / 2), w: Math.random() * 200 + 100, h: Math.random() * 40 + 20, speed: Math.random() * 0.5 + 0.1, alpha: Math.random() * 0.2 + 0.1, type: 'cloud' });
        }
        for (let i = 0; i < 30; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 6 + 3, speedY: Math.random() * 1 + 0.5, angle: Math.random() * Math.PI * 2, angleSpeed: (Math.random() * 0.05) - 0.025, color: Math.random() > 0.5 ? '#ffb347' : '#ffcc33', type: 'leaf' });
        }
      } else if (tema === 'ocean') {
        for (let i = 0; i < 80; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 4 + 1, speedY: -(Math.random() * 2 + 0.5), wobble: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 0.05, type: 'bubble' });
        }
        for (let i = 0; i < 5; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h * 0.8 + h * 0.1, size: Math.random() * 20 + 10, speedX: -(Math.random() * 1.5 + 0.5), wobble: Math.random() * Math.PI * 2, type: 'fish' });
        }
      }
    };

    const drawGalaxy = (p, w, h) => {
      if (p.type === 'star') {
        p.alpha += p.alphaChange;
        if (p.alpha <= 0 || p.alpha >= 1) p.alphaChange *= -1;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.alpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'comet') {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x > w + 100 || p.x < -100 || p.y > h + 100) { p.x = Math.random() * w; p.y = -50; }
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.speedX * 10, p.y - p.speedY * 10);
        gradient.addColorStop(0, `rgba(0, 243, 255, ${p.alpha})`);
        gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.speedX * 10, p.y - p.speedY * 10);
        ctx.stroke();
      }
    };

    const drawSky = (p, w, h) => {
      if (p.type === 'cloud') {
        p.x += p.speed;
        if (p.x > w + p.w) p.x = -p.w;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, p.h / 2);
        ctx.fill();
      } else if (p.type === 'leaf') {
        p.y += p.speedY; p.angle += p.angleSpeed; p.x += Math.sin(p.angle) * 1;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawOcean = (p, w, h) => {
      if (p.type === 'bubble') {
        p.y += p.speedY; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 0.5;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'fish') {
        p.x += p.speedX; p.wobble += 0.05; p.y += Math.sin(p.wobble) * 0.5;
        if (p.x < -50) { p.x = w + 50; p.y = Math.random() * h * 0.8 + h * 0.1; }
        ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size / 3, 0, 0, Math.PI * 2);
        ctx.moveTo(p.x + p.size * 0.8, p.y);
        ctx.lineTo(p.x + p.size * 1.5, p.y - p.size / 2);
        ctx.lineTo(p.x + p.size * 1.5, p.y + p.size / 2);
        ctx.fill();
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!particlesEnabled) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        if (tema === 'galaxy') drawGalaxy(p, canvas.width, canvas.height);
        else if (tema === 'sky') drawSky(p, canvas.width, canvas.height);
        else if (tema === 'ocean') drawOcean(p, canvas.width, canvas.height);
      });
    };

    window.addEventListener('resize', resize);
    resize();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [tema, particlesEnabled]);

  return (
    <main className={`theme-${tema} h-screen flex flex-col justify-between relative overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000 select-none`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root { --font-main: 'Space Grotesk', sans-serif; }
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.45); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.55); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.45); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.25rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .theme-card { cursor: pointer; border: 2px solid transparent; }
        .theme-card.active { border-color: var(--primary); box-shadow: var(--glow-shadow); transform: scale(1.03); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none"></canvas>

      {/* SETTINGS BUTTON */}
      <div className="fixed top-4 right-4 z-50">
        <button onClick={() => setIsSettingsOpen(true)} className="glass-btn p-2.5 rounded-full flex items-center justify-center w-11 h-11">
          <Settings size={20} className="text-[var(--primary)]" />
        </button>
      </div>

      {/* MAIN CONTAINER (COMPACT & FIT SCREEN) */}
      <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 z-10 py-4">
        <div className="glass-panel p-6 md:p-8 w-full max-w-xl text-center space-y-6">
          
          <div>
            <div className="inline-block p-3 rounded-full bg-white/5 mb-2 border border-white/10">
              <Calculator size={36} className="text-[var(--primary)]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Mugeb <span className="text-gradient">Math Quest</span>
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">
              Petualangan Belajar Matematika yang Seru & Interaktif!
            </p>
          </div>

          {/* INPUT NAMA */}
          <div className="w-full max-w-sm mx-auto">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && masukDashboard()}
                className="w-full py-3 pl-11 pr-4 rounded-xl text-base text-center font-medium bg-white/5 border border-[var(--glass-border)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all" 
                placeholder="Masukkan nama petualang..." 
                autoComplete="off" 
              />
            </div>
          </div>

          {/* TEMA SELECTION */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3 font-semibold">Pilih Dunia Petualangan</p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div onClick={() => setTema('galaxy')} className={`theme-card glass-btn p-3 rounded-xl flex flex-col items-center gap-1 ${tema === 'galaxy' ? 'active' : ''}`}>
                <Rocket size={24} className={tema === 'galaxy' ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                <span className="font-bold text-xs">Galaksi</span>
              </div>
              <div onClick={() => setTema('sky')} className={`theme-card glass-btn p-3 rounded-xl flex flex-col items-center gap-1 ${tema === 'sky' ? 'active' : ''}`}>
                <Sun size={24} className={tema === 'sky' ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                <span className="font-bold text-xs">Langit</span>
              </div>
              <div onClick={() => setTema('ocean')} className={`theme-card glass-btn p-3 rounded-xl flex flex-col items-center gap-1 ${tema === 'ocean' ? 'active' : ''}`}>
                <Waves size={24} className={tema === 'ocean' ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                <span className="font-bold text-xs">Samudra</span>
              </div>
            </div>
          </div>

          {/* START BUTTON */}
          <button 
            onClick={masukDashboard} 
            className="w-full max-w-xs py-3.5 rounded-full text-base flex items-center justify-center gap-2 mx-auto font-black border-none transition-transform hover:scale-105 shadow-[var(--glow-shadow)]"
            style={{ background: 'var(--primary)', color: tema === 'sky' ? '#fff' : '#000' }}
          >
            <Rocket size={20} /> Mulai Petualangan
          </button>
        </div>
      </div>

      {/* FOOTER TRANSPARAN TANPA GLASS EFFECT */}
      <footer className="w-full text-center py-3 bg-transparent z-20">
        <div className="container mx-auto">
          <p className="font-bold text-xs md:text-sm text-gradient">Berakhlak Mulia dan Berprestasi</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">&copy; 2026 Mugeb Primary School (SD Muhammadiyah 1 GKB)</p>
        </div>
      </footer>

      {/* MODAL SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="glass-panel w-11/12 max-w-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={18}/> Pengaturan</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Music size={16}/> Musik</span>
                <input type="checkbox" checked={musicEnabled} onChange={() => setMusicEnabled(!musicEnabled)} className="accent-[var(--primary)] cursor-pointer" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Volume2 size={16}/> Volume</span>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-24 accent-[var(--primary)] cursor-pointer" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Sparkles size={16}/> Efek Animasi</span>
                <input type="checkbox" checked={particlesEnabled} onChange={() => setParticlesEnabled(!particlesEnabled)} className="accent-[var(--primary)] cursor-pointer" />
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-6 py-2.5 rounded-lg font-bold text-black text-sm" style={{ background: 'var(--primary)' }}>Simpan</button>
          </div>
        </div>
      )}
    </main>
  );
}
