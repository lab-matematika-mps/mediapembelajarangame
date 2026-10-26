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
    if (!nama) {
      router.push("/");
      return;
    }
    setNamaPeserta(nama);

    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomData);
    });

    return () => unsubscribe();
  }, [router]);

  const buatRoomBaru = async () => {
    try {
      const daftarSoal = [
        { pertanyaan: "Berapa FPB dari 12 dan 18?", opsi: ["2", "4", "6", "8"], jawabanBenar: "6" },
        { pertanyaan: "Hasil dari 7 x 8 adalah?", opsi: ["54", "56", "64", "48"], jawabanBenar: "56" },
        { pertanyaan: "Akar kuadrat dari 144 adalah?", opsi: ["10", "12", "14", "16"], jawabanBenar: "12" }
      ];

      const docRef = await addDoc(collection(db, "rooms"), {
        nama_room: `Arena ${Math.floor(Math.random() * 1000)}`,
        status: "waiting",
        host: namaPeserta,
        soal: daftarSoal,
        soal_aktif: 0
      });
      router.push(`/room/${docRef.id}`);
    } catch (error) {
      alert("Database belum merespons. Pastikan kode config Firebase sudah diisi.");
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-black">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Lobby Petualangan</h1>
            <p className="text-gray-500">Halo komandan, {namaPeserta}!</p>
          </div>
          <button 
            onClick={buatRoomBaru}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md"
          >
            + Buat Arena
          </button>
        </header>

        <h2 className="text-xl font-bold mb-4">Arena yang Tersedia:</h2>
        
        {rooms.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            Belum ada arena yang terbuka.
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{room.nama_room}</h3>
                  <p className="text-sm text-gray-500">Host: {room.host}</p>
                </div>
                <button 
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md"
                >
                  JOIN
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
