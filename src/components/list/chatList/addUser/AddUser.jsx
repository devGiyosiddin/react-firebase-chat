import "./addUser.css";
import { collection, where, query, getDocs, getDoc, setDoc, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useState } from "react";
import { useUserStore } from "../../../lib/userStore";

const AddUser = ({ setAddMode }) => {
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
                alert("This user is already added to your chats.");
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

        } catch (err) {
            console.log("Error on handleAdd:", err);
        }
    };

    return (
        <div className="addUser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
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