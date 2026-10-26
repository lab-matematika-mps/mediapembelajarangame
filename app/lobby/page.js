// lab-matematika-mps/mediapembelajarangame/app/lobby/page.js
"use client";
import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Gamepad2, Plus, Users, LogOut, ArrowRight, Settings, Music, Volume2, Sparkles, X, RefreshCw } from "lucide-react";
import BackgroundCanvas from "../../components/BackgroundCanvas"; // Path disesuaikan menuju komponen

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("galaxy");
  const router = useRouter();

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

    // REAL-TIME LISTENER FIRESTORE
    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
    }, (error) => {
      console.error("Gagal memuat arena:", error);
    });

    return () => unsubscribe();
  }, [router]);

  // Simpan perubahan setting kembali ke localstorage jika ada yang diubah dari Modal Settings di halaman ini
  useEffect(() => {
    localStorage.setItem("musicEnabled", musicEnabled);
    localStorage.setItem("bgVolume", volume);
    localStorage.setItem("particlesEnabled", particlesEnabled);
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

      {/* Menggunakan Komponen Pusat (Pewaris Audio & Partikel) */}
      <BackgroundCanvas 
        tema={temaBg} 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled} 
        volume={volume} 
      />

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
