import "./addUser.css";
import { collection, where, query, getDoc, getDocs, setDoc, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useState } from "react";
import { useUserStore } from "../../../lib/userStore";
import { toast } from "react-toastify";

const AddUser = ({ setAddMode, handleSelect }) => {
    const [user, setUser] = useState(null);
    const { currentUser } = useUserStore();

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
    
            const chatRef = doc(db, 'chats', user.id);
    
            await setDoc(chatRef, {
                createdAt: serverTimestamp(),
                messages: []
            });
    
            await updateDoc(userChatsRef, {
                chats: arrayUnion({
                    chatId: chatRef.id,
                    lastMessage: '',
                    receiverId: user.id,
                    updatedAt: Date.now(),
                    isSeen: false,
                })
            });
    
            await updateDoc(doc(db, 'userchats', user.id), {
                chats: arrayUnion({
                    chatId: chatRef.id,
                    lastMessage: '',
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                    isSeen: false,
                })
            });
    
            setAddMode(false);
            
            // Выбираем и открываем новый чат, добавляем проверку chatRef.id
            handleSelect({
                chatId: chatRef.id,
                user: user,
                isSeen: false,
                lastMessage: ''
            });
    
        } catch (err) {
            console.log("Error on handleAdd:", err);
        }
    };    

    return (
        <div className="addUser" onKeyDown={(e) => e.key === "Escape" && setAddMode(false)}>
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