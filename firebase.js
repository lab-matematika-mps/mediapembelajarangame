import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // (Isi dengan kode config dari web Firebase milikmu)
  apiKey: "AIzaSy...",
  // ... (sisanya)
};

const app = initializeApp(firebaseConfig);

// BARIS INI SANGAT PENTING, PASTIKAN ADA:
export const db = getFirestore(app);