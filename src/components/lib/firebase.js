import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-chat-7d81d.firebaseapp.com",
  projectId: "react-chat-7d81d",
  storageBucket: "react-chat-7d81d.appspot.com",
  messagingSenderId: "392735844838",
  appId: "1:392735844838:web:14dd8e5ddd9560c1a68e27"
};

const app = initializeApp(firebaseConfig);

// Экспортируем объекты для аутентификации, базы данных и хранилища
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

// Функция загрузки изображения в Firebase Storage
export const uploadImage = async (file, path) => {
  try {
    const imageRef = ref(storage, path);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL; // Возвращаем URL загруженного изображения
  } catch (error) {
    console.error("Error uploading image: ", error);
    throw new Error('Error uploading image');
  }
};

export const saveBackgroundImageUrl = async (chatId, imageUrl) => {
  if (!chatId || !imageUrl) {
    throw new Error("Не передан chatId или imageUrl");
  }
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, { bgImage: imageUrl });
};



// Функция получения URL изображения из Firestore
export const getBackgroundImageUrl = async (chatId) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    const docSnap = await getDoc(chatRef);
    if (docSnap.exists()) {
      return docSnap.data().backgroundImageUrl; // Возвращаем URL фона чата
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching background image: ", error);
    throw new Error('Error fetching image URL');
  }
};