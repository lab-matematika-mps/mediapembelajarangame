"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminPage() {
  const [materi, setMateri] = useState("Ciri-ciri Bangun Datar");
  const [tingkat, setTingkat] = useState("Mudah");
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [daftarSoal, setDaftarSoal] = useState([]);
  
  const [editId, setEditId] = useState(null);
  const [editJson, setEditJson] = useState("");

  const muatDataSoal = async () => {
    const querySnapshot = await getDocs(collection(db, "daftar_soal"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDaftarSoal(data);
  };

  useEffect(() => {
    muatDataSoal();
  }, []);

  const simpanSoalBaru = async () => {
    try {
      setStatus("Memproses...");
      const soalArray = JSON.parse(jsonInput);
      
      if (!Array.isArray(soalArray)) throw new Error("Format JSON harus diawali [ dan diakhiri ].");

      // Looping untuk memecah bulk JSON dan menyimpannya per soal
      for (let item of soalArray) {
        // Mengubah format {A, B, C, D} menjadi array ["Opsi 1", "Opsi 2", ...]
        const opsiArray = Object.values(item.pilihan); 
        // Mengambil teks jawaban benar berdasarkan kunci (misal: "C")
        const jawabanTeks = item.pilihan[item.jawaban]; 

        await addDoc(collection(db, "daftar_soal"), {
          materi: materi,
          tingkat: tingkat,
          pertanyaan: item.soal, // Mengambil teks dari key "soal"
          opsi: opsiArray,
          jawabanBenar: jawabanTeks
        });
      }

      setStatus("✅ Berhasil menyimpan semua soal ke bank soal!");
      setJsonInput("");
      muatDataSoal();
    } catch (error) {
      setStatus(`❌ Gagal: Pastikan format JSON benar. Error: ${error.message}`);
    }
  };

  const hapusSoal = async (id) => {
    if(confirm("Yakin ingin menghapus soal ini?")) {
      await deleteDoc(doc(db, "daftar_soal", id));
      muatDataSoal();
    }
  };

  const mulaiEdit = (soal) => {
    setEditId(soal.id);
    setEditJson(JSON.stringify({
      pertanyaan: soal.pertanyaan,
      opsi: soal.opsi,
      jawabanBenar: soal.jawabanBenar
    }, null, 2));
  };

  const simpanEdit = async () => {
    try {
      const dataBaru = JSON.parse(editJson);
      await updateDoc(doc(db, "daftar_soal", editId), dataBaru);
      setEditId(null);
      muatDataSoal();
    } catch(err) {
      alert("Format JSON tidak valid!");
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold mb-6 text-blue-600">Admin: Input Bank Soal</h1>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-bold mb-2">Materi</label>
              <select value={materi} onChange={(e) => setMateri(e.target.value)} className="w-full border p-2 rounded">
                <option value="Ciri-ciri Bangun Datar">Ciri-ciri Bangun Datar</option>
                <option value="Luas Bangun Datar">Luas Bangun Datar</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-2">Tingkat Kesulitan</label>
              <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} className="w-full border p-2 rounded">
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2">Paste JSON Soal</label>
            <textarea rows="10" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full border p-3 rounded font-mono text-sm bg-gray-50" placeholder="Paste format JSON yang banyak di sini..."></textarea>
          </div>
          {status && <p className="mb-4 font-bold text-blue-600">{status}</p>}
          <button onClick={simpanSoalBaru} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full">Simpan Bulk Soal</button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-4">Daftar Soal Tersimpan</h2>
          <div className="space-y-4">
            {daftarSoal.map(soal => (
              <div key={soal.id} className="border p-4 rounded bg-gray-50 flex justify-between items-start">
                {editId === soal.id ? (
                  <div className="w-full">
                    <textarea rows="6" value={editJson} onChange={e => setEditJson(e.target.value)} className="w-full border p-2 mb-2 font-mono text-sm"></textarea>
                    <button onClick={simpanEdit} className="bg-green-500 text-white px-4 py-1 rounded mr-2">Simpan Edit</button>
                    <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-4 py-1 rounded">Batal</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">{soal.materi}</span>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{soal.tingkat}</span>
                      <p className="mt-2 font-bold">{soal.pertanyaan}</p>
                      <p className="text-sm text-gray-600">Jawaban: {soal.jawabanBenar}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => mulaiEdit(soal)} className="bg-yellow-400 px-3 py-1 rounded font-bold text-sm">Edit</button>
                      <button onClick={() => hapusSoal(soal.id)} className="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">Hapus</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}