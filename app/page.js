// lab-matematika-mps/mediapembelajarangame/app/page.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sun, Waves, Settings, X, Music, Volume2, Sparkles, User, Calculator } from "lucide-react";
import BackgroundCanvas from "../components/BackgroundCanvas";

export default function Login() {
  const [nama, setNama] = useState("");
  const [tema, setTema] = useState("galaxy");
  const router = useRouter();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const masukDashboard = () => {
    if (!nama.trim()) return alert("Halo! Silakan masukkan nama kamu terlebih dahulu!");
    localStorage.setItem("nama_peserta", nama);
    localStorage.setItem("tema_bg", tema);
    router.push("/dashboard");
  };

  // Fungsi untuk mengganti tema sekaligus memutar SFX khususnya
  const gantiTema = (newTema) => {
    setTema(newTema);
    if (musicEnabled) {
      const sfx = new Audio(`/sfx-${newTema}.mp3`);
      sfx.volume = volume;
      sfx.play().catch(() => {});
    }
  };

  return (
    <main className={`theme-${tema} h-screen flex flex-col justify-between relative overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000 select-none`}>
      <style dangerouslySetInnerHTML={{
        __html: `
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

      {/* Komponen Canvas Animasi */}
      <BackgroundCanvas 
        tema={tema} 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled} 
        volume={volume} 
      />

      {/* SETTINGS BUTTON */}
      <div className="fixed top-4 right-4 z-50">
        <button onClick={() => setIsSettingsOpen(true)} className="glass-btn p-2.5 rounded-full flex items-center justify-center w-11 h-11">
          <Settings size={20} className="text-[var(--primary)]" />
        </button>
      </div>

      {/* MAIN CONTAINER */}
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

          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3 font-semibold">Pilih Dunia Petualangan</p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div onClick={() => gantiTema('galaxy')} className={`theme-card glass-btn p-3 rounded-xl flex flex-col items-center gap-1 ${tema === 'galaxy' ? 'active' : ''}`}>
                <Rocket size={24} className={tema === 'galaxy' ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                <span className="font-bold text-xs">Galaksi</span>
              </div>
              <div onClick={() => gantiTema('sky')} className={`theme-card glass-btn p-3 rounded-xl flex flex-col items-center gap-1 ${tema === 'sky' ? 'active' : ''}`}>
                <Sun size={24} className={tema === 'sky' ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                <span className="font-bold text-xs">Langit</span>
              </div>
              <div onClick={() => gantiTema('ocean')} className={`theme-card glass-btn p-3 rounded-xl flex flex-col items-center gap-1 ${tema === 'ocean' ? 'active' : ''}`}>
                <Waves size={24} className={tema === 'ocean' ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                <span className="font-bold text-xs">Samudra</span>
              </div>
            </div>
          </div>

          <button 
            onClick={masukDashboard} 
            className="w-full max-w-xs py-3.5 rounded-full text-base flex items-center justify-center gap-2 mx-auto font-black border-none transition-transform hover:scale-105 shadow-[var(--glow-shadow)]"
            style={{ background: 'var(--primary)', color: tema === 'sky' ? '#fff' : '#000' }}
          >
            <Rocket size={20} /> Mulai Petualangan
          </button>
        </div>
      </div>

      <footer className="w-full text-center py-3 bg-transparent z-20">
        <div className="container mx-auto">
          <p className="font-bold text-xs md:text-sm text-gradient">Berakhlak Mulia dan Berprestasi</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">&copy; 2026 Mugeb Primary School (SD Muhammadiyah 1 GKB)</p>
        </div>
      </footer>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="glass-panel w-11/12 max-w-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={18}/> Pengaturan</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Music size={16}/> Musik & Suara</span>
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
