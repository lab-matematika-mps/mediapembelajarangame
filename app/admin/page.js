"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Database, PlusCircle, Trash2, Edit3, Save, X, FileText, Layers, BarChart3, CheckCircle2, AlertCircle } from "lucide-react";

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
    <main className="min-h-screen relative overflow-hidden font-sans bg-[#0a0a1a] text-white p-6 select-none">
      
      {/* CSS STYLE UNTUK GLASSMORPHISM & THEME ADMIN */}
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --primary: #00f3ff;
          --glass-bg: rgba(20, 20, 40, 0.6);
          --glass-border: rgba(0, 243, 255, 0.2);
          --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
        }
        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: white;
          transition: all 0.3s;
        }
        .glass-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(0, 243, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
        }
        .glass-btn {
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          color: white;
          transition: all 0.3s ease;
        }
        .glass-btn:hover {
          border-color: var(--primary);
          box-shadow: var(--glow-shadow);
        }
        .text-gradient {
          background: linear-gradient(to right, #00f3ff, #b900ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}} />

      {/* BACKGROUND EFEK NEON */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER PANEL */}
        <div className="glass-panel p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00f3ff]/20 flex items-center justify-center border border-[#00f3ff]/30">
              <Database size={24} className="text-[#00f3ff]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gradient">Admin Panel: Bank Soal</h1>
              <p className="text-sm text-gray-400">Kelola dan unggah materi latihan TKA</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 text-[#00f3ff] border border-cyan-500/30">
            {daftarSoal.length} Soal Tersimpan
          </span>
        </div>

        {/* INPUT BANK SOAL */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-300">
            <PlusCircle size={22}/> Input Bulk Soal (JSON)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block font-bold text-sm text-gray-300 mb-2 flex items-center gap-2">
                <Layers size={16} className="text-[#00f3ff]" /> Materi
              </label>
              <select 
                value={materi} 
                onChange={(e) => setMateri(e.target.value)} 
                className="w-full p-4 rounded-xl glass-input font-medium cursor-pointer"
              >
                <option value="Ciri-ciri Bangun Datar" className="bg-slate-900 text-white">Ciri-ciri Bangun Datar</option>
                <option value="Luas Bangun Datar" className="bg-slate-900 text-white">Luas Bangun Datar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-sm text-gray-300 mb-2 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#00f3ff]" /> Tingkat Kesulitan
              </label>
              <select 
                value={tingkat} 
                onChange={(e) => setTingkat(e.target.value)} 
                className="w-full p-4 rounded-xl glass-input font-medium cursor-pointer"
              >
                <option value="Mudah" className="bg-slate-900 text-white">Mudah</option>
                <option value="Sedang" className="bg-slate-900 text-white">Sedang</option>
                <option value="Sulit" className="bg-slate-900 text-white">Sulit</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-bold text-sm text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-[#00f3ff]" /> Paste JSON Soal
            </label>
            <textarea 
              rows="8" 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              className="w-full p-4 rounded-xl glass-input font-mono text-sm leading-relaxed" 
              placeholder="Paste format JSON array [ {...} ] di sini..."
            ></textarea>
          </div>

          {status && (
            <div className={`p-4 rounded-xl mb-6 font-bold text-sm flex items-center gap-2 ${
              status.includes("✅") ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
              status.includes("❌") ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : 
              "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            }`}>
              {status.includes("✅") ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {status}
            </div>
          )}

          <button 
            onClick={simpanSoalBaru} 
            className="w-full bg-[#00f3ff] hover:bg-[#00d0ff] text-black font-black py-4 rounded-xl text-lg transition-transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          >
            <Save size={20} /> Simpan Bulk Soal
          </button>
        </div>

        {/* DAFTAR SOAL TERSIMPAN */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-300">
            <Database size={22}/> Daftar Soal Tersimpan
          </h2>

          <div className="space-y-4">
            {daftarSoal.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic bg-white/5 rounded-xl border border-white/10">
                Belum ada soal tersimpan di bank soal.
              </div>
            ) : (
              daftarSoal.map(soal => (
                <div key={soal.id} className="glass-panel p-5 border-white/10 flex flex-col md:flex-row justify-between items-start gap-4 hover:border-cyan-500/40 transition-colors">
                  
                  {editId === soal.id ? (
                    <div className="w-full space-y-3">
                      <textarea 
                        rows="6" 
                        value={editJson} 
                        onChange={e => setEditJson(e.target.value)} 
                        className="w-full p-3 rounded-xl glass-input font-mono text-sm"
                      ></textarea>
                      <div className="flex gap-2">
                        <button onClick={simpanEdit} className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                          <Save size={16}/> Simpan Edit
                        </button>
                        <button onClick={() => setEditId(null)} className="glass-btn px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                          <X size={16}/> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-cyan-500/20 text-[#00f3ff] px-3 py-1 rounded-full border border-cyan-500/30 font-bold">
                            {soal.materi}
                          </span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-bold">
                            {soal.tingkat}
                          </span>
                        </div>
                        <p className="font-bold text-lg text-white pt-1">{soal.pertanyaan}</p>
                        <p className="text-sm text-emerald-400 font-medium">
                          Jawaban Benar: <span className="font-bold">{soal.jawabanBenar}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 self-end md:self-start">
                        <button onClick={() => mulaiEdit(soal)} className="glass-btn p-2.5 rounded-xl text-amber-400 hover:border-amber-400 flex items-center gap-1 font-bold text-xs">
                          <Edit3 size={16}/> Edit
                        </button>
                        <button onClick={() => hapusSoal(soal.id)} className="glass-btn p-2.5 rounded-xl text-rose-400 hover:border-rose-400 flex items-center gap-1 font-bold text-xs">
                          <Trash2 size={16}/> Hapus
                        </button>
                      </div>
                    </>
                  )}

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}