import "./addUser.css";
import { collection, where, query, getDoc, getDocs, setDoc, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useState, useEffect, useRef } from "react";
import { useUserStore } from "../../../lib/userStore";
import { toast } from "react-toastify";

const AddUser = ({ setAddMode, handleSelect }) => {
    const [user, setUser] = useState(null);
    const { currentUser } = useUserStore();
    const addUserRef = useRef(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');

        try {
            const userRef = collection(db, 'users');
            const q = query(userRef, where('username', "==", username));
            const querySnapShot = await getDocs(q);

            if (!querySnapShot.empty) {
                setUser(querySnapShot.docs[0].data());
            }
        } catch (err) {
            console.log("Error on handleSearch: ", err);
        }
    };

    const handleAdd = async () => {
        const userChatsRef = doc(db, 'userchats', currentUser.id);
    
        try {
            const userChatsSnap = await getDoc(userChatsRef);
            const userChatsData = userChatsSnap.exists() ? userChatsSnap.data().chats : [];
    
            const isAlreadyInChats = userChatsData.some(chat => chat.receiverId === user.id);
    
            if (isAlreadyInChats) {
                toast.error("User is already in your chats.");
                return;
            }
    
            const chatId = currentUser.id + "_" + user.id; // Уникальный ID для чата
            const chatRef = doc(db, 'chats', chatId);
    
            // Создаем документ чата с полем status
            await setDoc(chatRef, {
                createdAt: serverTimestamp(),
                messages: [],
                status: 'unmute', // Добавляем статус в сам чат
            });
    
            // Обновляем чаты текущего пользователя
            await updateDoc(userChatsRef, {
                chats: arrayUnion({
                    chatId: chatId,
                    lastMessage: '',
                    receiverId: user.id,
                    updatedAt: Date.now(),
                    isSeen: false,
                    status: 'unmute', // Добавляем статус в список чатов
                })
            });
    
            // Обновляем чаты добавленного пользователя
            await updateDoc(doc(db, 'userchats', user.id), {
                chats: arrayUnion({
                    chatId: chatId,
                    lastMessage: '',
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                    isSeen: false,
                    status: 'unmute', // Добавляем статус для второго пользователя
                })
            });
    
            setAddMode(false);
    
            handleSelect({
                chatId: chatId,
                user: user,
                isSeen: false,
                lastMessage: '',
                status: 'unmute', // Передаем статус в handleSelect
            });
    
        } catch (err) {
            console.log("Error on handleAdd:", err);
        }
    };    

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (addUserRef.current && !addUserRef.current.contains(event.target)) {
                setTimeout(() => setAddMode(false), 100);
            }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setAddMode]);

    return (
        <div
            className="addUser"
            onKeyDown={(e) => e.key === "Escape" && setAddMode(false)}
            ref={addUserRef}
        >
            <form onSubmit={handleSearch}>
                <input type="text" autoFocus placeholder="Username" name="username" />
                <button>Search</button>
            </form>
            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "./avatar.png"} alt="" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd}>Add User</button>
                </div>
            )}
        </div>
    );
};

export default AddUser;