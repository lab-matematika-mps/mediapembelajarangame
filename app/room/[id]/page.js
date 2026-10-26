"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, setDoc, collection, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";

export default function Room() {
  const { id } = useParams();
  const router = useRouter();
  const [roomData, setRoomData] = useState(null);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [skor, setSkor] = useState(0);
  const [players, setPlayers] = useState([]);
  
  // Posisi karakter kotak siswa di peta (koordinat x dan y grid 0-100)
  const [posisi, setPosisi] = useState({ x: 50, y: 50 });
  
  const [indeksSoal, setIndeksSoal] = useState(0);
  const [soalAktif, setSoalAktif] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);

    // Daftarkan posisi awal pemain ke Firestore
    const playerRef = doc(db, `rooms/${id}/players`, nama);
    setDoc(playerRef, { nama, skor: 0, x: 50, y: 50, status: "menjelajah" }, { merge: true });

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

  // Fungsi pergerakan karakter kotak menggunakan tombol panah / WASD di keyboard
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

  const mulaiGame = async () => await updateDoc(doc(db, "rooms", id), { status: "playing" });
  const akhiriGame = async () => await updateDoc(doc(db, "rooms", id), { status: "finished" });

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
      const nextIndex = (indeksSoal + 1) % roomData.soal.length;
      setIndeksSoal(nextIndex);
    }, 1000);
  };

  if (!roomData) return <div className="p-8 text-center font-bold">Memuat Dunia RPG...</div>;
  const isHost = roomData.host === namaPeserta;

  return (
    <main className="min-h-screen relative overflow-hidden font-sans bg-slate-900 text-white select-none">
      
      {/* 1. TAMPILAN ARENA EXPLORE (GAYA RPG TOP-DOWN) */}
      {roomData.status === "playing" && !isHost && (
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]">
          
          {/* Petunjuk Kontrol */}
          <div className="absolute top-4 left-4 z-20 bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="font-black text-indigo-400 mb-1">🎮 Misi: Jelajahi Peta</h3>
            <p className="text-xs text-slate-300">Gunakan tombol <b>W, A, S, D</b> atau <b>Panah Keyboard</b> untuk menggerakkan kotak karaktermu!</p>
            <p className="text-sm font-bold mt-2 text-emerald-400">Skor Kamu: {skor} Pts</p>
          </div>

          {/* Tombol Interaksi Harta Karun / Kotak Soal di Peta */}
          <div 
            onClick={() => setSoalAktif(true)}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer animate-bounce group"
          >
            <div className="w-20 h-20 bg-amber-500 rounded-2xl border-4 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🎁
            </div>
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-amber-400 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap border border-slate-700">
              Klik untuk Ambil Harta!
            </span>
          </div>

          {/* RENDER SEMUA KARAKTER PEMAIN DI PETA (KOTAK 3D SEDERHANA) */}
          {players.map((p, idx) => (
            <div 
              key={idx}
              className="absolute transition-all duration-300 ease-linear flex flex-col items-center"
              style={{ top: `${p.y || 50}%`, left: `${p.x || 50}%` }}
            >
              <span className="bg-slate-900/90 text-xs font-bold px-2 py-0.5 rounded-md mb-1 border border-slate-700 whitespace-nowrap">
                {p.nama} {p.nama === namaPeserta && "(Kamu)"}
              </span>
              {/* Bentuk Karakter Kotak ala Low-Poly */}
              <div className={`w-10 h-10 rounded-xl shadow-lg border-2 border-white/40 flex items-center justify-center text-lg font-black ${
                p.nama === namaPeserta ? "bg-indigo-500 shadow-indigo-500/50" : "bg-pink-500 shadow-pink-500/50"
              }`}>
                📦
              </div>
            </div>
          ))}

          {/* POP-UP SOAL MATEMATIKA SAAT BERINTERAKSI DENGAN HARTA */}
          {soalAktif && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border-4 border-slate-700 p-8 rounded-[30px] w-full max-w-xl text-center shadow-2xl relative">
                
                {feedback && (
                  <div className="absolute inset-0 bg-slate-900/90 rounded-[26px] flex items-center justify-center z-10">
                    <h1 className={`text-5xl font-black ${feedback === "BENAR" ? "text-emerald-400" : "text-rose-400"}`}>
                      {feedback === "BENAR" ? "HARTA DIDAPAT! 🎉" : "GAGAL! ❌"}
                    </h1>
                  </div>
                )}

                <span className="bg-indigo-500/20 text-indigo-400 text-xs font-black px-4 py-1.5 rounded-full border border-indigo-500/30">
                  UJI MATEMATIKA PETUALANG
                </span>
                <p className="my-6 text-xl font-bold text-slate-100">{roomData.soal[indeksSoal]?.pertanyaan}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {roomData.soal[indeksSoal]?.opsi.map((opsi, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => jawabSoal(opsi)}
                      className="bg-slate-700 hover:bg-indigo-600 text-slate-100 p-4 rounded-2xl font-black text-lg transition-all border border-slate-600 active:scale-95"
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

      {/* 2. TAMPILAN SETUP & KLASEMEN UNTUK GURU */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="bg-slate-800 border-4 border-slate-700 p-8 rounded-[40px] shadow-2xl w-full max-w-2xl text-center">
          
          {roomData.status === "finished" && (
            <div>
              <h2 className="text-3xl font-black text-emerald-400 mb-2">🏆 KLASEMEN AKHIR PETUALANGAN 🏆</h2>
              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-700 max-h-80 overflow-y-auto mb-6">
                {players.map((p, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-800 p-4 mb-3 rounded-2xl border border-slate-700">
                    <span className="font-bold text-lg">{index + 1}. {p.nama}</span>
                    <span className="font-black text-indigo-400 text-xl">{p.skor} Pts</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/lobby")} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black">
                Kembali ke Lobby
              </button>
            </div>
          )}

          {roomData.status === "waiting" && (
            <div>
              <h2 className="text-3xl font-black text-indigo-400 mb-2">{roomData.nama_room}</h2>
              <p className="text-slate-400 mb-6 font-bold">Tema: {roomData.tema}</p>
              {isHost && (
                <button onClick={mulaiGame} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black text-lg mb-6 shadow-lg">
                  🚀 MULAI EKSPLORASI DUNIA!
                </button>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {players.map((p, idx) => (
                  <span key={idx} className="bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-600">
                    📦 {p.nama}
                  </span>
                ))}
              </div>
            </div>
          )}

          {roomData.status === "playing" && isHost && (
            <div>
              <h2 className="text-2xl font-black mb-4 text-indigo-400">👀 Pantauan Guru (Live Leaderboard)</h2>
              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-700 max-h-80 overflow-y-auto mb-6">
                {players.map((p, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-800 p-4 mb-3 rounded-2xl border border-slate-700">
                    <span className="font-bold text-lg">{index + 1}. {p.nama}</span>
                    <span className="font-black text-indigo-400 text-xl">{p.skor} Pts</span>
                  </div>
                ))}
              </div>
              <button onClick={akhiriGame} className="w-full bg-rose-600 hover:bg-rose-500 py-4 rounded-2xl font-black">
                Akhiri Petualangan
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
