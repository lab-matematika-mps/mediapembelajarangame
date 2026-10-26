"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [namaPeserta, setNamaPeserta] = useState("");
  const router = useRouter();

  // State untuk generate soal
  const [genMateri, setGenMateri] = useState("Ciri-ciri Bangun Datar");
  const [genTingkat, setGenTingkat] = useState("Mudah");
  const [genJumlah, setGenJumlah] = useState(5);

  useEffect(() => {
    const nama = localStorage.getItem("nama_peserta");
    if (!nama) {
      router.push("/");
      return;
    }
    setNamaPeserta(nama);

    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [router]);

  const generateArena = async () => {
    try {
      // 1. Ambil semua soal dari materi yang dipilih
      const qSoal = query(collection(db, "daftar_soal"), where("materi", "==", genMateri));
      const snapshot = await getDocs(qSoal);
      let bankSoal = snapshot.docs.map(d => d.data());

      // 2. Filter berdasarkan tingkat kesulitan yang dipilih host
      let targetTingkat = [];
      if (genTingkat === "Mudah") targetTingkat = ["Mudah"];
      else if (genTingkat === "Sedang") targetTingkat = ["Sedang"];
      else if (genTingkat === "Sulit") targetTingkat = ["Sulit"];
      else if (genTingkat === "Mudah-Sedang") targetTingkat = ["Mudah", "Sedang"];
      else if (genTingkat === "Sedang-Sulit") targetTingkat = ["Sedang", "Sulit"];
      else if (genTingkat === "Mudah-Sulit") targetTingkat = ["Mudah", "Sulit"];

      bankSoal = bankSoal.filter(soal => targetTingkat.includes(soal.tingkat));

      // 3. Validasi ketersediaan soal
      if (bankSoal.length < genJumlah) {
        alert(`Soal tidak cukup! Cuma ada ${bankSoal.length} soal untuk kriteria ini.`);
        return;
      }

      // 4. Acak soal (Shuffle) dan potong sesuai jumlah yang diminta
      bankSoal.sort(() => 0.5 - Math.random());
      const soalTerpilih = bankSoal.slice(0, parseInt(genJumlah));

      // 5. Buat Room
      const docRef = await addDoc(collection(db, "rooms"), {
        nama_room: `Arena ${Math.floor(Math.random() * 1000)}`,
        status: "waiting",
        host: namaPeserta,
        soal: soalTerpilih
      });
      router.push(`/room/${docRef.id}`);

    } catch (error) {
      alert("Gagal membuat arena. Pastikan database terkoneksi.");
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-black">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <header className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Lobby Petualangan</h1>
            <p className="text-gray-500">Halo komandan, {namaPeserta}!</p>
          </div>
        </header>

        {/* Panel Generate Arena untuk Host */}
        <div className="bg-blue-50 p-6 rounded-xl shadow border border-blue-100">
          <h2 className="text-xl font-bold mb-4 text-blue-800">⚙️ Buat Arena Baru</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-1">Materi</label>
              <select value={genMateri} onChange={e => setGenMateri(e.target.value)} className="w-full p-2 rounded border">
                <option value="Ciri-ciri Bangun Datar">Ciri-ciri Bangun Datar</option>
                <option value="Luas Bangun Datar">Luas Bangun Datar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Tingkatan</label>
              <select value={genTingkat} onChange={e => setGenTingkat(e.target.value)} className="w-full p-2 rounded border">
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
                <option value="Mudah-Sedang">Mudah & Sedang</option>
                <option value="Sedang-Sulit">Sedang & Sulit</option>
                <option value="Mudah-Sulit">Mudah & Sulit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Jumlah Soal</label>
              <input type="number" min="1" value={genJumlah} onChange={e => setGenJumlah(e.target.value)} className="w-full p-2 rounded border" />
            </div>
          </div>
          <button onClick={generateArena} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold shadow-md">
            + Generate & Buka Arena
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Arena yang Tersedia (Untuk Siswa):</h2>
          {rooms.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">Belum ada arena yang terbuka.</div>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{room.nama_room}</h3>
                    <p className="text-sm text-gray-500">Host: {room.host} | {room.soal?.length || 0} Soal</p>
                  </div>
                  <button onClick={() => router.push(`/room/${room.id}`)} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md">
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