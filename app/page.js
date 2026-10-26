"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Rocket, Waves, Building2, ChevronDown } from "lucide-react";

// --- KOMPONEN BACKGROUND ANIMASI LOW-POLY ---
const LowPolyBackground = ({ tema }) => {
  const polygons = useMemo(() => {
    // Palet warna disesuaikan dengan dropdown tema
    const palettes = {
      "Luar Angkasa": ["#111827", "#1e1b4b", "#312e81", "#4338ca", "#2e1065"],
      "Samudra": ["#083344", "#164e63", "#0e7490", "#0284c7", "#0ea5e9"],
      "City": ["#d6d3d1", "#a8a29e", "#fcd34d", "#fdba74", "#fb923c"], // Nuansa clay/tanah
    };
    
    const colors = palettes[tema] || palettes["Luar Angkasa"];
    const polys = [];
    const rows = 8;
    const cols = 12;
    const vertices = [];

    // 1. Buat titik (vertices) dengan sedikit pergeseran acak agar terlihat seperti permukaan tanah/organik
    for (let r = 0; r <= rows; r++) {
      const row = [];
      for (let c = 0; c <= cols; c++) {
        const jitterX = (Math.random() - 0.5) * 8; 
        const jitterY = (Math.random() - 0.5) * 8; 
        const x = (c / cols) * 100 + (c === 0 || c === cols ? 0 : jitterX);
        const y = (r / rows) * 100 + (r === 0 || r === rows ? 0 : jitterY);
        row.push({ x, y });
      }
      vertices.push(row);
    }

    // 2. Gabungkan titik menjadi segitiga (Polygon)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v1 = vertices[r][c];
        const v2 = vertices[r][c + 1];
        const v3 = vertices[r + 1][c];
        const v4 = vertices[r + 1][c + 1];

        polys.push({
          id: `${r}-${c}-1`,
          points: `${v1.x},${v1.y} ${v2.x},${v2.y} ${v3.x},${v3.y}`,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 4,
          duration: 3 + Math.random() * 4,
        });
        polys.push({
          id: `${r}-${c}-2`,
          points: `${v2.x},${v2.y} ${v4.x},${v4.y} ${v3.x},${v3.y}`,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 4,
          duration: 3 + Math.random() * 4,
        });
      }
    }
    return polys;
  }, [tema]); // Update warna & pola saat tema berganti

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900 transition-colors duration-1000">
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        style={{ animation: "pan-bg 25s infinite alternate ease-in-out" }}
      >
        {polygons.map((poly) => (
          <polygon
            key={poly.id}
            points={poly.points}
            fill={poly.color}
            stroke={poly.color}
            strokeWidth="0.1"
            className="poly-anim"
            style={{
              animationDelay: `${poly.delay}s`,
              animationDuration: `${poly.duration}s`,
            }}
          />
        ))}
      </svg>
      {/* CSS internal khusus untuk animasi pergerakan & cahaya background */}
      <style>{`
        .poly-anim {
          animation: poly-breathe infinite alternate ease-in-out;
        }
        @keyframes poly-breathe {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes pan-bg {
          0% { transform: scale(1.1) translate(0, 0); }
          50% { transform: scale(1.15) translate(-2%, 2%); }
          100% { transform: scale(1.1) translate(1%, -1%); }
        }
      `}</style>
    </div>
  );
};
// ----------------------------------------------

export default function Login() {
  const [nama, setNama] = useState("");
  const [tema, setTema] = useState("Luar Angkasa");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // FUNGSI UTAMA TIDAK DIUBAH SAMA SEKALI
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
      
      {/* Panggil Background Low Poly yang sudah dibuat di atas */}
      <LowPolyBackground tema={tema} />

      {/* Kotak UI Login (Kaca/Glassmorphism tetap dipertahankan) */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-[40px] shadow-[12px_12px_24px_rgba(0,0,0,0.1),-12px_-12px_24px_rgba(255,255,255,0.8)] w-full max-w-md text-center border-4 border-white">
        
        {/* Header */}
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

        {/* Custom Dropdown Tema */}
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