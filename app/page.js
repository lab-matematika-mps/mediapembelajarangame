"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Rocket, Waves, Building2, ChevronDown } from "lucide-react";

export default function Login() {
  const [nama, setNama] = useState("");
  const [tema, setTema] = useState("Luar Angkasa");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const masukLobby = () => {
    if (!nama) return alert("Masukkan nama komandan!");
    localStorage.setItem("nama_peserta", nama);
    localStorage.setItem("tema_bg", tema);
    router.push("/lobby");
  };

  // Menutup dropdown jika user klik di luar area dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Data tema untuk custom dropdown
  const temaOptions = [
    { id: "Luar Angkasa", label: "Luar Angkasa", icon: Rocket, color: "text-indigo-500" },
    { id: "Samudra", label: "Samudra Dalam", icon: Waves, color: "text-blue-500" },
    { id: "City", label: "Clay City", icon: Building2, color: "text-slate-500" },
  ];

  const TemaIcon = temaOptions.find((t) => t.id === tema)?.icon;

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f4f7fe] font-sans text-gray-800">
      {/* Background Animasi Sederhana */}
      <div className={`absolute inset-0 z-0 transition-colors duration-700 ${
        tema === "Luar Angkasa" ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-black" :
        tema === "Samudra" ? "bg-gradient-to-b from-cyan-300 via-blue-500 to-blue-900" :
        "bg-gradient-to-t from-orange-300 via-pink-200 to-blue-200"
      }`}>
        <div className="absolute w-full h-full opacity-50 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-[40px] shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.8)] w-full max-w-md text-center border-4 border-white">
        
        {/* Header dengan Unicolor Icon */}
        <h1 className="text-4xl font-black text-indigo-500 mb-2 flex items-center justify-center gap-3">
          LabMath <Gamepad2 size={36} className="text-indigo-500 stroke-[2.5]" />
        </h1>
        <p className="text-gray-500 font-bold mb-8">Masuk ke Arena Pembelajaran</p>

        {/* Input Nama */}
        <div className="mb-6 text-left">
          <label className="block font-bold text-gray-600 mb-2 ml-2">Nama Komandan</label>
          <input 
            type="text" 
            value={nama} 
            onChange={(e) => setNama(e.target.value)}
            className="w-full p-4 rounded-3xl bg-[#f4f7fe] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] border-none outline-none font-bold text-gray-700 focus:shadow-[inset_8px_8px_16px_#c3cce0,inset_-8px_-8px_16px_#ffffff] transition-all placeholder:text-gray-400"
            placeholder="Contoh: Budi Geming"
          />
        </div>

        {/* Custom Dropdown Tema dengan Unicolor Icons */}
        <div className="mb-8 text-left relative" ref={dropdownRef}>
          <label className="block font-bold text-gray-600 mb-2 ml-2">Pilih Dunia</label>
          
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full p-4 rounded-3xl bg-[#f4f7fe] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] cursor-pointer flex items-center justify-between font-bold text-gray-700 transition-all hover:shadow-[inset_8px_8px_16px_#c3cce0,inset_-8px_-8px_16px_#ffffff]"
          >
            <div className="flex items-center gap-3">
              {TemaIcon && <TemaIcon size={22} className="text-indigo-500 stroke-[2.5]" />}
              <span>{temaOptions.find(t => t.id === tema)?.label}</span>
            </div>
            <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Opsi Dropdown */}
          <div className={`absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden z-20 border-2 border-gray-100 transition-all duration-300 origin-top ${
            isDropdownOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"
          }`}>
            {temaOptions.map((opsi) => {
              const Icon = opsi.icon;
              return (
                <div 
                  key={opsi.id}
                  onClick={() => {
                    setTema(opsi.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[#f4f7fe] transition-colors font-bold ${
                    tema === opsi.id ? "text-indigo-600 bg-[#f4f7fe]/50" : "text-gray-600"
                  }`}
                >
                  <Icon size={22} className={`${tema === opsi.id ? "text-indigo-600" : opsi.color} stroke-[2.5]`} />
                  {opsi.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tombol Mulai */}
        <button 
          onClick={masukLobby}
          className="w-full bg-indigo-400 hover:bg-indigo-500 text-white py-4 rounded-3xl font-black text-lg active:scale-90 transition-all shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)] flex items-center justify-center gap-2"
        >
          <Rocket size={24} className="stroke-[2.5]" /> MULAI PETUALANGAN
        </button>
      </div>
    </main>
  );
}