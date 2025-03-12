import "./addUser.css";
import { collection, where, query, getDocs, setDoc, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useState, useEffect, useRef } from "react";
import { useUserStore } from "../../../lib/userStore";
import { toast } from "react-toastify";

const AddUser = ({ setAddMode, handleSelect }) => {
    const [user, setUser] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { currentUser } = useUserStore();
    const addUserRef = useRef(null);
    
    // Get random recommended user
    const getRandomRecUser = async () => {
        try {
            const userRef = collection(db, "users");
            const querySnapshot = await getDocs(userRef);
            const users = querySnapshot.docs.map(doc => doc.data());
            
            if (users.length === 0) return null;

            // Select a random user from the list
            const randomUser = users[Math.floor(Math.random() * users.length)];
            return randomUser;
        } catch (err) {
            console.log("Error while getting recommended user: ", err);
            return null;
        }
    };

    // Search on input change
    const handleInputChange = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        if (value.length === 0) {
            const recUser = await getRandomRecUser(); // Get a random recommended user when input is cleared
            setSearchResults(recUser ? [recUser] : []);
            return;
        }
        
        try {
            const userRef = collection(db, 'users');
            const q = query(userRef, where('username', ">=", value), where('username', "<=", value + '\uf8ff'));
            const querySnapShot = await getDocs(q);
            
            if (!querySnapShot.empty) {
                const results = querySnapShot.docs.map(doc => doc.data());
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.log("Error while searching: ", err);
            setSearchResults([]);
        }

        // Fetch a random recommended user after each search
        const randomRecUser = await getRandomRecUser();
        if (randomRecUser) {
            setSearchResults((prevResults) => [...prevResults, randomRecUser]);
        }
    };

    // Set recommended user when the component mounts
    useEffect(() => {
        const fetchRecUser = async () => {
            const randomRecUser = await getRandomRecUser();
            if (randomRecUser) {
                setSearchResults([randomRecUser]);
            }
        };
        fetchRecUser();
    }, []);

    const handleSelectUser = (selectedUser) => {
        setUser(selectedUser);
    };

    const handleAdd = async () => {
        if (!user) return;
        
        const userChatsRef = doc(db, 'userchats', currentUser.id);
    
        try {
            const userChatsSnap = await getDoc(userChatsRef);
            const userChatsData = userChatsSnap.exists() ? userChatsSnap.data().chats : [];
    
            const isAlreadyInChats = userChatsData.some(chat => chat.receiverId === user.id);
    
            if (isAlreadyInChats) {
                toast.error("Пользователь уже в вашем списке чатов.");
                return;
            }
    
            const chatId = currentUser.id + "_" + user.id;
            const chatRef = doc(db, 'chats', chatId);
    
            await setDoc(chatRef, {
                createdAt: serverTimestamp(),
                messages: [],
                status: 'unmute',
            });
    
            await updateDoc(userChatsRef, {
                chats: arrayUnion({
                    chatId: chatId,
                    lastMessage: '',
                    receiverId: user.id,
                    updatedAt: Date.now(),
                    isSeen: false,
                    status: 'unmute',
                })
            });
    
            await updateDoc(doc(db, 'userchats', user.id), {
                chats: arrayUnion({
                    chatId: chatId,
                    lastMessage: '',
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                    isSeen: false,
                    status: 'unmute',
                })
            });
    
            setAddMode(false);
            
            handleSelect({
                chatId: chatId,
                user: user,
                isSeen: false,
                lastMessage: '',
                status: 'unmute',
            });

            toast.success("Пользователь добавлен в чат.");
    
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
            <div className="search-container">
                <input 
                    type="text" 
                    autoFocus 
                    placeholder="Введите имя пользователя" 
                    value={searchTerm}
                    onChange={handleInputChange}
                />
            </div>
            
            <div className="search-results">
                {searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                        <div 
                            key={index} 
                            className={`user-item ${user && user.id === result.id ? 'selected' : ''}`}
                            onClick={() => handleSelectUser(result)}
                        >
                            <div className="detail">
                                <img src={result.avatar || "./avatar.png"} alt="" />
                                <span>{result.username}</span>
                            </div>
                            {user && user.id === result.id && (
                                <div className="selected-indicator">✓</div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-results">No result</div>
                )}
            </div>
            
            {user && (
                <div className="selected-user">
                    <div className="user-detail">
                        <img src={user.avatar || "./avatar.png"} alt="" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd} className="add-button">Add user</button>
                </div>
            )}
        </div>
    );
};

export default AddUser;