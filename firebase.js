import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Tambahan wajib untuk membaca database

// Konfigurasi Firebase milikmu
const firebaseConfig = {
  apiKey: "AIzaSyCxmnXzt33r_JKKjlMGGD3muQR35vBBOxw",
  authDomain: "game-lab-matematika.firebaseapp.com",
  projectId: "game-lab-matematika",
  storageBucket: "game-lab-matematika.firebasestorage.app",
  messagingSenderId: "708160210784",
  appId: "1:708160210784:web:1a3f454716fb917c6b8005"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// BAGIAN TERPENTING: Mengekspor db agar bisa dipakai di halaman lain
export const db = getFirestore(app);