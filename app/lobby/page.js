// lab-matematika-mps/mediapembelajarangame/app/lobby/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Gamepad2, Plus, Users, LogOut, ArrowRight, Settings, Music, Volume2, Sparkles, X, RefreshCw, Navigation } from "lucide-react";
import BackgroundCanvas from "../../components/BackgroundCanvas"; // Path disesuaikan menuju komponen

// Karakter per tema (sama dengan halaman room)
const THEME_AVATARS = {
  galaxy: ["🚀", "🛸", "👽", "🪐", "☄️", "👨‍🚀", "🛰️", "👾"],
  ocean: ["🐙", "🐬", "🦈", "🐢", "🦀", "🐡", "🦑", "🐳"],
  sky: ["✈️", "🦅", "🎈", "☁️", "🕊️", "🚁", "🪁", "🌈"],
};
const THEME_LABEL = { galaxy: "Galaxy", ocean: "Samudra", sky: "Langit" };

const getIconForPlayer = (nama, tema) => {
  const icons = THEME_AVATARS[tema || "galaxy"] || THEME_AVATARS.galaxy;
  let hash = 0;
  for (let i = 0; i < (nama || "").length; i++) {
    hash = nama.charCodeAt(i) + ((hash << 5) - hash);
  }
  return icons[Math.abs(hash) % icons.length];
};

const GLOBAL_CSS = `
:root { --font-main: 'Space Grotesk', sans-serif; }
.theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --primary-hover: #00d0ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --on-primary: #05050f; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --primary-hover: #f0716f; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --on-primary: #ffffff; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --primary-hover: #00b0ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --on-primary: #00121f; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
.glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: all 0.4s ease; }
.glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); transition: all 0.3s ease; }
.glass-btn:hover { box-shadow: var(--glow-shadow); border-color: var(--primary); }
.text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.6) translateY(12px); } 70% { transform: scale(1.04); } 100% { opacity: 1; transform: scale(1); } }
.animate-popIn { animation: popIn 0.5s cubic-bezier(.22,1,.36,1) both; }
@keyframes floatY { 50% { transform: translateY(-6px); } }
.animate-floatY { animation: floatY 3s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .animate-floatY, .animate-popIn { animation: none; } }
`;

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
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
    setSettingsLoaded(true);

    // REAL-TIME LISTENER FIRESTORE
    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(roomList);
    }, (error) => {
      console.error("Gagal memuat arena:", error);
    });

    return () => unsubscribe();
  }, [router]);

  // Simpan perubahan setting kembali ke localStorage (setelah setting awal selesai dibaca)
  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("musicEnabled", musicEnabled);
    localStorage.setItem("bgVolume", volume);
    localStorage.setItem("particlesEnabled", particlesEnabled);
  }, [musicEnabled, volume, particlesEnabled, settingsLoaded]);

  const buatArenaBaru = async () => {
    const docRef = await addDoc(collection(db, "rooms"), {
      nama_room: `Arena ${Math.floor(Math.random() * 1000)}`,
      status: "waiting",
      host: namaPeserta,
      tema: temaBg,
    });
    router.push(`/room/${docRef.id}`);
  };

  const keluar = () => {
    localStorage.removeItem("nama_peserta");
    if (typeof window !== "undefined" && window.bgMusic) window.bgMusic.pause();
    router.push("/");
  };

  const myAvatar = getIconForPlayer(namaPeserta, temaBg);
  const themeEmoji = (THEME_AVATARS[temaBg] || THEME_AVATARS.galaxy)[0];

  return (
    <main className={`theme-${temaBg} h-[100dvh] relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000`}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* Menggunakan Komponen Pusat (Pewaris Audio & Partikel) */}
      <BackgroundCanvas
        tema={temaBg}
        particlesEnabled={particlesEnabled}
        musicEnabled={musicEnabled}
        volume={volume}
      />

      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        <div className="mx-auto w-full max-w-6xl min-h-full lg:h-full flex flex-col gap-3 md:gap-4 px-3 md:px-6 py-3 md:py-5 animate-fadeIn">

          {/* JUDUL */}
          <header className="shrink-0 text-center">
            <span className="inline-flex items-center gap-2 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase px-4 py-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)]">
              <Gamepad2 size={12} /> Pusat Petualang
            </span>
            <h1 className="mt-2 text-3xl md:text-5xl font-black text-gradient tracking-tight">Lobby Petualangan</h1>
            <p className="mt-1 text-[var(--text-muted)] font-medium uppercase tracking-widest text-xs md:text-sm">Tema Dunia: {THEME_LABEL[temaBg] || temaBg}</p>
          </header>

          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 md:gap-4">

            {/* ---- KIRI: profil + aksi ---- */}
            <section className="glass-panel lg:w-[380px] xl:w-[420px] shrink-0 p-4 md:p-5 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar border-t-4 border-t-[var(--primary)] shadow-[var(--glow-shadow)]">
              <h3 className="font-black text-lg flex items-center gap-2 pb-3 border-b border-[var(--glass-border)]">
                <Users size={20} className="text-[var(--primary)]" /> Profil Petualang
              </h3>

              <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--primary)]/10 py-5">
                <span className="animate-floatY inline-flex items-center justify-center w-24 h-24 rounded-full text-6xl leading-none border-2 border-[var(--primary)]/60 bg-[var(--primary)]/15 shadow-[var(--glow-shadow)]">
                  {myAvatar}
                </span>
                <p className="font-black text-xl truncate max-w-full px-4">{namaPeserta}</p>
                <p className="text-sm text-[var(--text-muted)] font-medium">Siap beraksi hari ini?</p>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <button
                  onClick={buatArenaBaru}
                  className="w-full py-4 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.03] active:scale-95 shadow-[var(--glow-shadow)]"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  <Plus size={20} /> Buka Arena (Guru)
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setIsSettingsOpen(true)} className="glass-btn px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:text-[var(--primary)] active:scale-95">
                    <Settings size={18} /> Pengaturan
                  </button>
                  <button onClick={keluar} className="glass-btn px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:border-red-500 hover:text-red-500 active:scale-95">
                    <LogOut size={18} /> Keluar
                  </button>
                </div>
              </div>
            </section>

            {/* ---- KANAN: daftar arena live ---- */}
            <section className="glass-panel flex-1 min-w-0 min-h-[320px] lg:min-h-0 p-4 md:p-5 flex flex-col gap-3 border-t-4 border-t-[var(--secondary)]">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--glass-border)]">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Navigation size={20} className="text-[var(--primary)]" /> Arena yang Terbuka
                </h3>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-full border border-[var(--primary)]/30">
                  <RefreshCw size={12} className="animate-spin" /> {rooms.length} Arena · Live
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                {rooms.length === 0 ? (
                  <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center border-2 border-dashed border-[var(--glass-border)] rounded-2xl p-6">
                    <span className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-[var(--glass-border)] text-3xl text-[var(--text-muted)] mb-3">?</span>
                    <p className="text-[var(--text-muted)] font-medium">Belum ada arena yang siap dimainkan.<br />Tunggu gurumu membuka arena baru.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 content-start">
                    {rooms.map((room) => {
                      const emoji = (THEME_AVATARS[room.tema] || THEME_AVATARS.galaxy)[0];
                      return (
                        <div key={room.id} className="animate-popIn glass-btn p-3 md:p-4 rounded-2xl flex items-center gap-3 md:gap-4 group">
                          <span className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl md:text-4xl bg-[var(--primary)]/15 border border-[var(--primary)]/40">
                            {emoji}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-lg md:text-xl text-[var(--primary)] truncate">{room.nama_room}</h4>
                            <p className="text-xs md:text-sm text-[var(--text-muted)] font-medium truncate">Host: {room.host}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Menunggu pemain
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-[var(--glass-border)] text-[var(--text-muted)]">
                                {THEME_LABEL[room.tema] || room.tema}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/room/${room.id}`)}
                            className="shrink-0 px-4 md:px-7 py-3 rounded-xl font-black flex items-center justify-center gap-2 group-hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                          >
                            JOIN <ArrowRight size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MODAL SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--glass-border)] pb-3">
              <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Pengaturan</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Music size={18} /> Suara & Musik</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={musicEnabled} onChange={() => setMusicEnabled(!musicEnabled)} />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors"></div>
                </label>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Volume2 size={18} /> Volume</span>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 accent-[var(--primary)] cursor-pointer" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2"><Sparkles size={18} /> Efek Animasi</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={particlesEnabled} onChange={() => setParticlesEnabled(!particlesEnabled)} />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors"></div>
                </label>
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-3 rounded-lg font-bold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>Simpan</button>
          </div>
        </div>
      )}
    </main>
  );
}
