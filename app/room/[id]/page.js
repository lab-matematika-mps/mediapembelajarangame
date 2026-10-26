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
  
  // State lokal untuk siswa melacak soal
  const [indeksSoal, setIndeksSoal] = useState(0);
  const [isSelesai, setIsSelesai] = useState(false);

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) {
      router.push("/");
      return;
    }
    setNamaPeserta(nama);

    const playerRef = doc(db, `rooms/${id}/players`, nama);
    setDoc(playerRef, { nama, skor: 0, status: "belum" }, { merge: true });

    const roomRef = doc(db, "rooms", id);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
      else router.push("/lobby");
    });

    const playersRef = collection(db, `rooms/${id}/players`);
    const qPlayers = query(playersRef, orderBy("skor", "desc"));
    const unsubPlayers = onSnapshot(qPlayers, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => doc.data()));
    });

    return () => { unsubRoom(); unsubPlayers(); };
  }, [id, router]);

  const mulaiGame = async () => {
    await updateDoc(doc(db, "rooms", id), { status: "playing" });
  };

  const akhiriGame = async () => {
    await updateDoc(doc(db, "rooms", id), { status: "finished" });
  };

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
    <main className="min-h-screen p-6 bg-gradient-to-b from-blue-500 to-cyan-400 text-white flex flex-col items-center justify-center">
      <div className="bg-white text-black p-8 rounded-2xl shadow-xl w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-2">{roomData.nama_room}</h1>
        <p className="mb-6 text-gray-500">Status: {roomData.status}</p>

        {roomData.status === "waiting" && (
          <div>
            <h2 className="text-xl mb-4 animate-pulse">Menunggu komandan memulai misi...</h2>
            {isHost && (
              <button onClick={mulaiGame} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg w-full shadow-md">
                MULAI PERMAINAN!
              </button>
            )}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {players.map((p, idx) => (
                <span key={idx} className="bg-gray-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">{p.nama}</span>
              ))}
            </div>
          </div>
        )}

        {roomData.status === "playing" && (
          <div>
            {isHost ? (
              <div className="mt-4 w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-800">🏆 Live Leaderboard 🏆</h2>
                <div className="bg-blue-50 p-4 rounded-xl shadow-inner max-h-80 overflow-y-auto mb-4">
                  {players.map((p, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-4 mb-3 rounded-xl shadow-sm border-l-8 border-blue-500">
                      <span className="font-bold text-xl">{index + 1}. {p.nama} {p.status === "selesai" && "✅"}</span>
                      <span className="font-black text-blue-600 text-2xl">{p.skor} Pts</span>
                    </div>
                  ))}
                </div>
                <button onClick={akhiriGame} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold w-full shadow-md">
                  Akhiri Permainan Sekarang
                </button>
              </div>
            ) : isSelesai ? (
              <div className="py-8">
                <h2 className="text-2xl font-bold text-green-600 mb-4">Kerja Bagus!</h2>
                <p>Kamu sudah menjawab semua soal. Tunggu komandan mengakhiri misi untuk melihat klasemen akhir.</p>
                <p className="mt-4 font-bold text-xl text-gray-700">Skor Sementara: <span className="text-blue-600 text-2xl">{skor}</span></p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4 text-red-600">Pertanyaan {indeksSoal + 1} / {roomData.soal.length}</h2>
                <p className="mb-6 text-2xl font-medium">{roomData.soal[indeksSoal]?.pertanyaan}</p>
                <div className="grid grid-cols-2 gap-4">
                  {roomData.soal[indeksSoal]?.opsi.map((opsi, idx) => (
                    <button key={idx} onClick={() => jawabSoal(opsi)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-6 rounded-xl font-bold active:scale-95 transition-all text-xl shadow-md">
                      {opsi}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {roomData.status === "finished" && (
          <div className="mt-4 w-full">
            <h2 className="text-3xl font-bold text-green-600 mb-6">🏆 KLASEMEN AKHIR 🏆</h2>
            <div className="bg-yellow-50 p-4 rounded-xl shadow-inner max-h-80 overflow-y-auto mb-6">
              {players.map((p, index) => (
                <div key={index} className="flex justify-between items-center bg-white p-4 mb-3 rounded-xl shadow-sm border-l-8 border-yellow-500">
                  <span className="font-bold text-xl">{index + 1}. {p.nama}</span>
                  <span className="font-black text-yellow-600 text-2xl">{p.skor} Pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/lobby")} className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-bold w-full shadow-md">
              ⬅ Kembali ke Lobby
            </button>
          </div>
        )}
      </div>
    </main>
  );
}