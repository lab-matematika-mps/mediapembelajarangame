"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [namaPeserta, setNamaPeserta] = useState("");
  const router = useRouter();

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) return router.push("/");
    setNamaPeserta(nama);

    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [router]);

  const buatArenaBaru = async () => {
    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        nama_room: `Arena ${Math.floor(Math.random() * 1000)}`,
        status: "setup", // Status awal setup agar tidak muncul di siswa dulu
        host: namaPeserta
      });
      router.push(`/room/${docRef.id}`);
    } catch (error) {
      alert("Gagal membuat arena.");
    }
  };

  return (
    <main className="min-h-screen p-6 bg-[#f4f7fe] text-gray-800 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="bg-white p-6 rounded-3xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-indigo-400">Lobby Petualangan</h1>
            <p className="text-gray-500 font-medium">Halo, {namaPeserta}!</p>
          </div>
          <button 
            onClick={buatArenaBaru} 
            className="bg-indigo-400 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold active:scale-90 transition-all shadow-[inset_4px_4px_8px_rgba(255,255,255,0.3),4px_4px_8px_rgba(0,0,0,0.15)]"
          >
            + Buka Arena
          </button>
        </header>

        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-700">Arena yang Terbuka:</h2>
          {rooms.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] text-center text-gray-400 font-medium">
              Belum ada arena yang siap dimainkan.
            </div>
          ) : (
            <div className="grid gap-5">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white p-5 rounded-3xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] flex justify-between items-center border-2 border-transparent hover:border-indigo-100 transition-all">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{room.nama_room}</h3>
                    <p className="text-sm text-gray-500">Host: {room.host} | Tema: {room.tema}</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/room/${room.id}`)} 
                    className="bg-emerald-400 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold active:scale-90 transition-all shadow-[inset_4px_4px_8px_rgba(255,255,255,0.4),4px_4px_8px_rgba(0,0,0,0.15)]"
                  >
                    JOIN
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}