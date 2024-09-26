import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-chat-7d81d.firebaseapp.com",
  projectId: "react-chat-7d81d",
  storageBucket: "react-chat-7d81d.appspot.com",
  messagingSenderId: "392735844838",
  appId: "1:392735844838:web:14dd8e5ddd9560c1a68e27"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore()
export const storage = getStorage()