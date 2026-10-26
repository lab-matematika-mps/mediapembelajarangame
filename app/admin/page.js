"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminPage() {
  const [judul, setJudul] = useState("");
  const [tingkat, setTingkat] = useState("Mudah");
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");

  const simpanSoal = async () => {
    try {
      setStatus("Memproses...");
      // Parsing teks JSON dari textarea menjadi objek JavaScript
      const soalArray = JSON.parse(jsonInput);
      
      // Validasi sederhana
      if (!Array.isArray(soalArray)) {
        throw new Error("Format JSON harus berupa Array (diawali [ dan diakhiri ]).");
      }

      // Simpan ke Firestore
      await addDoc(collection(db, "bank_soal"), {
        judul_kategori: judul,
        tingkatan: tingkat,
        daftar_soal: soalArray,
        dibuat_pada: new Date()
      });

      setStatus("✅ Berhasil menyimpan soal ke database!");
      setJudul("");
      setJsonInput("");
    } catch (error) {
      setStatus(`❌ Gagal: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-black">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">Panel Admin: Input Bank Soal</h1>
        
        <div className="mb-4">
          <label className="block font-bold mb-2">Nama/Kategori Soal</label>
          <input 
            type="text" 
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Matematika Bab Pecahan"
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">Tingkat Kesulitan</label>
          <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} className="w-full border p-3 rounded-lg">
            <option value="Mudah">Mudah</option>
            <option value="Sedang">Sedang</option>
            <option value="Sulit">Sulit</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">Masukkan Soal (Format JSON)</label>
          <p className="text-sm text-gray-500 mb-2">
            Contoh format: <br/>
            <code>{`[{"pertanyaan": "1+1?", "opsi": ["1","2","3","4"], "jawabanBenar": "2"}]`}</code>
          </p>
          <textarea 
            rows="10"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON soal di sini..."
            className="w-full border p-3 rounded-lg font-mono text-sm bg-gray-50"
          ></textarea>
        </div>

        {status && <div className="mb-4 font-bold text-red-500">{status}</div>}

        <button 
          onClick={simpanSoal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full"
        >
          Simpan ke Database
        </button>
      </div>
    </main>
  );
}