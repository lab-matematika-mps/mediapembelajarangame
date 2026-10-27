
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MATERIAL = "Ciri-ciri Bangun Datar";
const POINTS = { mudah: 10, sedang: 20, sulit: 30 };
const TIME_LIMIT = 180;

const FALLBACK = [
  { pertanyaan: "Bangun datar yang mempunyai tiga sisi adalah ...", opsi: ["Persegi", "Segitiga", "Lingkaran", "Trapesium"], jawabanBenar: "Segitiga", pembahasan: "Segitiga memiliki tiga sisi dan tiga sudut." },
  { pertanyaan: "Berapa banyak sisi persegi?", opsi: ["2", "3", "4", "5"], jawabanBenar: "4", pembahasan: "Persegi memiliki empat sisi sama panjang." },
  { pertanyaan: "Bangun datar tanpa titik sudut adalah ...", opsi: ["Segitiga", "Persegi", "Lingkaran", "Layang-layang"], jawabanBenar: "Lingkaran", pembahasan: "Lingkaran tidak mempunyai titik sudut." },
  { pertanyaan: "Persegi panjang mempunyai ... sudut siku-siku.", opsi: ["1", "2", "3", "4"], jawabanBenar: "4", pembahasan: "Keempat sudut persegi panjang adalah sudut siku-siku." },
  { pertanyaan: "Segitiga sama sisi mempunyai ... sisi sama panjang.", opsi: ["1", "2", "3", "4"], jawabanBenar: "3", pembahasan: "Ketiga sisi segitiga sama sisi sama panjang." },
  { pertanyaan: "Bangun datar dengan dua pasang sisi sejajar adalah ...", opsi: ["Segitiga", "Jajar genjang", "Lingkaran", "Trapesium"], jawabanBenar: "Jajar genjang", pembahasan: "Jajar genjang memiliki dua pasang sisi sejajar." },
  { pertanyaan: "Trapesium mempunyai ... pasang sisi sejajar.", opsi: ["Tidak ada", "Satu", "Dua", "Tiga"], jawabanBenar: "Satu", pembahasan: "Trapesium memiliki satu pasang sisi sejajar." },
  { pertanyaan: "Berapa banyak titik sudut pada segi empat?", opsi: ["2", "3", "4", "5"], jawabanBenar: "4", pembahasan: "Semua bangun segi empat memiliki empat titik sudut." },
  { pertanyaan: "Bangun dengan empat sisi sama panjang dan empat sudut siku-siku adalah ...", opsi: ["Persegi", "Belah ketupat", "Trapesium", "Layang-layang"], jawabanBenar: "Persegi", pembahasan: "Persegi mempunyai empat sisi sama panjang dan empat sudut siku-siku." },
  { pertanyaan: "Segitiga sama kaki memiliki ... sisi sama panjang.", opsi: ["Satu", "Dua", "Tiga", "Empat"], jawabanBenar: "Dua", pembahasan: "Segitiga sama kaki mempunyai dua sisi sama panjang." },
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

function makePlayer(id, x, y) {
  return {
    id, x, y, score: 0, chests: 0,
    benar: 0, salah: 0, dijawab: 0,
  };
}

function makeMap(size, count, players) {
  const occupied = new Set(players.map((p) => `${p.x},${p.y}`));
  const spots = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!occupied.has(`${x},${y}`)) spots.push({ x, y });
    }
  }

  const shuffled = shuffle(spots);
  return shuffled.slice(0, count).map((pos, i) => ({
    id: `chest-${i}`,
    ...pos,
    status: "available",
    questionIndex: i,
  }));
}

export default function HartaKarunPage() {
  const router = useRouter();

  const [screen, setScreen] = useState("home");
  const [difficulty, setDifficulty] = useState("sedang");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [chests, setChests] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [remaining, setRemaining] = useState(TIME_LIMIT);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const [resultReason, setResultReason] = useState("");
  const questionCursor = useRef(0);

  const size = count === 5 ? 7 : count === 10 ? 9 : 11;
  const opened = chests.filter((c) => c.status === "opened").length;

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
        setUsedFallback(false);
        return shuffle(list);
      }

      setUsedFallback(true);
      setMessage("Soal Firebase untuk tingkat ini belum tersedia. Soal cadangan digunakan.");
      return shuffle(FALLBACK.map(normalizeQuestion));
    } catch (error) {
      console.error("Gagal memuat soal:", error);
      setUsedFallback(true);
      setMessage("Firebase belum dapat diakses. Soal cadangan digunakan.");
      return shuffle(FALLBACK.map(normalizeQuestion));
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const startGame = async () => {
    const list = await loadQuestions();
    if (!list.length) return;

    const p = [
      makePlayer(1, 0, 0),
      makePlayer(2, size - 1, size - 1),
    ];

    questionCursor.current = 0;
    setQuestions(list);
    setPlayers(p);
    setChests(makeMap(size, count, p));
    setActiveQuestion(null);
    setFeedback("");
    setRemaining(TIME_LIMIT);
    setResultReason("");
    setScreen("playing");
  };

  const endGame = useCallback((reason) => {
    setResultReason(reason);
    setScreen("result");
    setActiveQuestion(null);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;

    const timer = setInterval(() => {
      setRemaining((v) => {
        if (v <= 1) {
          clearInterval(timer);
          setResultReason("Waktu 3 menit habis!");
          setScreen("result");
          setActiveQuestion(null);
          return 0;
        }
        return v - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  const movePlayer = useCallback((playerId, dx, dy) => {
    if (screen !== "playing" || activeQuestion) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;

    const other = players.find((p) => p.id !== playerId);
    if (other && other.x === nx && other.y === ny) return;

    const chest = chests.find(
      (c) => c.x === nx && c.y === ny && c.status !== "opened"
    );

    if (chest && chest.status === "claimed") return;

    setPlayers((old) =>
      old.map((p) =>
        p.id === playerId ? { ...p, x: nx, y: ny } : p
      )
    );

    if (chest && chest.status === "available") {
      const q = questions[questionCursor.current % questions.length];
      questionCursor.current += 1;

      setChests((old) =>
        old.map((c) =>
          c.id === chest.id ? { ...c, status: "claimed", by: playerId } : c
        )
      );

      setActiveQuestion({
        playerId,
        chestId: chest.id,
        question: q,
        previousX: player.x,
        previousY: player.y,
      });
      setFeedback("");
    }
  }, [screen, activeQuestion, players, chests, size, questions]);

  useEffect(() => {
    if (screen !== "playing") return;

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();

      const controls = {
        w: [1, 0, -1],
        s: [1, 0, 1],
        a: [1, -1, 0],
        d: [1, 1, 0],
        arrowup: [2, 0, -1],
        arrowdown: [2, 0, 1],
        arrowleft: [2, -1, 0],
        arrowright: [2, 1, 0],
      };

      const control = controls[key];
      if (!control) return;

      e.preventDefault();
      movePlayer(control[0], control[1], control[2]);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, movePlayer]);

  const answerQuestion = (selected) => {
    if (!activeQuestion || screen !== "playing") return;

    const { playerId, chestId, question, previousX, previousY } = activeQuestion;
    const correct =
      String(selected).trim() === String(question.jawabanBenar).trim();

    setPlayers((old) =>
      old.map((p) => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          x: correct ? p.x : previousX,
          y: correct ? p.y : previousY,
          score: p.score + (correct ? POINTS[difficulty] : 0),
          chests: p.chests + (correct ? 1 : 0),
          benar: p.benar + (correct ? 1 : 0),
          salah: p.salah + (correct ? 0 : 1),
          dijawab: p.dijawab + 1,
        };
      })
    );

    setChests((old) =>
      old.map((c) =>
        c.id === chestId
          ? { ...c, status: correct ? "opened" : "available", by: null }
          : c
      )
    );

    setFeedback(
      correct
        ? `BENAR! +${POINTS[difficulty]} poin. ${question.pembahasan}`
        : `BELUM TEPAT! Peti masih terkunci. ${question.pembahasan}`
    );

    setActiveQuestion(null);

    if (correct && opened + 1 >= count) {
      endGame("Seluruh harta karun berhasil dibuka!");
    }
  };

  const formatTime = (n) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  const resetGame = () => {
    setScreen("home");
    setPlayers([]);
    setChests([]);
    setQuestions([]);
    setActiveQuestion(null);
    setFeedback("");
    setMessage("");
    setRemaining(TIME_LIMIT);
    setResultReason("");
  };

  const winner = (() => {
    if (players.length !== 2) return null;
    const [a, b] = players;
    if (a.score !== b.score) return a.score > b.score ? a.id : b.id;
    if (a.chests !== b.chests) return a.chests > b.chests ? a.id : b.id;

    const accA = a.dijawab ? a.benar / a.dijawab : 0;
    const accB = b.dijawab ? b.benar / b.dijawab : 0;
    if (accA !== accB) return accA > accB ? a.id : b.id;
    return null;
  })();

  const styles = `
    * { box-sizing:border-box; }
    .treasure-root { min-height:100vh; padding:22px; color:#f8fafc;
      font-family:Arial,sans-serif;
      background:radial-gradient(ellipse at top,#245a50 0%,#153c3b 46%,#0a1e2c 100%); }
    .treasure-wrap { max-width:1120px; margin:auto; }
    .treasure-top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:22px; }
    .treasure-logo { font-size:clamp(22px,4vw,34px); font-weight:1000; }
    .treasure-sub { color:#c3e8d6; font-size:13px; margin-top:5px; }
    .treasure-btn { border:0; border-radius:12px; padding:12px 16px; font-weight:900; cursor:pointer; }
    .treasure-btn:disabled { opacity:.6; cursor:wait; }
    .treasure-primary { background:#ffd166; color:#26352a; box-shadow:0 5px 0 #c58e26; }
    .treasure-muted { background:#ffffff13; border:1px solid #ffffff2b; color:#f0fff7; }
    .treasure-panel { background:#ffffff0d; border:1px solid #ffffff21; border-radius:24px; padding:clamp(18px,4vw,30px); box-shadow:0 20px 60px #0003; }
    .treasure-title { font-size:clamp(27px,5vw,40px); font-weight:1000; margin:0 0 8px; }
    .treasure-desc { color:#c3e8d6; line-height:1.65; margin:0 0 22px; }
    .treasure-field { margin:22px 0; }
    .treasure-label { display:block; font-size:12px; font-weight:900; color:#d7f4e3; margin-bottom:10px; }
    .treasure-options { display:flex; flex-wrap:wrap; gap:10px; }
    .treasure-choice { padding:12px 16px; border-radius:12px; border:1px solid #ffffff30; background:#0e2e31; color:#f0fff7; font-weight:900; cursor:pointer; }
    .treasure-choice.active { background:#ffd166; color:#26352a; border-color:#ffd166; }
    .treasure-note { background:#16433c; color:#d9ffed; padding:12px 14px; border-radius:12px; font-size:13px; margin:14px 0; line-height:1.5; }
    .treasure-hud { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
    .treasure-clock { font-size:27px; font-weight:1000; font-variant-numeric:tabular-nums; }
    .treasure-statrow { display:flex; flex-wrap:wrap; gap:8px; }
    .treasure-stat { padding:8px 10px; border-radius:10px; background:#ffffff12; font-size:12px; }
    .treasure-board-wrap { display:grid; grid-template-columns:minmax(0,1fr) 245px; gap:18px; align-items:start; }
    .treasure-board { width:100%; display:grid; gap:3px; background:#0e3329; border:5px solid #d6b77a; border-radius:15px; padding:5px; aspect-ratio:1; }
    .treasure-cell { position:relative; min-width:0; min-height:0; display:flex; align-items:center; justify-content:center; border-radius:4px; background:#9cce83; font-size:clamp(12px,2.2vw,25px); }
    .treasure-cell.alt { background:#8ec374; }
    .treasure-cell.open { background:#b9db8e; }
    .treasure-cell.claimed { background:#e8c878; }
    .treasure-player { position:absolute; z-index:3; display:flex; align-items:center; justify-content:center; width:90%; height:90%; font-size:clamp(15px,2.6vw,29px); filter:drop-shadow(0 2px 2px #0004); animation:treasure-bob .65s infinite alternate ease-in-out; }
    @keyframes treasure-bob { from{transform:translateY(1px)} to{transform:translateY(-2px)} }
    .treasure-side { display:grid; gap:12px; }
    .treasure-player-card { border-radius:17px; padding:15px; background:#ffffff; color:#18392d; border-top:5px solid var(--pcolor); }
    .treasure-player-card h3 { margin:0 0 10px; font-size:16px; }
    .treasure-player-card p { margin:6px 0; font-size:12px; }
    .treasure-dpad { display:grid; grid-template-columns:repeat(3,36px); grid-template-rows:repeat(3,34px); gap:4px; justify-content:center; margin-top:10px; }
    .treasure-dpad button { border:0; border-radius:7px; background:#e2efe5; color:#214734; font-weight:1000; cursor:pointer; touch-action:manipulation; }
    .treasure-dpad button:active { background:#ffd166; }
    .treasure-legend { font-size:11px; color:#537060; text-align:center; margin-top:8px; }
    .treasure-question { margin-top:18px; background:#fff; color:#1a3528; border-radius:20px; padding:20px; }
    .treasure-question h3 { margin:0 0 12px; font-size:19px; }
    .treasure-answer-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
    .treasure-answer { border:1px solid #d7e4d9; background:#f4f8f2; color:#203c2a; border-radius:11px; padding:12px; text-align:left; font-weight:800; cursor:pointer; overflow-wrap:anywhere; }
    .treasure-answer:hover { background:#e5f4df; border-color:#4e9b68; }
    .treasure-results { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin:22px 0; }
    .treasure-result-card { background:#ffffff0d; border:1px solid #ffffff28; border-radius:18px; padding:18px; }
    .treasure-result-card p { color:#d9f2e2; margin:9px 0; }
    @media(max-width:760px) {
      .treasure-root{padding:12px}
      .treasure-board-wrap{grid-template-columns:1fr}
      .treasure-board{max-width:600px;margin:auto}
      .treasure-side{grid-template-columns:repeat(2,minmax(0,1fr))}
      .treasure-player-card{padding:12px}
      .treasure-results{grid-template-columns:1fr}
    }
    @media(max-width:420px) {
      .treasure-side{grid-template-columns:1fr}
      .treasure-answer-grid{grid-template-columns:1fr}
    }
  `;

  return (
    <main className="treasure-root">
      <style>{styles}</style>
      <div className="treasure-wrap">
        <header className="treasure-top">
          <div>
            <div className="treasure-logo">🗺️ TREASURE QUEST</div>
            <div className="treasure-sub">Duel Petualangan • Ciri-ciri Bangun Datar</div>
          </div>
          <button className="treasure-btn treasure-muted"
            onClick={() => router.push("/dashboard")}>← Dashboard</button>
        </header>

        {screen === "home" && (
          <section className="treasure-panel">
            <div style={{ fontSize: 62, marginBottom: 8 }}>🧭 🗺️ 💰</div>
            <h1 className="treasure-title">Berburu Harta Karun</h1>
            <p className="treasure-desc">
              Jelajahi pulau misterius! Gunakan strategi untuk menemukan peti.
              Jawab soal bangun datar dengan benar untuk memperoleh harta dan poin.
              Siapa yang menjadi pemburu harta karun terbaik?
            </p>

            <div className="treasure-field">
              <span className="treasure-label">TINGKAT KESULITAN</span>
              <div className="treasure-options">
                {["mudah", "sedang", "sulit"].map((d) => (
                  <button key={d}
                    className={`treasure-choice ${difficulty === d ? "active" : ""}`}
                    onClick={() => setDifficulty(d)}>
                    {d === "mudah" ? "🟢" : d === "sedang" ? "🟡" : "🔴"} {d.toUpperCase()} · {POINTS[d]} poin
                  </button>
                ))}
              </div>
            </div>

            <div className="treasure-field">
              <span className="treasure-label">JUMLAH PETI HARTA KARUN</span>
              <div className="treasure-options">
                {[5, 10, 20].map((n) => (
                  <button key={n}
                    className={`treasure-choice ${count === n ? "active" : ""}`}
                    onClick={() => setCount(n)}>
                    {n} Peti · {n === 5 ? "7×7" : n === 10 ? "9×9" : "11×11"}
                  </button>
                ))}
              </div>
            </div>

            <div className="treasure-note">
              🔴 Player 1: WASD · 🔵 Player 2: tombol panah.
              <br />Keduanya bermain bergantian ketika soal peti sedang ditampilkan.
            </div>

            {message && <div className="treasure-note">{message}</div>}

            <button className="treasure-btn treasure-primary"
              disabled={loading} onClick={startGame}>
              {loading ? "Memuat soal..." : "MULAI PETUALANGAN 🏴‍☠️"}
            </button>
          </section>
        )}

        {screen === "playing" && (
          <section className="treasure-panel">
            <div className="treasure-hud">
              <div>
                <div className="treasure-label">PETA PETUALANGAN</div>
                <div style={{ fontWeight: 900 }}>Peti terbuka: {opened}/{count}</div>
              </div>
              <div className="treasure-clock">⏱ {formatTime(remaining)}</div>
            </div>

            <div className="treasure-statrow" style={{ marginBottom: 16 }}>
              {players.map((p) => (
                <span className="treasure-stat" key={p.id}>
                  {p.id === 1 ? "🔴" : "🔵"} Player {p.id}: {p.score} poin · {p.chests} peti
                </span>
              ))}
              <span className="treasure-stat">Kesulitan: {difficulty.toUpperCase()}</span>
            </div>

            <div className="treasure-board-wrap">
              <div>
                <div className="treasure-board"
                  style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                  {Array.from({ length: size * size }, (_, i) => {
                    const x = i % size;
                    const y = Math.floor(i / size);
                    const player = players.find((p) => p.x === x && p.y === y);
                    const chest = chests.find((c) => c.x === x && c.y === y);
                    let cls = "treasure-cell";
                    if ((x + y) % 2) cls += " alt";
                    if (chest?.status === "opened") cls += " open";
                    if (chest?.status === "claimed") cls += " claimed";

                    return (
                      <div key={`${x}-${y}`} className={cls}>
                        {chest && chest.status !== "opened" && (
                          <span>{chest.status === "claimed" ? "🔒" : "🎁"}</span>
                        )}
                        {chest?.status === "opened" && <span>✨</span>}
                        {player && (
                          <span className="treasure-player">
                            {player.id === 1 ? "🧑‍🚀" : "🧝"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {feedback && (
                  <div className="treasure-note" role="status">{feedback}</div>
                )}

                {activeQuestion && (
                  <div className="treasure-question">
                    <div className="treasure-label" style={{ color: "#387b4d" }}>
                      🎁 PETI DITEMUKAN · PLAYER {activeQuestion.playerId}
                    </div>
                    <h3>{activeQuestion.question.pertanyaan}</h3>
                    <div className="treasure-answer-grid">
                      {activeQuestion.question.opsi.map((opt, i) => (
                        <button key={i} className="treasure-answer"
                          onClick={() => answerQuestion(opt)}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </button>
                      ))}
                    </div>
                    {activeQuestion.question.pembahasan && (
                      <p style={{ color: "#67806c", fontSize: 12, marginTop: 12 }}>
                        Pembahasan akan ditampilkan setelah jawaban dipilih.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <aside className="treasure-side">
                {players.map((p) => (
                  <div key={p.id} className="treasure-player-card"
                    style={{ "--pcolor": p.id === 1 ? "#ff665e" : "#35b8ff" }}>
                    <h3>{p.id === 1 ? "🔴 PLAYER 1" : "🔵 PLAYER 2"}</h3>
                    <p>Skor: <b>{p.score}</b></p>
                    <p>Peti: <b>{p.chests}</b></p>
                    <p>Benar: <b>{p.benar}</b> · Salah: <b>{p.salah}</b></p>
                    <div className="treasure-dpad">
                      <span />
                      <button onClick={() => movePlayer(p.id, 0, -1)}>▲</button>
                      <span />
                      <button onClick={() => movePlayer(p.id, -1, 0)}>◀</button>
                      <button onClick={() => movePlayer(p.id, 0, 0)}>•</button>
                      <button onClick={() => movePlayer(p.id, 1, 0)}>▶</button>
                      <span />
                      <button onClick={() => movePlayer(p.id, 0, 1)}>▼</button>
                      <span />
                    </div>
                    <div className="treasure-legend">
                      {p.id === 1 ? "Kontrol: W A S D" : "Kontrol: tombol panah"}
                    </div>
                  </div>
                ))}
              </aside>
            </div>

            <div style={{ textAlign: "center", marginTop: 18 }}>
              <button className="treasure-btn treasure-muted"
                onClick={() => {
                  if (confirm("Yakin ingin membatalkan permainan?")) resetGame();
                }}>
                Batalkan permainan
              </button>
            </div>
          </section>
        )}

        {screen === "result" && (
          <section className="treasure-panel">
            <div style={{ fontSize: 58 }}>🏆</div>
            <h1 className="treasure-title">
              {winner ? `PLAYER ${winner} MENJADI JUARA!` : "PERTANDINGAN SERI!"}
            </h1>
            <p className="treasure-desc">{resultReason}</p>

            <div className="treasure-results">
              {players.map((p) => (
                <div className="treasure-result-card" key={p.id}
                  style={{ borderTop: `5px solid ${p.id === 1 ? "#ff665e" : "#35b8ff"}` }}>
                  <h3>{p.id === 1 ? "🔴 PLAYER 1" : "🔵 PLAYER 2"} {winner === p.id ? "👑" : ""}</h3>
                  <p>Skor: <b>{p.score}</b></p>
                  <p>Peti terbuka: <b>{p.chests}</b></p>
                  <p>Benar: <b>{p.benar}</b> · Salah: <b>{p.salah}</b></p>
                  <p>Akurasi: <b>{p.dijawab ? Math.round(p.benar / p.dijawab * 100) : 0}%</b></p>
                </div>
              ))}
            </div>

            <button className="treasure-btn treasure-primary" onClick={resetGame}>
              MAIN LAGI ↻
            </button>
            <button className="treasure-btn treasure-muted"
              style={{ marginLeft: 10 }}
              onClick={() => router.push("/dashboard")}>
              Dashboard
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
