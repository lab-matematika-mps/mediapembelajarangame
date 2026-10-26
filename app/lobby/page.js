"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [temaBg, setTemaBg] = useState("City");
  const router = useRouter();

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    const tema = localStorage.getItem("tema_bg") || "City";
    if (!nama) return router.push("/");
    setNamaPeserta(nama);
    setTemaBg(tema);

    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [router]);

  const buatArenaBaru = async () => {
    const docRef = await addDoc(collection(db, "rooms"), {
      nama_room: `Arena ${Math.floor(Math.random() * 1000)}`,
      status: "setup", host: namaPeserta
    });
    router.push(`/room/${docRef.id}`);
  };

  return (
    <main className="min-h-screen relative overflow-hidden font-sans p-6 text-gray-800">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 z-[-1] transition-colors duration-1000 ${
        temaBg === "Luar Angkasa" ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-black" :
        temaBg === "Samudra" ? "bg-gradient-to-b from-cyan-300 via-blue-500 to-blue-900" :
        "bg-gradient-to-t from-orange-300 via-pink-200 to-blue-200"
      }`}>
         <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        <header className="bg-white/90 backdrop-blur-md p-6 rounded-[30px] shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.5)] flex justify-between items-center border-4 border-white">
          <div>
            <h1 className="text-2xl font-black text-indigo-500">Lobby Petualangan</h1>
            <p className="text-gray-500 font-bold">Siap beraksi, {namaPeserta}?</p>
          </div>
          <button onClick={buatArenaBaru} className="bg-emerald-400 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black active:scale-90 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.15)]">
            + Buka Arena (Guru)
          </button>
        </header>

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[30px] shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.5)] border-4 border-white">
          <h2 className="text-xl font-black mb-6 text-gray-700">Arena yang Terbuka (Siswa):</h2>
          {rooms.length === 0 ? (
            <div className="p-8 bg-[#f4f7fe] rounded-3xl shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] text-center text-gray-400 font-bold">
              Belum ada arena yang siap dimainkan.
            </div>
          ) : (
            <div className="grid gap-5">
              {rooms.map((room) => (
                <div key={room.id} className="bg-[#f4f7fe] p-5 rounded-3xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] flex justify-between items-center transition-all hover:scale-[1.02]">
                  <div>
                    <h3 className="font-black text-xl text-indigo-500">{room.nama_room}</h3>
                    <p className="text-sm text-gray-500 font-bold">Host: {room.host} | Tema: {room.tema}</p>
                  </div>
                  <button onClick={() => router.push(`/room/${room.id}`)} className="bg-indigo-400 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black active:scale-90 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.15)]">
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