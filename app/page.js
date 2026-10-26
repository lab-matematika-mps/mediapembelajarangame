      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          svg animate,
          svg animateTransform {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  const [nama, setNama] = useState("");
  const [tema, setTema] = useState("Luar Angkasa");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Fungsi tombol Mulai tetap sama: validasi nama, simpan pilihan, lalu ke lobby.
  const masukLobby = () => {
    if (!nama.trim()) return alert("Masukkan nama komandan!");
    localStorage.setItem("nama_peserta", nama);
    localStorage.setItem("tema_bg", tema);
    router.push("/lobby");
  };

  // Menutup dropdown jika pengguna mengeklik area di luar dropdown.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const temaOptions = [
    { id: "Luar Angkasa", label: "Luar Angkasa", icon: Rocket, color: "text-indigo-500" },
    { id: "Samudra", label: "Samudra Dalam", icon: Waves, color: "text-blue-500" },
    { id: "City", label: "Clay City", icon: Building2, color: "text-slate-500" },
  ];

  const TemaIcon = temaOptions.find((t) => t.id === tema)?.icon;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 font-sans text-gray-800 lg:justify-start lg:px-16">
      {/* Latar low-poly animasi; nilai tema tetap berasal dari dropdown yang sama. */}
      <PolyBridgeBackground tema={tema} />

      <div className="relative z-10 m-4 w-full max-w-md rounded-[36px] border-4 border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(5,20,35,0.35)] backdrop-blur-xl sm:p-10">
        <h1 className="mb-2 flex items-center justify-center gap-3 text-4xl font-black text-indigo-500">
          LabMath <Gamepad2 size={36} className="text-indigo-500 stroke-[2.5]" />
        </h1>
        <p className="mb-8 font-bold text-gray-500">Masuk ke Arena Pembelajaran</p>

        {/* Input nama komandan */}
        <div className="mb-6 text-left">
          <label className="mb-2 ml-2 block font-bold text-gray-600">Nama Komandan</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && masukLobby()}
            className="w-full rounded-3xl border-none bg-[#f4f7fe] p-4 font-bold text-gray-700 shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_#ffffff] outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-200"
            placeholder="Contoh: Budi Geming"
          />
        </div>

        {/* Dropdown tema tetap bisa memilih tiga dunia */}
        <div className="relative mb-8 text-left" ref={dropdownRef}>
          <label className="mb-2 ml-2 block font-bold text-gray-600">Pilih Dunia</label>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center justify-between rounded-3xl bg-[#f4f7fe] p-4 text-left font-bold text-gray-700 shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_#ffffff] transition-all hover:shadow-[inset_7px_7px_13px_#c3cce0,inset_-7px_-7px_13px_#ffffff]"
          >
            <span className="flex items-center gap-3">
              {TemaIcon && <TemaIcon size={22} className="text-indigo-500 stroke-[2.5]" />}
              {temaOptions.find((t) => t.id === tema)?.label}
            </span>
            <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <div
            role="listbox"
            className={`absolute left-0 right-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white/95 shadow-xl backdrop-blur-md transition-all duration-200 origin-top ${
              isDropdownOpen ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0"
            }`}
          >
            {temaOptions.map((opsi) => {
              const Icon = opsi.icon;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={tema === opsi.id}
                  key={opsi.id}
                  onClick={() => {
                    setTema(opsi.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 p-4 text-left font-bold transition-colors hover:bg-[#f4f7fe] ${
                    tema === opsi.id ? "bg-[#f4f7fe]/70 text-indigo-600" : "text-gray-600"
                  }`}
                >
                  <Icon size={22} className={`${tema === opsi.id ? "text-indigo-600" : opsi.color} stroke-[2.5]`} />
                  {opsi.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fungsi tombol Mulai tetap menuju /lobby */}
        <button
          type="button"
          onClick={masukLobby}
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-500 py-4 text-lg font-black text-white shadow-[0_8px_0_#3730a3,0_15px_25px_rgba(49,46,129,0.25)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600 active:translate-y-1 active:shadow-[0_3px_0_#3730a3]"
        >
          <Rocket size={24} className="stroke-[2.5]" /> MULAI PETUALANGAN
        </button>
      </div>
    </main>
  );