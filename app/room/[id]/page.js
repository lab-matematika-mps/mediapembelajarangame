// lab-matematika-mps/mediapembelajarangame/app/room/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// PERHATIKAN: getDocs sudah aku masukkan kembali ke sini
import { doc, onSnapshot, updateDoc, setDoc, deleteDoc, collection, query, orderBy, getDoc, getDocs, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { Trophy, Play, XSquare, Navigation, Gift, ShieldCheck, XOctagon, Settings2, BookOpen, BarChart, Hash, Map, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Timer, Flag, Cat, Dog, Rabbit, Bird, AlertTriangle } from "lucide-react";
import BackgroundCanvas from "../../../components/BackgroundCanvas";

const GRID_SIZE = 10;
const ANIMAL_ICONS = [Cat, Dog, Rabbit, Bird];

const THEME_ICONS = {
  galaxy: ["🚀", "🛸", "👽", "🪐", "☄️", "👨‍🚀", "🛰️", "👾"],
  ocean: ["🐙", "🐬", "🦈", "🐢", "🦀", "🐡", "🦑", "🐳"],
  sky: ["✈️", "🦅", "🎈", "☁️", "🕊️", "🚁", "🪁", "🌈"]
};

const getIconForPlayer = (namaPemain, tema) => {
  const icons = THEME_ICONS[tema || "galaxy"] || THEME_ICONS["galaxy"];
  let hash = 0;
  for (let i = 0; i < namaPemain.length; i++) {
    hash = namaPemain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return icons[Math.abs(hash) % icons.length];
};

export default function Room() {
  const { id } = useParams();
  const router = useRouter();
  
  const [roomData, setRoomData] = useState(null);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [players, setPlayers] = useState([]);
  
  const [posisi, setPosisi] = useState({ x: 0, y: 0 });
  const [soalAktif, setSoalAktif] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [atletView, setAtletView] = useState("SOAL");
  const [localSoalIndex, setLocalSoalIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const [pengaturan, setPengaturan] = useState({ mode: "Kumpulkan Harta", materi: "Ciri-ciri Bangun Datar", tingkat: "Mudah", jumlah: 5 });

  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // --- STATE AFK (AUTO CLOSE) ---
  const [idleLimit, setIdleLimit] = useState(60000); // Default awal 60 detik (1 menit)
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(10);

  const activePlayers = players.filter(p => p.nama !== roomData?.host);
  const mySkor = activePlayers.find(p => p.nama === namaPeserta)?.skor || 0;

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);
    
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
    setMusicEnabled(localStorage.getItem("musicEnabled") === "true");
    const savedVol = localStorage.getItem("bgVolume");
    if (savedVol) setVolume(parseFloat(savedVol));

    const roomRef = doc(db, "rooms", id);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      } else {
        router.push("/dashboard");
      }
    });

    const unsubPlayers = onSnapshot(query(collection(db, `rooms/${id}/players`), orderBy("skor", "desc")), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => doc.data()));
    });

    return () => { unsubRoom(); unsubPlayers(); };
  }, [id, router]);

  useEffect(() => {
    if (!roomData?.host || !namaPeserta) return;
    if (roomData.host !== namaPeserta) {
      const initPlayer = async () => {
        const playerRef = doc(db, `rooms/${id}/players`, namaPeserta);
        const pSnap = await getDoc(playerRef);
        
        if (!pSnap.exists()) {
          let startX, startY;
          let isSafe = false;
          while (!isSafe) {
            startX = Math.floor(Math.random() * GRID_SIZE);
            startY = Math.floor(Math.random() * GRID_SIZE);
            if (roomData.soal) {
              const onTreasure = roomData.soal.some(s => s.x === startX && s.y === startY);
              isSafe = !onTreasure;
            } else {
              isSafe = true; 
            }
          }
          await setDoc(playerRef, { nama: namaPeserta, skor: 0, x: startX, y: startY });
          setPosisi({ x: startX, y: startY });
        } else {
          const data = pSnap.data();
          setPosisi({ x: data.x, y: data.y });
        }
      };
      initPlayer();
    }
  }, [roomData?.host, namaPeserta, id]); 

  const isHost = roomData?.host === namaPeserta;
  const myRank = activePlayers.findIndex(p => p.nama === namaPeserta) + 1;

  // --- LOGIK PERINGATAN AFK ---
  useEffect(() => {
    if (!roomData) return;
    let warningTimer;
    // Timer AFK hanya berjalan ketika menunggu di lobby atau sesudah game selesai
    if (roomData.status === "waiting" || roomData.status === "finished") {
      warningTimer = setTimeout(() => {
        setShowIdleWarning(true);
        setIdleCountdown(10);
      }, idleLimit);
    }
    return () => { if (warningTimer) clearTimeout(warningTimer); };
  }, [roomData?.status, idleLimit]);

  // Efek Countdown saat Peringatan AFK muncul
  useEffect(() => {
    let interval;
    if (showIdleWarning && idleCountdown > 0) {
      interval = setInterval(() => {
        setIdleCountdown(prev => prev - 1);
      }, 1000);
    } else if (showIdleWarning && idleCountdown === 0) {
      const tutupRoom = async () => {
        if (isHost) {
          try { await deleteDoc(doc(db, "rooms", id)); } catch (e) {}
        }
        alert("Room ditutup karena tidak ada aktivitas.");
        router.push("/lobby");
      };
      tutupRoom();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [showIdleWarning, idleCountdown, isHost, id, router]);

  const tambahWaktuAFK = () => {
    setShowIdleWarning(false);
    setIdleLimit(300000); // Memperpanjang jadi 5 menit (300.000 ms)
  };

  useEffect(() => {
    if (!roomData || roomData.status !== "playing" || !roomData.startedAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roomData.startedAt) / 1000);
      setTimeElapsed(elapsed);
      if (isHost) {
        const gameTime = elapsed - 4;
        const maxSkor = parseInt(roomData.pengaturan.jumlah) * 10;
        if (gameTime >= 300) akhiriGame("WAKTU HABIS (5 Menit)!");
        else if (roomData.pengaturan.mode === "Kumpulkan Harta" && roomData.soal && roomData.soal.every(s => s.isSelesai)) akhiriGame("SEMUA HARTA DITEMUKAN!");
        else if (roomData.pengaturan.mode === "Atlet Lari" && activePlayers.some(p => p.skor >= maxSkor)) akhiriGame("BALAPAN SELESAI, ADA PEMENANG!");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [roomData, isHost, activePlayers]);

  const gerak = async (arah) => {
    if (soalAktif || !roomData || roomData.status !== "playing" || timeElapsed < 4 || isHost) return;
    let newX = posisi.x; let newY = posisi.y;

    if (arah === "UP") newY = Math.max(0, newY - 1);
    if (arah === "DOWN") newY = Math.min(GRID_SIZE - 1, newY + 1);
    if (arah === "LEFT") newX = Math.max(0, newX - 1);
    if (arah === "RIGHT") newX = Math.min(GRID_SIZE - 1, newX + 1);

    if (newX !== posisi.x || newY !== posisi.y) {
      setPosisi({ x: newX, y: newY });
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { x: newX, y: newY });
      const currentTreasure = roomData.soal?.find(s => s.x === newX && s.y === newY && !s.isSelesai);
      if (currentTreasure) {
        if (currentTreasure.claimedBy === null || currentTreasure.claimedBy === namaPeserta) {
          setSoalAktif(currentTreasure);
          if (currentTreasure.claimedBy === null) {
            const newSoal = [...roomData.soal];
            newSoal[newSoal.findIndex(s => s.soalIndex === currentTreasure.soalIndex)].claimedBy = namaPeserta;
            updateDoc(doc(db, "rooms", id), { soal: newSoal });
          }
        } else {
          setFeedback({ type: "WARNING", text: `Sedang dikerjakan ${currentTreasure.claimedBy}!` });
          setTimeout(() => setFeedback(null), 2000);
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if(isHost || roomData?.pengaturan?.mode !== "Kumpulkan Harta") return;
      if (e.key === "ArrowUp" || e.key === "w") gerak("UP");
      if (e.key === "ArrowDown" || e.key === "s") gerak("DOWN");
      if (e.key === "ArrowLeft" || e.key === "a") gerak("LEFT");
      if (e.key === "ArrowRight" || e.key === "d") gerak("RIGHT");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posisi, soalAktif, roomData, id, namaPeserta, isHost, timeElapsed]);

  const mulaiGame = async () => {
    try {
      const q = query(collection(db, "daftar_soal"), where("materi", "==", pengaturan.materi), where("tingkat", "==", pengaturan.tingkat));
      const snapshot = await getDocs(q);
      let allSoal = snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort(() => 0.5 - Math.random()).slice(0, parseInt(pengaturan.jumlah));
      if(allSoal.length === 0) return alert("Soal tidak ditemukan untuk materi & tingkat ini!");

      const usedCoords = new Set();
      activePlayers.forEach(p => usedCoords.add(`${p.x},${p.y}`)); 

      const soalWithData = allSoal.map((soal, index) => {
        let rx, ry;
        do { rx = Math.floor(Math.random() * GRID_SIZE); ry = Math.floor(Math.random() * GRID_SIZE); } while(usedCoords.has(`${rx},${ry}`));
        usedCoords.add(`${rx},${ry}`);
        return { ...soal, soalIndex: index, x: rx, y: ry, claimedBy: null, isSelesai: false };
      });

      await updateDoc(doc(db, "rooms", id), { 
        status: "playing", startedAt: Date.now(), alasanAkhir: null, pengaturan: pengaturan, soal: soalWithData 
      });
    } catch (error) { alert("Gagal: " + error.message); }
  };

  const akhiriGame = async (alasan = "Dihentikan oleh Host") => {
    await updateDoc(doc(db, "rooms", id), { status: "finished", alasanAkhir: alasan });
  };

  const jawabSoalHarta = async (jawabanDipilih) => {
    const isBenar = jawabanDipilih === soalAktif.jawabanBenar;
    setFeedback({ type: isBenar ? "BENAR" : "SALAH", text: isBenar ? "HARTA DIDAPAT! 🎉" : "SALAH JAWAB! ❌" });

    const newSoal = [...roomData.soal];
    const tIndex = newSoal.findIndex(s => s.soalIndex === soalAktif.soalIndex);
    if (isBenar) {
      const skorBaru = mySkor + 10;
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
      newSoal[tIndex].isSelesai = true;
    } else {
      newSoal[tIndex].claimedBy = null;
    }
    
    await updateDoc(doc(db, "rooms", id), { soal: newSoal });
    setTimeout(() => { setFeedback(null); setSoalAktif(null); }, 1500); 
  };

  const jawabSoalAtlet = async (jawaban) => {
    const isBenar = jawaban === roomData.soal[localSoalIndex % roomData.soal.length]?.jawabanBenar;
    setFeedback({ type: isBenar ? "BENAR" : "SALAH", text: isBenar ? "LARI 1 LANGKAH! 🏃‍♂️💨" : "TETAP DI TEMPAT! ❌" });
    if (isBenar) {
      const skorBaru = mySkor + 10;
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
    }
    setAtletView("TRACK");
    setTimeout(() => {
      setFeedback(null);
      setLocalSoalIndex(prev => prev + 1);
      setAtletView("SOAL");
    }, 2500);
  };

  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  const TrackComponent = ({ pPlayers, pPengaturan }) => (
    <div className="w-full h-full min-h-[300px] flex flex-col justify-center gap-4 p-4 md:p-6 glass-panel border border-[var(--primary)]/50 shadow-[var(--glow-shadow)] rounded-3xl animate-fadeIn relative overflow-hidden">
      <div className="text-center mb-2 z-10">
        <h3 className="text-sm md:text-base font-black text-[var(--primary)] uppercase tracking-widest flex items-center justify-center gap-2">
          <Flag size={18}/> Sirkuit Balapan Matematika <Flag size={18}/>
        </h3>
      </div>
      <div className="space-y-4 md:space-y-6 z-10 w-full">
        {pPlayers.slice(0, 4).map((p, i) => {
          const target = parseInt(pPengaturan.jumlah) * 10;
          const progress = Math.min((p.skor / target) * 100, 100);
          const IconComp = ANIMAL_ICONS[i % ANIMAL_ICONS.length];
          return (
            <div key={i} className="relative bg-black/40 border border-white/10 rounded-full h-14 md:h-16 flex items-center shadow-inner overflow-hidden">
              <div className="absolute inset-x-2 h-1.5 md:h-2 bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-emerald-500/60 rounded-full"></div>
              <div className="absolute right-3 font-black text-xl md:text-2xl z-0 opacity-80">🏁</div>
              <div className="absolute flex items-center gap-2 transition-all duration-1000 ease-out z-10" style={{ left: `calc(${Math.max(2, progress)}% - 10px)` }}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--primary)]/20 border-2 border-[var(--primary)] flex items-center justify-center text-[var(--primary)] shadow-[var(--glow-shadow)] backdrop-blur-md">
                  <IconComp size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs bg-slate-900/90 text-white font-black px-2 md:px-3 py-1 rounded-md border border-white/20 whitespace-nowrap shadow-xl">{p.nama} ({p.skor} Pts)</span>
              </div>
            </div>
          )
        })}
        {pPlayers.length === 0 && <div className="text-center w-full py-10 text-white/50 font-bold italic">Menunggu pembalap masuk lintasan...</div>}
      </div>
    </div>
  );

  const MiniMapKumpulkanHarta = ({ rData, rPlayers }) => (
    <div className="relative w-full max-w-[320px] md:max-w-[400px] aspect-square bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-inner mx-auto">
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
        {Array.from({ length: 100 }).map((_, i) => (<div key={i} className={`border border-white/5 ${ (Math.floor(i/10) + i%10) % 2 === 0 ? 'bg-white/5' : 'bg-transparent' }`} />))}
      </div>
      {rData.soal?.map((s) => !s.isSelesai && (
        <div key={s.soalIndex} className="absolute w-[10%] h-[10%] flex items-center justify-center" style={{ left: `${s.x * 10}%`, top: `${s.y * 10}%` }}>
          <Gift size={18} className={`relative z-10 ${s.claimedBy ? 'text-gray-500' : 'text-amber-400 drop-shadow-md animate-pulse'}`} />
        </div>
      ))}
      {rPlayers.map((p, idx) => (
        <div key={idx} className="absolute w-[10%] h-[10%] flex flex-col items-center justify-center z-20" style={{ left: `${p.x * 10}%`, top: `${p.y * 10}%` }}>
          <div className="w-5 h-5 bg-white/20 border border-white rounded-md flex items-center justify-center backdrop-blur-md text-xs shadow-md">
            {getIconForPlayer(p.nama, rData.tema)}
          </div>
          <span className="absolute -bottom-3 text-[7px] bg-black/80 px-1 rounded text-white font-bold">{p.nama.substring(0,5)}</span>
        </div>
      ))}
    </div>
  );

  if (!roomData) return ( <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans"><div className="animate-pulse flex flex-col items-center gap-4"><Navigation size={48} className="text-[var(--primary)] animate-spin" /><h2 className="font-bold text-xl tracking-widest text-[var(--primary)]">MEMUAT ARENA...</h2></div></div> );
  const temaAktif = roomData.tema || "galaxy";
  const modeGame = roomData.pengaturan?.mode || "Kumpulkan Harta";
  const sisaWaktu = Math.max(0, 304 - timeElapsed);

  return (
    <main className={`theme-${temaAktif} min-h-screen relative flex flex-col overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-1000 select-none`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.6); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.6); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.5); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: all 0.4s ease; }
        .glass-btn { background: var(--glass-bg); backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text-main); }
        .glass-btn:hover { box-shadow: var(--glow-shadow); border-color: var(--primary); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
      
      <BackgroundCanvas 
        tema={temaAktif} 
        particlesEnabled={particlesEnabled} 
        musicEnabled={musicEnabled}
        volume={volume}
        forcePauseMusic={true} 
      />

      {/* --- MODAL PERINGATAN AFK --- */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel p-8 md:p-10 w-full max-w-sm text-center border-t-4 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <AlertTriangle size={64} className="mx-auto text-rose-500 mb-4 animate-pulse" />
            <h2 className="text-2xl font-black text-white mb-2 tracking-wide">ARENA SEPI!</h2>
            <p className="text-gray-300 text-sm font-medium mb-6">
              Room akan segera ditutup dalam <br/>
              <span className="text-5xl font-black text-rose-400 drop-shadow-md my-3 block">{idleCountdown}</span>
              detik untuk menghemat server.
            </p>
            <button 
              onClick={tambahWaktuAFK}
              className="w-full py-4 rounded-xl font-black text-base bg-rose-500 text-white hover:bg-rose-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            >
              SAYA MASIH DI SINI! (+5 Menit)
            </button>
          </div>
        </div>
      )}

      {roomData.status === "playing" && timeElapsed < 4 && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <span className="text-[150px] md:text-[200px] font-black text-gradient drop-shadow-[0_0_50px_var(--primary)] animate-ping">
            {timeElapsed < 3 ? 3 - timeElapsed : "GO!"}
          </span>
          <p className="mt-8 text-2xl text-white font-bold tracking-[0.5em] uppercase animate-pulse">Bersiaplah, Komandan!</p>
        </div>
      )}

      {roomData.status === "playing" && timeElapsed >= 4 && (
        <div className="absolute top-4 w-full flex flex-col items-center z-50 pointer-events-none">
          <div className={`glass-panel px-8 py-2.5 rounded-full border shadow-[var(--glow-shadow)] flex items-center gap-3 mb-1.5 ${sisaWaktu <= 60 ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse' : 'border-[var(--primary)]/50'}`}>
            <Timer size={20} className={sisaWaktu <= 60 ? 'text-rose-400' : 'text-white'} />
            <span className={`font-black text-2xl tracking-widest ${sisaWaktu <= 60 ? '' : 'text-white'}`}>{formatTime(sisaWaktu)}</span>
          </div>
          {!isHost && (
            <span className="text-xs font-black bg-black/60 text-[var(--primary)] px-4 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-1.5 pointer-events-auto">
              <Trophy size={14} /> Posisi Peringkat: #{myRank} dari {activePlayers.length}
            </span>
          )}
        </div>
      )}

      {roomData.status === "playing" && !isHost && modeGame === "Kumpulkan Harta" && timeElapsed >= 4 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pb-20 pt-24">
          {feedback?.type === "WARNING" && (
            <div className="absolute top-24 bg-rose-500/90 text-white font-bold px-6 py-3 rounded-full z-50 animate-bounce shadow-2xl flex items-center gap-2 text-sm">
              <XOctagon size={18} /> {feedback.text}
            </div>
          )}

          <div className="relative w-full max-w-[400px] aspect-square glass-panel p-0 overflow-hidden shadow-[var(--glow-shadow)] mx-auto border-2 border-[var(--primary)]/30">
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
              {Array.from({ length: 100 }).map((_, i) => (<div key={i} className={`border border-white/5 ${ (Math.floor(i/10) + i%10) % 2 === 0 ? 'bg-white/5' : 'bg-transparent' }`} />))}
            </div>
            {roomData.soal?.map((s) => !s.isSelesai && (
              <div key={s.soalIndex} className="absolute w-[10%] h-[10%] flex items-center justify-center" style={{ left: `${s.x * 10}%`, top: `${s.y * 10}%` }}>
                <div className={`relative ${s.claimedBy ? 'opacity-40 grayscale scale-90' : 'animate-bounce'}`}>
                  <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 rounded-full"></div>
                  <Gift size={24} className={`relative z-10 ${s.claimedBy ? 'text-gray-400' : 'text-amber-400 drop-shadow-lg'}`} />
                </div>
                {s.claimedBy && s.claimedBy !== namaPeserta && (<span className="absolute -top-3 text-[7px] bg-rose-500/90 px-1 rounded text-white font-bold z-30">{s.claimedBy}</span>)}
              </div>
            ))}
            
            {activePlayers.map((p, idx) => (
              <div key={idx} className="absolute w-[10%] h-[10%] flex items-center justify-center transition-all duration-300 z-20" style={{ left: `${p.x * 10}%`, top: `${p.y * 10}%` }}>
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all border ${ p.nama === namaPeserta ? "bg-[var(--primary)]/90 border-white shadow-[var(--glow-shadow)] scale-110 z-30" : "bg-white/20 border-white/50 backdrop-blur-md z-10" }`}>
                    <span className="text-lg md:text-xl drop-shadow-md">{getIconForPlayer(p.nama, temaAktif)}</span>
                  </div>
                  <span className={`absolute -bottom-5 text-[9px] font-black px-1.5 py-0.5 rounded whitespace-nowrap z-40 ${p.nama === namaPeserta ? 'bg-[var(--primary)] text-slate-900 shadow-md' : 'bg-black/70 text-white'}`}>{p.nama}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 z-30 md:hidden">
            <button onClick={() => gerak("UP")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronUp size={32} /></button>
            <div className="flex gap-4">
              <button onClick={() => gerak("LEFT")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronLeft size={32} /></button>
              <div className="w-14 h-14 flex items-center justify-center opacity-30"><Navigation size={24} className="text-[var(--primary)]"/></div>
              <button onClick={() => gerak("RIGHT")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronRight size={32} /></button>
            </div>
            <button onClick={() => gerak("DOWN")} className="w-14 h-14 glass-panel flex items-center justify-center active:scale-90 text-[var(--primary)]"><ChevronDown size={32} /></button>
          </div>

          {soalAktif && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="glass-panel p-6 md:p-10 w-full max-w-xl text-center relative border-[var(--primary)]/50 shadow-[var(--glow-shadow)]">
                {feedback && feedback.type !== "WARNING" && (
                  <div className="absolute inset-0 glass-panel border-none rounded-2xl flex flex-col items-center justify-center z-20" style={{ background: 'var(--glass-bg)'}}>
                    {feedback.type === "BENAR" ? (
                      <><ShieldCheck size={80} className="text-emerald-400 mb-3 animate-bounce" /><h1 className="text-3xl md:text-4xl font-black text-emerald-400">{feedback.text}</h1><p className="mt-2 text-emerald-200 font-bold">+10 Poin</p></>
                    ) : (
                      <><XOctagon size={80} className="text-rose-400 mb-3 animate-pulse" /><h1 className="text-3xl md:text-4xl font-black text-rose-400">{feedback.text}</h1><p className="mt-2 text-rose-200 font-bold">Soal lepas ke arena!</p></>
                    )}
                  </div>
                )}
                <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-black px-5 py-2 rounded-full border border-[var(--primary)]/40 tracking-widest mb-6">SOAL HARTA KARUN</span>
                <p className="mb-6 text-lg md:text-xl font-bold leading-relaxed">{soalAktif.pertanyaan}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {soalAktif.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => jawabSoalHarta(opsi)} className="glass-btn p-5 rounded-xl font-bold text-base hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] active:scale-95 transition-all">{opsi}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {roomData.status === "playing" && !isHost && modeGame === "Atlet Lari" && timeElapsed >= 4 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pt-24">
          {atletView === "TRACK" ? (
            <div className="w-full max-w-4xl flex flex-col gap-6 animate-fadeIn items-center">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-[var(--primary)] drop-shadow-[0_0_10px_var(--primary)] uppercase tracking-widest flex items-center justify-center gap-2"><Flag/> Posisi Lintasan <Flag/></h2>
                <p className="text-sm text-white/70 mt-1 font-bold">Pertanyaan selanjutnya akan segera muncul...</p>
              </div>
              <TrackComponent pPlayers={activePlayers} pPengaturan={roomData.pengaturan} />
              {feedback && (
                <div className={`mt-4 px-8 py-3 rounded-full font-black text-xl animate-bounce shadow-xl ${feedback.type==='BENAR' ? 'bg-emerald-500 text-slate-900' : 'bg-rose-500 text-white'}`}>
                  {feedback.text}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 md:p-12 w-full max-w-2xl text-center relative border-[var(--primary)]/50 shadow-[var(--glow-shadow)] animate-fadeIn">
              <span className="inline-block bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-black px-6 py-2 rounded-full border border-[var(--primary)]/40 tracking-widest mb-6 shadow-[0_0_15px_var(--primary)]">PERTANYAAN #{localSoalIndex + 1}</span>
              <p className="mb-8 text-xl md:text-2xl font-bold leading-relaxed">{roomData.soal[localSoalIndex % roomData.soal.length]?.pertanyaan}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomData.soal[localSoalIndex % roomData.soal.length]?.opsi.map((opsi, idx) => (
                  <button key={idx} onClick={() => jawabSoalAtlet(opsi)} className="glass-btn p-5 rounded-2xl font-bold text-lg hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] active:scale-95 flex items-center justify-center transition-all">{opsi}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isHost && roomData.status === "playing" && timeElapsed >= 4 && (
        <div className="absolute inset-0 z-10 flex flex-col md:flex-row gap-6 p-6 w-full max-w-[1400px] mx-auto overflow-hidden pt-28 pb-8">
          <div className="flex-1 glass-panel flex flex-col p-6 shadow-[var(--glow-shadow)] overflow-hidden border-t-4 border-t-yellow-400">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--glass-border)]">
              <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse" />
              <h2 className="text-2xl font-black text-yellow-400 tracking-wide drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">Live Leaderboard</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {activePlayers.length === 0 && <p className="text-gray-400 italic text-center pt-10">Siswa belum ada yang masuk arena...</p>}
              {activePlayers.map((p, index) => (
                <div key={index} className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-500 ${index === 0 ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-[1.02] z-10 relative' : index === 1 ? 'bg-slate-300/10 border-slate-400 shadow-[0_0_10px_rgba(203,213,225,0.2)]' : index === 2 ? 'bg-amber-600/10 border-amber-600/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-base ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-white'}`}>{index + 1}</span>
                    <span className="text-lg drop-shadow-md">{getIconForPlayer(p.nama, temaAktif)}</span>
                    <span className="font-bold text-lg">{p.nama}</span>
                  </div>
                  <span className={`font-black text-xl px-3 py-1 rounded-lg border ${index === 0 ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'}`}>{p.skor} Pts</span>
                </div>
              ))}
            </div>

            <button onClick={() => akhiriGame("Dihentikan Paksa oleh Guru (Stop)")} className="mt-4 w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <XSquare size={20} /> Hentikan Permainan
            </button>
          </div>

          <div className="flex-[1.5] glass-panel p-6 shadow-[var(--glow-shadow)] flex flex-col relative overflow-hidden border-t-4 border-t-[var(--primary)]">
            <h2 className="text-xl font-black text-[var(--primary)] flex items-center gap-2 mb-6 border-b border-[var(--glass-border)] pb-4">
              <Map size={24}/> Pantauan Arena Live ({modeGame})
            </h2>
            <div className="flex-1 flex items-center justify-center overflow-hidden w-full">
              {modeGame === "Kumpulkan Harta" ? (
                <MiniMapKumpulkanHarta rData={roomData} rPlayers={activePlayers} />
              ) : (
                <TrackComponent pPlayers={activePlayers} pPengaturan={roomData.pengaturan} />
              )}
            </div>
          </div>
        </div>
      )}

      {(roomData.status !== "playing") && (
        <div className="relative z-20 flex-1 flex items-center justify-center p-6 w-full pb-12">
          <div className="glass-panel p-8 md:p-10 w-full max-w-2xl text-center border-t-4 border-t-[var(--primary)] shadow-[var(--glow-shadow)] animate-fadeIn">
            {roomData.status === "finished" && (
              <div>
                <div className="inline-block p-5 rounded-full bg-[var(--primary)]/20 mb-4 border border-[var(--primary)]/30"><Trophy size={56} className="text-[var(--primary)] drop-shadow-[0_0_15px_var(--primary)]" /></div>
                <h2 className="text-4xl font-black mb-2 text-gradient tracking-tight">KLASEMEN AKHIR</h2>
                <p className="text-rose-400 font-bold mb-6 text-sm flex items-center justify-center gap-2"><XOctagon size={16}/> {roomData.alasanAkhir || "Permainan Berakhir"}</p>
                
                <div className="glass-panel bg-black/30 p-3 max-h-80 overflow-y-auto mb-8 border-none custom-scrollbar">
                  {activePlayers.map((p, index) => (
                    <div key={index} className="flex justify-between items-center glass-btn border-white/10 p-4 mb-2 rounded-xl">
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10'}`}>{index + 1}</span>
                        <span className="text-2xl drop-shadow-md">{getIconForPlayer(p.nama, temaAktif)}</span>
                        <span className="font-bold text-xl">{p.nama}</span>
                      </div>
                      <span className="font-black text-[var(--primary)] text-2xl">{p.skor} Pts</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/lobby")} className="w-full py-4 rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-[var(--glow-shadow)]" style={{ background: 'var(--primary)', color: temaAktif === 'sky' ? '#fff' : '#000' }}>Kembali ke Lobby</button>
              </div>
            )}

            {roomData.status === "waiting" && (
              <div>
                <h2 className="text-3xl font-black text-gradient mb-2">{roomData.nama_room}</h2>
                <p className="text-[var(--text-muted)] mb-8 font-medium uppercase tracking-widest text-sm">Tema Dunia: {roomData.tema}</p>
                
                {isHost ? (
                  <div className="bg-black/30 p-6 rounded-2xl border border-[var(--glass-border)] text-left mb-8 space-y-5">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3"><Settings2 size={20} className="text-[var(--primary)]"/> Pengaturan Permainan</h3>
                    <div>
                      <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-1.5"><Map size={14}/> Mode Permainan</label>
                      <select value={pengaturan.mode} onChange={(e) => setPengaturan({...pengaturan, mode: e.target.value})} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-[var(--primary)] outline-none cursor-pointer">
                        <option className="bg-slate-900" value="Kumpulkan Harta">Kumpulkan Harta (Papan Catur)</option>
                        <option className="bg-slate-900" value="Atlet Lari">Atlet Lari (Balapan)</option>
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
                      <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mb-1.5"><Hash size={14}/> Jumlah Soal/Target</label>
                      <select value={pengaturan.jumlah} onChange={(e) => setPengaturan({...pengaturan, jumlah: e.target.value})} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-[var(--primary)] outline-none cursor-pointer">
                        <option className="bg-slate-900" value="5">5 Harta / 5 Langkah Finis</option>
                        <option className="bg-slate-900" value="10">10 Harta / 10 Langkah Finis</option>
                        <option className="bg-slate-900" value="15">15 Harta / 15 Langkah Finis</option>
                      </select>
                    </div>

                    {pengaturan.mode === "Atlet Lari" && activePlayers.length > 4 && (
                      <p className="text-rose-400 text-xs font-bold text-center">⚠️ Maksimal 4 pemain untuk mode Atlet Lari!</p>
                    )}

                    <button disabled={pengaturan.mode === "Atlet Lari" && activePlayers.length > 4} onClick={mulaiGame} className="w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 mt-4 transition-transform hover:scale-105 shadow-[var(--glow-shadow)] disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--primary)', color: temaAktif === 'sky' ? '#fff' : '#000' }}>
                      <Play fill="currentColor" size={20} /> MULAI EKSPLORASI DUNIA!
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-2xl mb-8 animate-pulse">
                    <p className="text-[var(--text-main)] font-bold text-lg">Menunggu Host mengatur dan memulai permainan...</p>
                  </div>
                )}

                <div className="text-left border-t border-[var(--glass-border)] pt-6">
                  <p className="text-sm font-bold text-[var(--text-muted)] mb-4 flex items-center gap-2"><Navigation size={16}/> Pemain Bergabung ({activePlayers.length}):</p>
                  <div className="flex flex-wrap gap-3">
                    {activePlayers.length === 0 && <span className="text-[var(--text-muted)] text-sm italic">Belum ada siswa yang masuk...</span>}
                    {activePlayers.map((p, idx) => (
                      <span key={idx} className="glass-btn px-4 py-2 rounded-full text-sm font-bold border-[var(--primary)]/30 text-[var(--text-main)] flex items-center gap-2"><span className="text-base drop-shadow-sm">{getIconForPlayer(p.nama, temaAktif)}</span>{p.nama}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
