
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection, getDocs, query, where
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const MATERIAL = "Ciri-ciri Bangun Datar";
const POINTS = { mudah: 10, sedang: 20, sulit: 30 };
const LIMIT = 180;

const FALLBACK = [
  { pertanyaan: "Bangun datar yang memiliki 3 sisi adalah ...", opsi: ["Persegi", "Segitiga", "Lingkaran", "Persegi panjang"], jawabanBenar: "Segitiga" },
  { pertanyaan: "Persegi memiliki ... sisi sama panjang.", opsi: ["Dua", "Tiga", "Empat", "Lima"], jawabanBenar: "Empat" },
  { pertanyaan: "Bangun datar yang tidak memiliki sudut adalah ...", opsi: ["Segitiga", "Persegi", "Lingkaran", "Trapesium"], jawabanBenar: "Lingkaran" },
  { pertanyaan: "Persegi panjang memiliki ... pasang sisi berhadapan sama panjang.", opsi: ["Satu", "Dua", "Tiga", "Empat"], jawabanBenar: "Dua" },
  { pertanyaan: "Segitiga sama sisi memiliki ... sisi sama panjang.", opsi: ["Satu", "Dua", "Tiga", "Empat"], jawabanBenar: "Tiga" },
  { pertanyaan: "Bangun datar dengan empat sisi sama panjang dan empat sudut siku-siku adalah ...", opsi: ["Belah ketupat", "Persegi", "Trapesium", "Segitiga"], jawabanBenar: "Persegi" },
  { pertanyaan: "Segitiga sama kaki memiliki ... sisi sama panjang.", opsi: ["Satu pasang", "Dua pasang", "Tiga pasang", "Tidak ada"], jawabanBenar: "Satu pasang" },
  { pertanyaan: "Bangun datar yang mempunyai dua pasang sisi sejajar adalah ...", opsi: ["Segitiga", "Jajar genjang", "Lingkaran", "Layang-layang"], jawabanBenar: "Jajar genjang" },
  { pertanyaan: "Trapesium memiliki ... pasang sisi sejajar.", opsi: ["Tidak ada", "Satu", "Dua", "Tiga"], jawabanBenar: "Satu" },
  { pertanyaan: "Bangun datar dengan empat sisi sama panjang, tetapi sudutnya tidak harus siku-siku adalah ...", opsi: ["Persegi panjang", "Belah ketupat", "Trapesium", "Segitiga"], jawabanBenar: "Belah ketupat" },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function normalizeQuestion(q) {
  const options = Array.isArray(q.opsi) ? q.opsi : [];
  let answer = q.jawabanBenar;

  if (typeof answer === "number" && answer >= 0 && answer < options.length) {
    answer = options[answer];
  }

  return {
    pertanyaan: q.pertanyaan || q.q || "Perhatikan soal berikut.",
    opsi: options,
    jawabanBenar: answer,
    pembahasan: q.pembahasan || q.penjelasan || q.exp || "",
  };
}

function freshPlayer(id, color) {
  return {
    id, color, progress: 0, score: 0, benar: 0, salah: 0,
    dijawab: 0, questionIndex: 0,
  };
}

export default function BalapanPage() {
  const router = useRouter();
  const [screen, setScreen] = useState("home");
  const [difficulty, setDifficulty] = useState("sedang");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [remaining, setRemaining] = useState(LIMIT);
  const [feedback, setFeedback] = useState({});
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const locked = useRef({ 1: false, 2: false });

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const q = query(
        collection(db, "daftar_soal"),
        where("materi", "==", MATERIAL),
        where("tingkat", "==", difficulty)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((d) => normalizeQuestion(d.data()))
        .filter((x) => x.pertanyaan && x.opsi.length >= 2 && x.jawabanBenar != null);

      if (list.length) {
        setQuestions(shuffle(list));
        setUsedFallback(false);
      } else {
        setQuestions(shuffle(FALLBACK.map(normalizeQuestion)));
        setUsedFallback(true);
        setMessage("Bank soal untuk tingkat ini belum tersedia. Game menggunakan soal cadangan.");
      }
    } catch (error) {
      console.error("Gagal memuat soal:", error);
      setQuestions(shuffle(FALLBACK.map(normalizeQuestion)));
      setUsedFallback(true);
      setMessage("Firebase belum dapat diakses. Game menggunakan soal cadangan.");
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const startGame = async () => {
    await loadQuestions();
  };

  useEffect(() => {
    if (screen !== "playing") return;
    const timer = setInterval(() => {
      setRemaining((v) => {
        if (v <= 1) {
          clearInterval(timer);
          setScreen("result");
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen === "home" || !questions.length || loading) return;
    // Start is triggered after the user presses the start button.
  }, [screen, questions, loading]);

  const beginRace = () => {
    if (!questions.length) return;
    locked.current = { 1: false, 2: false };
    setPlayers([freshPlayer(1, "#ff665e"), freshPlayer(2, "#35b8ff")]);
    setFeedback({});
    setRemaining(LIMIT);
    setWinner(null);
    setScreen("playing");
  };

  useEffect(() => {
    if (screen !== "home" || !questions.length) return;
    // Questions are ready; the player may begin.
  }, [screen, questions]);

  const answer = (playerId, selected) => {
    if (screen !== "playing" || locked.current[playerId]) return;

    const player = players.find((p) => p.id === playerId);
    if (!player || player.dijawab >= count) return;

    const q = questions[player.questionIndex % questions.length];
    const correct = String(selected).trim() === String(q.jawabanBenar).trim();
    locked.current[playerId] = true;

    setFeedback((old) => ({
      ...old,
      [playerId]: {
        correct,
        text: correct ? "BENAR! GAS MENUJU FINIS!" : "BELUM TEPAT!",
        explanation: q.pembahasan,
      },
    }));

    const updated = players.map((p) => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        progress: Math.min(count, p.progress + (correct ? 1 : 0)),
        score: p.score + (correct ? POINTS[difficulty] : 0),
        benar: p.benar + (correct ? 1 : 0),
        salah: p.salah + (correct ? 0 : 1),
        dijawab: p.dijawab + 1,
        questionIndex: p.questionIndex + 1,
      };
    });

    setPlayers(updated);

    const nextPlayer = updated.find((p) => p.id === playerId);
    if (nextPlayer.progress >= count) {
      setWinner(playerId);
      setScreen("result");
    } else if (updated.every((p) => p.dijawab >= count)) {
      setScreen("result");
    }

    setTimeout(() => {
      locked.current[playerId] = false;
      setFeedback((old) => {
        const next = { ...old };
        delete next[playerId];
        return next;
      });
    }, 1200);
  };

  const formatTime = (n) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  const resetGame = () => {
    setScreen("home");
    setQuestions([]);
    setPlayers([]);
    setFeedback({});
    setWinner(null);
    setRemaining(LIMIT);
    setMessage("");
  };

  const styles = `
    * { box-sizing: border-box; }
    .race-root { min-height:100vh; padding:24px; color:#f8fafc; font-family:Arial,sans-serif;
      background:radial-gradient(ellipse at top,#254f70 0%,#12283f 48%,#0b1425 100%); }
    .race-wrap { max-width:1050px; margin:auto; }
    .race-top { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:22px; }
    .race-logo { font-size:clamp(22px,4vw,34px); font-weight:1000; letter-spacing:-1px; }
    .race-sub { color:#b9d4e7; font-size:13px; margin-top:5px; }
    .race-btn { border:0; border-radius:13px; padding:12px 17px; font-weight:900; cursor:pointer; transition:.18s; }
    .race-btn:hover { transform:translateY(-2px); filter:brightness(1.07); }
    .race-primary { color:#14263b; background:#ffcf54; box-shadow:0 5px 0 #c78c20; }
    .race-muted { color:#e2e8f0; background:#ffffff14; border:1px solid #ffffff26; }
    .race-panel { background:#ffffff0d; border:1px solid #ffffff1b; border-radius:24px; padding:clamp(18px,4vw,30px); box-shadow:0 20px 60px #0003; }
    .race-title { font-size:clamp(26px,5vw,40px); font-weight:1000; margin:0 0 8px; }
    .race-desc { color:#b9d4e7; line-height:1.6; margin:0 0 22px; }
    .race-field { margin:22px 0; }
    .race-label { display:block; color:#d5e7f5; font-size:13px; font-weight:900; margin-bottom:10px; }
    .race-options { display:flex; flex-wrap:wrap; gap:10px; }
    .race-choice { border:1px solid #ffffff26; border-radius:13px; padding:12px 17px; background:#12263a; color:#e8f4ff; font-weight:800; cursor:pointer; }
    .race-choice.active { background:#ffcf54; color:#15283d; border-color:#ffcf54; }
    .race-note { margin:14px 0; padding:12px 14px; border-radius:12px; background:#1d4055; color:#d6f2ff; font-size:13px; }
    .race-arena { display:grid; gap:18px; }
    .race-hud { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
    .race-timer { font-size:28px; font-weight:1000; font-variant-numeric:tabular-nums; }
    .race-track { position:relative; overflow:hidden; border-radius:18px; background:#dbeafe; padding:14px 10px; border:4px solid #fff; }
    .race-lane { height:76px; position:relative; border-bottom:2px dashed #ffffff; background:repeating-linear-gradient(90deg,#b6e3ad 0,#b6e3ad 44px,#a4d799 44px,#a4d799 88px); }
    .race-lane:last-child { border-bottom:0; }
    .race-runner { position:absolute; top:50%; transform:translate(-50%,-50%); font-size:34px; transition:left .5s cubic-bezier(.2,.8,.2,1); z-index:2; filter:drop-shadow(0 4px 2px #0002); }
    .race-finish { position:absolute; right:5px; top:0; bottom:0; width:12px; background:repeating-linear-gradient(0deg,#fff 0 8px,#182536 8px 16px); z-index:1; }
    .race-lane-label { position:absolute; left:9px; top:6px; font-size:10px; font-weight:1000; color:#37633b; }
    .race-players { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
    .race-card { min-width:0; border-radius:20px; padding:18px; background:#fff; color:#172b40; border-top:6px solid var(--player); }
    .race-player-head { display:flex; justify-content:space-between; gap:8px; align-items:center; margin-bottom:14px; }
    .race-player-head h3 { margin:0; font-size:19px; font-weight:1000; }
    .race-score { font-size:21px; font-weight:1000; color:var(--player); }
    .race-progress { height:8px; border-radius:99px; background:#e5edf4; overflow:hidden; margin:12px 0; }
    .race-progress > div { height:100%; background:var(--player); transition:width .4s; }
    .race-question { min-height:65px; font-weight:900; line-height:1.45; margin:14px 0; }
    .race-answers { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .race-answer { text-align:left; border:1px solid #d9e3ec; background:#f5f8fb; color:#1c344b; border-radius:11px; padding:11px; cursor:pointer; font-weight:750; min-height:48px; overflow-wrap:anywhere; }
    .race-answer:hover:not(:disabled) { border-color:var(--player); background:#edf6ff; }
    .race-answer:disabled { opacity:.65; cursor:default; }
    .race-feedback { margin-top:10px; font-size:12px; font-weight:900; color:#26754b; }
    .race-stats { display:flex; gap:8px; flex-wrap:wrap; color:#d8eafa; font-size:12px; }
    .race-stat { background:#ffffff12; border-radius:10px; padding:8px 10px; }
    .race-result-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin:20px 0; }
    .race-result { border:1px solid #ffffff25; border-radius:18px; padding:18px; background:#ffffff0c; }
    .race-result h3 { margin:0 0 12px; }
    .race-result p { margin:8px 0; color:#d5e7f5; }
    @media(max-width:720px) { .race-root{padding:14px} .race-players{grid-template-columns:1fr} .race-result-grid{grid-template-columns:1fr} .race-lane{height:62px} .race-answer{font-size:12px;padding:9px} }
  `;

  return (
    <main className="race-root">
      <style>{styles}</style>
      <div className="race-wrap">
        <header className="race-top">
          <div>
            <div className="race-logo">🏁 RACE OF SHAPES</div>
            <div className="race-sub">Duel Matematika • Ciri-ciri Bangun Datar</div>
          </div>
          <button className="race-btn race-muted" onClick={() => router.push("/dashboard")}>← Dashboard</button>
        </header>

        {screen === "home" && (
          <section className="race-panel">
            <div style={{ fontSize: 66, marginBottom: 8 }}>🏃‍♂️ 🏃‍♀️ 🏁</div>
            <h1 className="race-title">Siapa Paling Cepat?</h1>
            <p className="race-desc">
              Jawab soal dengan benar untuk melaju menuju garis finis. Tantang temanmu
              dalam satu perangkat. Ketepatan dan kecepatan menentukan juara!
            </p>
            <div className="race-field">
              <span className="race-label">TINGKAT KESULITAN</span>
              <div className="race-options">
                {["mudah", "sedang", "sulit"].map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`race-choice ${difficulty === d ? "active" : ""}`}>
                    {d === "mudah" ? "🟢" : d === "sedang" ? "🟡" : "🔴"} {d.toUpperCase()} · {POINTS[d]} poin
                  </button>
                ))}
              </div>
            </div>
            <div className="race-field">
              <span className="race-label">JUMLAH SOAL / LANGKAH MENUJU FINIS</span>
              <div className="race-options">
                {[5, 10, 20].map((n) => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`race-choice ${count === n ? "active" : ""}`}>{n} Soal</button>
                ))}
              </div>
            </div>
            {message && <div className="race-note">{message}</div>}
            <button className="race-btn race-primary" disabled={loading}
              onClick={async () => {
                await startGame();
              }}>
              {loading ? "Memuat soal..." : "MULAI BALAPAN 🚦"}
            </button>
            {!!questions.length && (
              <button className="race-btn race-muted" style={{ marginLeft: 10 }}
                onClick={beginRace}>Mulai dengan soal yang tersedia</button>
            )}
            {questions.length > 0 && (
              <div className="race-note" style={{ marginTop: 14 }}>
                {questions.length} soal siap digunakan. Tekan tombol mulai di atas, lalu pilih “Mulai dengan soal yang tersedia”.
                {usedFallback ? " Soal cadangan aktif." : " Soal dimuat dari Firebase."}
              </div>
            )}
          </section>
        )}

        {screen === "playing" && (
          <section className="race-arena">
            <div className="race-panel">
              <div className="race-hud">
                <div>
                  <div className="race-label">BALAPAN BERLANGSUNG</div>
                  <div style={{ fontWeight: 900 }}>Target: {count} langkah benar</div>
                </div>
                <div className="race-timer">⏱ {formatTime(remaining)}</div>
              </div>
              <div className="race-track" style={{ marginTop: 18 }}>
                {players.map((p, i) => (
                  <div className="race-lane" key={p.id}>
                    <span className="race-lane-label">PLAYER {p.id}</span>
                    <span className="race-runner" style={{
                      left: `${Math.min(95, 8 + (p.progress / count) * 85)}%`
                    }}>{i === 0 ? "🏃‍♂️" : "🏃‍♀️"}</span>
                    <span className="race-finish" />
                  </div>
                ))}
              </div>
              <div className="race-stats" style={{ marginTop: 14 }}>
                {players.map((p) => (
                  <span className="race-stat" key={p.id}>
                    P{p.id}: {p.progress}/{count} langkah · {p.score} poin
                  </span>
                ))}
              </div>
            </div>

            <div className="race-players">
              {players.map((p, i) => {
                const q = questions[p.questionIndex % questions.length];
                const fb = feedback[p.id];
                const done = p.dijawab >= count;
                return (
                  <article key={p.id} className="race-card" style={{ "--player": p.color }}>
                    <div className="race-player-head">
                      <h3>{i === 0 ? "🔴 PLAYER 1" : "🔵 PLAYER 2"}</h3>
                      <span className="race-score">{p.score} pts</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#61758a" }}>
                      Langkah: {p.progress}/{count} · Soal dijawab: {p.dijawab}
                    </div>
                    <div className="race-progress">
                      <div style={{ width: `${(p.progress / count) * 100}%` }} />
                    </div>
                    <div className="race-question">{done ? "Kamu telah menjawab semua soal!" : q.pertanyaan}</div>
                    {!done && (
                      <div className="race-answers">
                        {q.opsi.map((opt, index) => (
                          <button key={`${p.id}-${index}`} className="race-answer"
                            disabled={!!fb || done}
                            onClick={() => answer(p.id, opt)}>
                            {String.fromCharCode(65 + index)}. {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {fb && <div className="race-feedback">
                      {fb.text} {fb.explanation}
                    </div>}
                    <div style={{ marginTop: 12, fontSize: 12, color: "#61758a" }}>
                      Benar: {p.benar} · Salah: {p.salah}
                    </div>
                  </article>
                );
              })}
            </div>
            <div style={{ textAlign: "center" }}>
              <button className="race-btn race-muted" onClick={() => {
                if (confirm("Batalkan balapan ini?")) resetGame();
              }}>Batalkan balapan</button>
            </div>
          </section>
        )}

        {screen === "result" && (
          <section className="race-panel">
            <div style={{ fontSize: 58 }}>🏆</div>
            <h1 className="race-title">
              {winner ? `PLAYER ${winner} MENANG!` :
                players.length && players[0].score === players[1].score ? "PERTANDINGAN SERI!" :
                "BALAPAN SELESAI!"}
            </h1>
            <p className="race-desc">
              {winner ? "Luar biasa! Kamu berhasil mencapai garis finis lebih dahulu." :
                "Waktu habis atau semua soal telah dijawab. Mari lihat hasil pertandingan."}
            </p>
            <div className="race-result-grid">
              {players.map((p, i) => (
                <div className="race-result" key={p.id} style={{ borderTop: `5px solid ${p.color}` }}>
                  <h3>{i === 0 ? "🔴 PLAYER 1" : "🔵 PLAYER 2"} {winner === p.id ? "👑" : ""}</h3>
                  <p>Skor: <b>{p.score}</b></p>
                  <p>Langkah: <b>{p.progress}/{count}</b></p>
                  <p>Benar: <b>{p.benar}</b> · Salah: <b>{p.salah}</b></p>
                  <p>Akurasi: <b>{p.dijawab ? Math.round(p.benar / p.dijawab * 100) : 0}%</b></p>
                </div>
              ))}
            </div>
            <button className="race-btn race-primary" onClick={resetGame}>MAIN LAGI ↻</button>
            <button className="race-btn race-muted" style={{ marginLeft: 10 }}
              onClick={() => router.push("/dashboard")}>Dashboard</button>
          </section>
        )}
      </div>
    </main>
  );
}
