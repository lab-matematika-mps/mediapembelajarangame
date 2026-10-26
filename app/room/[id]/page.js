"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, setDoc, collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../../../firebase";

export default function Room() {
  const { id } = useParams();
  const router = useRouter();
  const [roomData, setRoomData] = useState(null);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("City");
  const [skor, setSkor] = useState(0);
  const [players, setPlayers] = useState([]);
  
  const [indeksSoal, setIndeksSoal] = useState(0);
  const [isSelesai, setIsSelesai] = useState(false);
  const [feedback, setFeedback] = useState(null); // Efek Benar/Salah

  // State Setup Arena
  const [genMateri, setGenMateri] = useState("Ciri-ciri Bangun Datar");
  const [genTingkat, setGenTingkat] = useState("Mudah");
  const [genJumlah, setGenJumlah] = useState(5);
  const [temaPermainan, setTemaPermainan] = useState("Balon Udara");

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    const bg = localStorage.getItem("tema_bg") || "City";
    if (!nama) return router.push("/");
    setNamaPeserta(nama);
    setTemaBg(bg);

    const playerRef = doc(db, `rooms/${id}/players`, nama);
    setDoc(playerRef, { nama, skor: 0, status: "belum" }, { merge: true });

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

  const generateArena = async () => {
    try {
      const qSoal = query(collection(db, "daftar_soal"), where("materi", "==", genMateri));
      const snapshot = await getDocs(qSoal);
      let bankSoal = snapshot.docs.map(d => d.data());
      let targetTingkat = genTingkat.split("-");
      if (genTingkat === "Mudah-Sedang") targetTingkat = ["Mudah", "Sedang"];
      bankSoal = bankSoal.filter(soal => targetTingkat.includes(soal.tingkat));
      
      if (bankSoal.length < genJumlah) return alert(`Soal kurang! Hanya ada ${bankSoal.length}.`);
      
      bankSoal.sort(() => 0.5 - Math.random());
      await updateDoc(doc(db, "rooms", id), {
        soal: bankSoal.slice(0, parseInt(genJumlah)),
        tema: temaPermainan,
        status: "waiting"
      });
    } catch (error) { alert("Gagal generate."); }
  };

  const mulaiGame = async () => await updateDoc(doc(db, "rooms", id), { status: "playing" });
  const akhiriGame = async () => await updateDoc(doc(db, "rooms", id), { status: "finished" });

  const jawabSoal = async (jawabanDipilih) => {
    const soalSekarang = roomData.soal[indeksSoal];
    let skorBaru = skor;
    const isBenar = jawabanDipilih === soalSekarang.jawabanBenar;
    
    setFeedback(isBenar ? "BENAR" : "SALAH");

    if (isBenar) {
      skorBaru = skor + 10;
      setSkor(skorBaru);
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
    }

    setTimeout(async () => {
      setFeedback(null);
      const nextIndex = indeksSoal + 1;
      if (nextIndex < roomData.soal.length) {
        setIndeksSoal(nextIndex);
      } else {
        setIsSelesai(true);
        await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { status: "selesai" });
      }
    }, 1200); // Tunda 1.2 detik agar siswa bisa melihat efek visual
  };

  // Render Visual Mini-Game berdasarkan skor
  const renderVisualGame = () => {
    const progress = skor / 10; 
    if (roomData.tema === "Balon Udara") return <div className="text-5xl transition-all duration-1000" style={{ transform: `translateY(-${progress * 15}px)` }}>🎈☁️</div>;
    if (roomData.tema === "Jembatan") return <div className="text-4xl">🧱{"🧱".repeat(progress)}🏃‍♂️</div>;
    if (roomData.tema === "Tambang") return <div className="text-4xl">⛏️{"💎".repeat(progress)}</div>;
    if (roomData.tema === "Labirin") return <div className="text-4xl">🚪{"🟩".repeat(progress)}🏃‍♂️</div>;
  };

  if (!roomData) return <div className="p-8 text-center font-bold">Memuat Arena...</div>;
  const isHost = roomData.host === namaPeserta;

  return (
    <main className="min-h-screen relative overflow-hidden font-sans p-6 text-gray-800 flex items-center justify-center">
      {/* Background Animasi */}
      <div className={`absolute inset-0 z-[-1] transition-colors duration-1000 ${
        temaBg === "Luar Angkasa" ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-black" :
        temaBg === "Samudra" ? "bg-gradient-to-b from-cyan-300 via-blue-500 to-blue-900" :
        "bg-gradient-to-t from-orange-300 via-pink-200 to-blue-200"
      }`}>
         <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
      </div>

      <div className="bg-white/90 backdrop-blur-md p-8 rounded-[40px] shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.5)] w-full max-w-2xl text-center border-4 border-white relative">
        
        {/* === KLASEMEN AKHIR UNTUK GURU & SISWA === */}
        {roomData.status === "finished" ? (
          <div className="w-full">
            <h2 className="text-4xl font-black text-emerald-500 mb-2">🏆 KLASEMEN AKHIR 🏆</h2>
            <p className="text-gray-500 font-bold mb-6">Misi {roomData.tema} Selesai!</p>
            <div className="bg-[#f4f7fe] p-4 rounded-3xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] max-h-80 overflow-y-auto mb-6">
              {players.map((p, index) => (
                <div key={index} className="flex justify-between items-center bg-white p-4 mb-4 rounded-2xl shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                  <span className="font-black text-gray-700 text-xl">{index + 1}. {p.nama}</span>
                  <span className="font-black text-indigo-500 text-2xl">{p.skor} Pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/lobby")} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-2xl font-black active:scale-95 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.2)]">
              ⬅ Kembali ke Lobby
            </button>
          </div>
        ) : (
          
          /* === JIKA GAME BELUM SELESAI === */
          <>
            {roomData.status === "setup" && isHost && (
              <div className="text-left space-y-4">
                <h2 className="text-2xl font-black text-indigo-500 mb-6 text-center">⚙️ Setup Arena Pertandingan</h2>
                <div>
                  <label className="block font-bold text-gray-600 mb-2 ml-2">Tema Permainan</label>
                  <select value={temaPermainan} onChange={e => setTemaPermainan(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] border-none outline-none font-bold text-gray-700">
                    <option value="Balon Udara">🎈 Balap Balon Udara</option>
                    <option value="Jembatan">🧱 Membangun Jembatan Apung</option>
                    <option value="Tambang">💎 Ekspedisi Tambang Permata</option>
                    <option value="Labirin">🌀 Meloloskan Diri dari Labirin</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-600 mb-2 ml-2">Materi</label>
                    <select value={genMateri} onChange={e => setGenMateri(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] border-none outline-none font-bold text-gray-700">
                      <option value="Ciri-ciri Bangun Datar">Ciri Bangun Datar</option>
                      <option value="Luas Bangun Datar">Luas Bangun Datar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-2 ml-2">Tingkat</label>
                    <select value={genTingkat} onChange={e => setGenTingkat(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] border-none outline-none font-bold text-gray-700">
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Mudah-Sedang">Mudah-Sedang</option>
                    </select>
                  </div>
                </div>
                <button onClick={generateArena} className="w-full bg-emerald-400 hover:bg-emerald-500 text-white py-4 mt-4 rounded-2xl font-black active:scale-95 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.2)]">
                  Generate & Buka Arena!
                </button>
              </div>
            )}

            {roomData.status === "waiting" && (
              <div>
                <h2 className="text-3xl font-black text-indigo-500 mb-2">{roomData.nama_room}</h2>
                <p className="text-emerald-500 font-black mb-6 bg-emerald-50 py-2 px-4 rounded-2xl inline-block">Tema: {roomData.tema}</p>
                <h3 className="text-xl mb-6 text-gray-600 font-bold animate-pulse">Menunggu komandan memulai...</h3>
                
                {isHost && (
                  <button onClick={mulaiGame} className="bg-rose-400 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-lg w-full active:scale-95 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.2)] mb-6">
                    🚀 MULAI PERMAINAN!
                  </button>
                )}
                
                <div className="flex flex-wrap gap-3 justify-center">
                  {players.map((p, idx) => (
                    <span key={idx} className="bg-[#f4f7fe] text-indigo-500 px-5 py-3 rounded-2xl font-black shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                      {p.nama}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {roomData.status === "playing" && (
              <div>
                {isHost ? (
                  <div className="text-center">
                    <h2 className="text-2xl font-black mb-4 text-indigo-500">🏆 Live Leaderboard 🏆</h2>
                    <div className="bg-[#f4f7fe] p-4 rounded-3xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] max-h-80 overflow-y-auto mb-6">
                      {players.map((p, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-4 mb-4 rounded-2xl shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                          <span className="font-bold text-gray-700 text-lg">{index + 1}. {p.nama} {p.status === "selesai" && "✅"}</span>
                          <span className="font-black text-indigo-400 text-xl">{p.skor} Pts</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={akhiriGame} className="bg-rose-400 hover:bg-rose-500 text-white px-6 py-4 rounded-2xl font-black w-full active:scale-95 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.2)]">
                      Akhiri Permainan & Tampilkan Hasil
                    </button>
                  </div>
                ) : isSelesai ? (
                  <div className="py-8">
                    <h2 className="text-4xl font-black text-emerald-400 mb-4">Misi Selesai! 🎉</h2>
                    <div className="mb-6">{renderVisualGame()}</div>
                    <p className="text-gray-500 font-bold">Tunggu guru mengakhiri misi untuk melihat klasemen.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* FEEDBACK BENAR/SALAH (OVERLAY) */}
                    {feedback && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-3xl backdrop-blur-sm animate-bounce">
                         <h1 className={`text-6xl font-black ${feedback === "BENAR" ? "text-emerald-500" : "text-rose-500"}`}>
                           {feedback === "BENAR" ? "BENAR! 🎉" : "SALAH! 💥"}
                         </h1>
                      </div>
                    )}

                    <div className="mb-6 h-16 bg-[#f4f7fe] rounded-3xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center overflow-hidden">
                       {renderVisualGame()}
                    </div>

                    <h2 className="text-lg font-black mb-6 text-rose-400 bg-rose-50 py-2 px-6 rounded-full inline-block shadow-sm">Pertanyaan {indeksSoal + 1} / {roomData.soal.length}</h2>
                    <p className="mb-8 text-2xl font-black text-gray-700">{roomData.soal[indeksSoal]?.pertanyaan}</p>
                    
                    <div className="grid grid-cols-2 gap-5">
                      {roomData.soal[indeksSoal]?.opsi.map((opsi, idx) => (
                        <button key={idx} onClick={() => !feedback && jawabSoal(opsi)} className="bg-[#f4f7fe] hover:bg-indigo-50 text-indigo-500 p-6 rounded-3xl font-black active:scale-90 transition-all shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] text-xl border-2 border-transparent">
                          {opsi}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}