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
  const [skor, setSkor] = useState(0);
  const [players, setPlayers] = useState([]);
  
  const [indeksSoal, setIndeksSoal] = useState(0);
  const [isSelesai, setIsSelesai] = useState(false);

  // State Setup Arena
  const [genMateri, setGenMateri] = useState("Ciri-ciri Bangun Datar");
  const [genTingkat, setGenTingkat] = useState("Mudah");
  const [genJumlah, setGenJumlah] = useState(5);
  const [temaPermainan, setTemaPermainan] = useState("Balon Udara");

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);

    const playerRef = doc(db, `rooms/${id}/players`, nama);
    setDoc(playerRef, { nama, skor: 0, status: "belum" }, { merge: true });

    const roomRef = doc(db, "rooms", id);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
      else router.push("/lobby");
    });

    const playersRef = collection(db, `rooms/${id}/players`);
    const unsubPlayers = onSnapshot(query(playersRef, orderBy("skor", "desc")), (snapshot) => {
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
      if (genTingkat === "Sedang-Sulit") targetTingkat = ["Sedang", "Sulit"];
      if (genTingkat === "Mudah-Sulit") targetTingkat = ["Mudah", "Sulit"];

      bankSoal = bankSoal.filter(soal => targetTingkat.includes(soal.tingkat));

      if (bankSoal.length < genJumlah) return alert(`Soal tidak cukup! Hanya ada ${bankSoal.length} soal.`);

      bankSoal.sort(() => 0.5 - Math.random());
      const soalTerpilih = bankSoal.slice(0, parseInt(genJumlah));

      await updateDoc(doc(db, "rooms", id), {
        soal: soalTerpilih,
        tema: temaPermainan,
        status: "waiting"
      });
    } catch (error) {
      alert("Gagal generate soal.");
    }
  };

  const mulaiGame = async () => await updateDoc(doc(db, "rooms", id), { status: "playing" });
  const akhiriGame = async () => await updateDoc(doc(db, "rooms", id), { status: "finished" });

  const jawabSoal = async (jawabanDipilih) => {
    const soalSekarang = roomData.soal[indeksSoal];
    let skorBaru = skor;
    
    if (jawabanDipilih === soalSekarang.jawabanBenar) {
      skorBaru = skor + 10;
      setSkor(skorBaru);
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { skor: skorBaru });
    }

    const nextIndex = indeksSoal + 1;
    if (nextIndex < roomData.soal.length) {
      setIndeksSoal(nextIndex);
    } else {
      setIsSelesai(true);
      await updateDoc(doc(db, `rooms/${id}/players`, namaPeserta), { status: "selesai" });
    }
  };

  if (!roomData) return <div className="p-8 text-center font-bold">Memuat Arena...</div>;

  const isHost = roomData.host === namaPeserta;

  return (
    <main className="min-h-screen p-6 bg-[#f4f7fe] text-gray-800 font-sans flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-3xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] w-full max-w-2xl text-center border-4 border-white">
        
        {roomData.status === "setup" && isHost && (
          <div className="text-left space-y-4">
            <h2 className="text-2xl font-black text-indigo-400 mb-6 text-center">⚙️ Setup Arena Pertandingan</h2>
            <div>
              <label className="block font-bold text-gray-600 mb-2">Tema Permainan</label>
              <select value={temaPermainan} onChange={e => setTemaPermainan(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none outline-none font-bold text-gray-700">
                <option value="Balon Udara">🎈 Balap Balon Udara</option>
                <option value="Jembatan">🧱 Membangun Jembatan Apung</option>
                <option value="Tambang">💎 Ekspedisi Tambang Permata</option>
                <option value="Labirin">🌀 Meloloskan Diri dari Labirin</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-600 mb-2">Materi</label>
                <select value={genMateri} onChange={e => setGenMateri(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none outline-none">
                  <option value="Ciri-ciri Bangun Datar">Ciri-ciri Bangun Datar</option>
                  <option value="Luas Bangun Datar">Luas Bangun Datar</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-2">Tingkatan</label>
                <select value={genTingkat} onChange={e => setGenTingkat(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none outline-none">
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Mudah-Sedang">Mudah-Sedang</option>
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-bold text-gray-600 mb-2">Jumlah Soal</label>
              <input type="number" min="1" value={genJumlah} onChange={e => setGenJumlah(e.target.value)} className="w-full p-4 rounded-2xl bg-[#f4f7fe] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none outline-none text-center font-bold" />
            </div>
            <button onClick={generateArena} className="w-full bg-indigo-400 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black active:scale-95 transition-all shadow-[inset_4px_4px_8px_rgba(255,255,255,0.4),4px_4px_8px_rgba(0,0,0,0.15)]">
              Generate & Buka Arena!
            </button>
          </div>
        )}

        {roomData.status === "waiting" && (
          <div>
            <h2 className="text-2xl font-black text-indigo-400 mb-4">{roomData.nama_room}</h2>
            <p className="text-gray-500 font-bold mb-6 bg-[#f4f7fe] py-2 px-4 rounded-2xl inline-block shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]">Tema: {roomData.tema}</p>
            <h3 className="text-lg mb-6 text-gray-600 font-medium animate-pulse">Menunggu komandan memulai...</h3>
            
            {isHost && (
              <button onClick={mulaiGame} className="bg-emerald-400 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg w-full active:scale-95 transition-all shadow-[inset_4px_4px_8px_rgba(255,255,255,0.4),4px_4px_8px_rgba(0,0,0,0.15)] mb-6">
                🚀 MULAI PERMAINAN!
              </button>
            )}
            
            <div className="flex flex-wrap gap-3 justify-center">
              {players.map((p, idx) => (
                <span key={idx} className="bg-[#f4f7fe] text-indigo-500 px-5 py-2 rounded-2xl font-bold shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                  {p.nama}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status Playing dan Finished (Bisa menggunakan logika sebelumnya dengan styling Claymorphism) */}
        {roomData.status === "playing" && (
          <div>
            {isHost ? (
               <div className="text-center">
                  <h2 className="text-2xl font-black mb-4 text-indigo-400">🏆 Live Leaderboard 🏆</h2>
                  <div className="bg-[#f4f7fe] p-4 rounded-3xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] max-h-80 overflow-y-auto mb-6">
                    {players.map((p, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-4 mb-4 rounded-2xl shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                        <span className="font-bold text-gray-700 text-lg">{index + 1}. {p.nama} {p.status === "selesai" && "✅"}</span>
                        <span className="font-black text-indigo-400 text-xl">{p.skor} Pts</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={akhiriGame} className="bg-rose-400 text-white px-6 py-4 rounded-2xl font-black w-full active:scale-95 transition-all shadow-[inset_4px_4px_8px_rgba(255,255,255,0.4),4px_4px_8px_rgba(0,0,0,0.15)]">
                    Akhiri Permainan Sekarang
                  </button>
               </div>
            ) : isSelesai ? (
               <div className="py-8">
                 <h2 className="text-3xl font-black text-emerald-400 mb-4">Kerja Bagus! 🎉</h2>
                 <p className="text-gray-500 font-medium">Tunggu komandan mengakhiri misi.</p>
               </div>
            ) : (
               <div>
                 <h2 className="text-lg font-black mb-6 text-rose-400 bg-rose-50 py-2 px-4 rounded-full inline-block">Pertanyaan {indeksSoal + 1} / {roomData.soal.length}</h2>
                 <p className="mb-8 text-2xl font-bold text-gray-700">{roomData.soal[indeksSoal]?.pertanyaan}</p>
                 <div className="grid grid-cols-2 gap-5">
                   {roomData.soal[indeksSoal]?.opsi.map((opsi, idx) => (
                     <button key={idx} onClick={() => jawabSoal(opsi)} className="bg-[#f4f7fe] hover:bg-white text-indigo-500 p-6 rounded-3xl font-black active:scale-90 transition-all shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] text-xl border-2 border-transparent hover:border-indigo-100">
                       {opsi}
                     </button>
                   ))}
                 </div>
               </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}