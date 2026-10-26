"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [nama, setNama] = useState("");
  const router = useRouter();

  const handleMasuk = (e) => {
    e.preventDefault();
    if (nama.trim() !== "") {
      localStorage.setItem("nama_peserta", nama);
      router.push("/lobby");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Petualangan Matematika</h1>
        <p className="text-gray-500 mb-6">Masukkan namamu untuk memulai misi!</p>
        
        <form onSubmit={handleMasuk} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Ketik nama panggilan..."
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black"
            maxLength={12}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
          >
            MASUK
          </button>
        </form>
      </div>
    </main>
  );
}
