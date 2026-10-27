// lab-matematika-mps/mediapembelajarangame/app/materi/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Shapes, CheckCircle2 } from "lucide-react";
import BackgroundCanvas from "../../components/BackgroundCanvas";

export default function HalamanMateri() {
  const router = useRouter();
  const [temaBg, setTemaBg] = useState("galaxy");
  const [particlesEnabled, setParticlesEnabled] = useState(true);

  useEffect(() => {
    const tema = localStorage.getItem("tema_bg") || "galaxy";
    setTemaBg(tema);
    setParticlesEnabled(localStorage.getItem("particlesEnabled") !== "false");
  }, []);

  // DUMMY DATA MATERI CIRI-CIRI BANGUN DATAR
  const daftarMateri = [
    {
      nama: "Persegi",
      ikon: "⬛",
      ciri: [
        "Memiliki 4 sisi yang sama panjang",
        "Memiliki 4 sudut siku-siku (90°)",
        "Memiliki 4 sumbu simetri putar dan lipat"
      ]
    },
    {
      nama: "Persegi Panjang",
      ikon: "▭",
      ciri: [
        "Memiliki 4 sisi (sisi sejajar sama panjang)",
        "Memiliki 4 sudut siku-siku (90°)",
        "Memiliki 2 sumbu simetri lipat"
      ]
    },
    {
      nama: "Segitiga",
      ikon: "🔺",
      ciri: [
        "Memiliki 3 sisi lurus",
        "Memiliki 3 titik sudut",
        "Jumlah ketiga sudutnya selalu 180°"
      ]
    },
    {
      nama: "Lingkaran",
      ikon: "⚪",
      ciri: [
        "Memiliki 1 sisi lengkung",
        "Tidak memiliki titik sudut",
        "Memiliki simetri lipat dan simetri putar tak terhingga"
      ]
    },
    {
      nama: "Belah Ketupat",
      ikon: "🔷",
      ciri: [
        "Memiliki 4 sisi sama panjang",
        "Sudut yang berhadapan sama besar",
        "Kedua diagonalnya saling tegak lurus"
      ]
    }
  ];

  return (
    <main className={`theme-${temaBg} min-h-screen relative flex flex-col justify-between p-6 font-sans text-[var(--text-main)] select-none`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .theme-galaxy { --bg-top: #0a0a1a; --bg-bottom: #1a0b2e; --primary: #00f3ff; --secondary: #b900ff; --text-main: #ffffff; --text-muted: #a0a0b8; --glass-bg: rgba(20, 20, 40, 0.6); --glass-border: rgba(0, 243, 255, 0.2); --glow-shadow: 0 0 20px rgba(0, 243, 255, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-sky { --bg-top: #ffe5d9; --bg-bottom: #ffcad4; --primary: #f28482; --secondary: #84a59d; --text-main: #2b2d42; --text-muted: #5c677d; --glass-bg: rgba(255, 255, 255, 0.65); --glass-border: rgba(242, 132, 130, 0.3); --glow-shadow: 0 10px 25px rgba(242, 132, 130, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .theme-ocean { --bg-top: #001220; --bg-bottom: #004d7a; --primary: #00d4ff; --secondary: #00ff88; --text-main: #ffffff; --text-muted: #b3e5fc; --glass-bg: rgba(0, 30, 60, 0.65); --glass-border: rgba(0, 212, 255, 0.3); --glow-shadow: 0 0 20px rgba(0, 212, 255, 0.4); background: linear-gradient(135deg, var(--bg-top), var(--bg-bottom)); }
        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 1.5rem; }
        .glass-card { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); transition: all 0.3s ease; }
        .glass-card:hover { transform: translateY(-3px); border-color: var(--primary); box-shadow: var(--glow-shadow); }
        .text-gradient { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      <BackgroundCanvas tema={temaBg} particlesEnabled={particlesEnabled} />

      {/* TOMBOL KEMBALI & HEADER */}
      <div className="max-w-4xl mx-auto w-full z-10 relative mb-6">
        <button 
          onClick={() => router.push("/dashboard")} 
          className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold hover:border-[var(--primary)] text-[var(--text-main)] transition-all mb-4"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>

        <div className="glass-panel p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center border border-[var(--primary)]/40">
            <BookOpen size={32} className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gradient">Ciri-Ciri Bangun Datar</h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">Rangkuman konsep dasar bangun datar untuk persiapan TKA</p>
          </div>
        </div>
      </div>

      {/* DAFTAR MATERI */}
      <div className="max-w-4xl mx-auto w-full z-10 relative grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {daftarMateri.map((item, index) => (
          <div key={index} className="glass-panel p-5 glass-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
              <span className="text-3xl">{item.ikon}</span>
              <h3 className="text-lg font-black text-[var(--primary)]">{item.nama}</h3>
            </div>
            <ul className="space-y-2 text-xs text-[var(--text-main)] font-medium">
              {item.ciri.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <footer className="w-full text-center py-3 bg-transparent z-10 relative">
        <p className="font-bold text-xs text-gradient">Berakhlak Mulia dan Berprestasi</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">&copy; 2026 Mugeb Primary School (SD Muhammadiyah 1 GKB)</p>
      </footer>
    </main>
  );
}
