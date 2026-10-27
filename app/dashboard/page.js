// lab-matematika-mps/mediapembelajarangame/app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Gamepad2, Swords, Shapes, X, LogOut, Sparkles } from "lucide-react";
import BackgroundCanvas from "../../components/BackgroundCanvas";

export default function Dashboard() {
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("galaxy");
  const [modalMateri, setModalMateri] = useState(false);
  const [modalBarak, setModalBarak] = useState(false);
  
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const router = useRouter();

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

  return (
    <main className={`theme-${temaBg} min-h-screen relative flex flex-col justify-between overflow-hidden font-sans text-[var(--text-main)] p-6 select-none`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.55); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.55); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
        .glass-btn:hover { transform: translateY(-4px) scale(1.02); box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      <BackgroundCanvas 
        tema={temaBg} 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled} 
        volume={volume} 
      />

      {/* HEADER */}
      <header className="glass-panel p-5 flex justify-between items-center max-w-4xl mx-auto w-full z-10 relative">
        <div>
          <h1 className="text-xl font-black text-gradient">Dashboard Petualangan</h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">Selamat datang, <span className="font-bold text-[var(--primary)]">{namaPeserta}</span>!</p>
        </div>
        <button onClick={() => { localStorage.removeItem("nama_peserta"); router.push("/"); }} className="glass-btn px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold hover:border-red-400 hover:text-red-400">
          <LogOut size={16} /> Keluar
        </button>
      </header>

      {/* MENU UTAMA DASHBOARD */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-auto z-10 py-8 relative">
        <div onClick={() => setModalMateri(true)} className="glass-btn p-8 rounded-3xl flex flex-col items-center text-center cursor-pointer group">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center mb-5 border border-[var(--primary)]/40 group-hover:scale-110 transition-transform">
            <BookOpen size={40} className="text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-black mb-2">Materi Pelajaran</h3>
          <p className="text-xs text-[var(--text-muted)] font-medium">Pelajari rangkuman konsep & ciri bangun datar</p>
        </div>

        <div onClick={() => router.push("/lobby")} className="glass-btn p-8 rounded-3xl flex flex-col items-center text-center cursor-pointer group border-2 border-[var(--primary)]/50 shadow-[var(--glow-shadow)]">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/30 flex items-center justify-center mb-5 border border-[var(--primary)] group-hover:scale-110 transition-transform">
            <Gamepad2 size={40} className="text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-black mb-2">Arena (Online)</h3>
          <p className="text-xs text-[var(--text-muted)] font-medium">Bertanding real-time bersama teman sekelas</p>
        </div>

        <div onClick={() => setModalBarak(true)} className="glass-btn p-8 rounded-3xl flex flex-col items-center text-center cursor-pointer group">
          <div className="w-20 h-20 rounded-2xl bg-[var(--secondary)]/20 flex items-center justify-center mb-5 border border-[var(--secondary)]/40 group-hover:scale-110 transition-transform">
            <Swords size={40} className="text-[var(--secondary)]" />
          </div>
          <h3 className="text-xl font-black mb-2">Barak (Offline)</h3>
          <p className="text-xs text-[var(--text-muted)] font-medium">Latihan duel 2 pemain dalam 1 perangkat</p>
        </div>
      </div>

      <footer className="w-full text-center py-3 bg-transparent z-10 relative">
        <p className="font-bold text-xs text-gradient">Berakhlak Mulia dan Berprestasi</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">&copy; 2026 Mugeb Primary School (SD Muhammadiyah 1 GKB)</p>
      </footer>

      {/* MODAL MATERI */}
      {modalMateri && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 relative animate-fadeIn">
            <button onClick={() => setModalMateri(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black mb-6 text-gradient flex items-center gap-2"><BookOpen size={22}/> Pilih Materi Pelajaran</h3>
            <div className="space-y-4">
              <div onClick={() => router.push("/materi")} className="glass-btn p-4 rounded-xl flex items-center gap-4 cursor-pointer border-l-4 border-l-[var(--primary)]">
                <Shapes className="text-[var(--primary)]" size={28} />
                <div className="text-left">
                  <h4 className="font-bold text-sm">Ciri-ciri Bangun Datar</h4>
                  <p className="text-xs text-[var(--text-muted)]">Sisi, sudut, dan bentuk bangun datar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BARAK (OFFLINE) */}
      {modalBarak && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 relative animate-fadeIn">
            <button onClick={() => setModalBarak(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black mb-6 text-gradient flex items-center gap-2"><Swords size={22}/> Mode Duel Offline</h3>
            <div className="space-y-4">
              <div onClick={() => router.push("/barak/tug-of-war")} className="glass-btn p-4 rounded-xl flex items-center gap-4 cursor-pointer border-l-4 border-l-[var(--primary)]">
                <Swords className="text-[var(--primary)]" size={28} />
                <div className="text-left"><h4 className="font-bold text-sm">Tarik Tambang Matematika</h4><p className="text-xs text-[var(--text-muted)]">2 Player 1 Layar - Cepat & Tepat</p></div>
              </div>
              <div className="glass-btn p-4 rounded-xl flex items-center gap-4 opacity-50 cursor-not-allowed">
                <Sparkles className="text-gray-400" size={28} />
                <div className="text-left"><h4 className="font-bold text-sm">Alien Invasion</h4><p className="text-xs text-rose-400 font-bold">Coming Soon</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
