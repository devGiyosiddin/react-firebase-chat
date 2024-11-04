import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { FaRegTrashCan } from "react-icons/fa6";
import { IoMdSearch } from "react-icons/io";
import { CiCircleRemove } from "react-icons/ci";

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState('');
    const [selectedChatId, setSelectedChatId] = useState(null);

    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();

    useEffect(() => {
        const unSub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
            const items = res.data().chats;

            const promises = items.map(async (item) => {
                const userDocRef = doc(db, 'users', item.receiverId);
                const userDocSnap = await getDoc(userDocRef);

                const user = userDocSnap.data();

                return { ...item, user };
            });

            const chatData = await Promise.all(promises);

            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => {
            unSub();
        };
    }, [currentUser.id]);

    const handleSelect = async (chat) => {
        setSelectedChatId(chat.chatId);

        const updatedChats = chats.map(item => {
            if (item.chatId === chat.chatId) {
                return { ...item, isSeen: true };
            }
            return item;
        });

        const userChats = updatedChats.map(item => {
            const { user, ...rest } = item;
            return rest;
        });

        const chatIndex = userChats.findIndex(item => item.chatId === chat.chatId);
        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, 'userchats', currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            setChats(updatedChats); 
            changeChat(chat.chatId, chat.user); 
        } catch (err) {
            console.log(err);
        }
    };

    const handleDelete = async (chatId) => {
        const userChatsRef = doc(db, 'userchats', currentUser.id);

        const filteredChats = chats.filter(chat => chat.chatId !== chatId);
        const updatedChats = filteredChats.map(item => {
            const { user, ...rest } = item;
            return rest;
        });

        try {
            await updateDoc(userChatsRef, {
                chats: updatedChats,
            });
            setChats(filteredChats); 
        } catch (err) {
            console.log("Error while deleting chat: ", err);
        }
    };

    const clearInput = () => {
        setInput('');
    };

    const filteredChats = chats.filter(c =>
        c.user.username.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="chatList">
            <div className="search">
                <div className="searchBar">
                    <IoMdSearch className="searchIcon" />
                    <input 
                        type="text" 
                        placeholder="Search"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    {input && (
                        <CiCircleRemove 
                            className="clearIcon" 
                            onClick={clearInput}
                        />
                    )}
                </div>
                <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className="add" onClick={() => setAddMode(prev => !prev)} />
            </div>
            <div className="chats">
                {filteredChats.map((chat, index) => (
                    <div className="item"
                        key={`${chat.chatId}-${index}`} 
                        onClick={() => handleSelect(chat)}
                        style={{
                            backgroundColor: chat.chatId === selectedChatId ? '#766ac8' : 'transparent'
                        }}
                    >
                        <img src={
                            chat.user.blocked.includes(currentUser.id)
                                ? "./avatar.png"
                                : chat.user.avatar || "./avatar.png"}
                            alt=""
                        />
                        <div className="texts">
                            <span>
                                {chat.user.blocked.includes(currentUser.id)
                                    ? "Blocked"
                                    : chat.user.username}
                            </span>
                            {chat.lastMessage && <p>{chat.lastMessage}</p>}
                        </div>
                        <button className="delete-btn" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(chat.chatId);
                        }}>{<FaRegTrashCan />}</button>
                    </div>
                ))}
            </div>
            {addMode && <AddUser setAddMode={setAddMode} />}
        </div>
    );
};

export default ChatList;