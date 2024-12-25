import { useEffect, useState, useRef } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../lib/userStore";
import { auth } from "../../lib/firebase";
import { doc, getDoc, onSnapshot, updateDoc, getFirestore } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { FaRegTrashCan } from "react-icons/fa6";
import { IoMdSearch } from "react-icons/io";
import { CiCircleRemove } from "react-icons/ci";
import MenuIcon from "../../icons/menuIcon";
import { CgProfile } from "react-icons/cg";
import { MdOutlineSettings } from "react-icons/md";

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState('');
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuToggleRef = useRef(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
    const contextMenuRef = useRef(null);

    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();
    const inputRef = useRef(null);
    const db = getFirestore();

    // Показать меню и задать позицию
    const handleContextMenu = (event) => {
        event.preventDefault();
        setMenuPosition({ x: event.pageX, y: event.pageY });
        setIsContextMenuVisible(true);
    };

    // Скрыть меню при клике вне его
    const handleClickOutsideMenu = (event) => {
        if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
            setIsContextMenuVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
            const items = res.data().chats;
    
            // Получаем данные с полем `lastMessage` из коллекции `chats`
            const promises = items.map(async (item) => {
                // Получаем пользователя
                const userDocRef = doc(db, 'users', item.receiverId);
                const userDocSnap = await getDoc(userDocRef);
                const user = userDocSnap.data();
    
                // Получаем данные чата
                const chatDocRef = doc(db, 'chats', item.chatId);
                const chatDocSnap = await getDoc(chatDocRef);
                const chatData = chatDocSnap.exists() ? chatDocSnap.data() : {};
    
                // Теперь просто берем `lastMessage` из `item` (предполагая, что оно там уже есть)
                const lastMessage = item.lastMessage || "";
    
                return {
                    ...item,
                    user,
                    lastMessage,
                };
            });
    
            const chatData = await Promise.all(promises);
    
            setChats(
                chatData.sort((a, b) => {
                    const aTime = a.updatedAt?.seconds || 0;
                    const bTime = b.updatedAt?.seconds || 0;
                    return bTime - aTime;
                })
            );
        });
    
        return () => {
            unSub();
        };
    }, [currentUser.id]);    

    const toggleMenu = (e) => {
        e.stopPropagation();
        setIsMenuOpen((prev) => !prev);
    };

    const handleClickOutside = (event) => {
        if (!menuToggleRef.current && menuRef.current && !menuRef.current.contains(event.target)) {
            setIsMenuOpen(false);
        }
        menuToggleRef.current = false;
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = async (chat) => {
        setSelectedChatId(chat.chatId);
    
        const updatedChats = chats.map((item) => {
            if (item.chatId === chat.chatId) {
                return { ...item, isSeen: true };
            }
            return item;
        });
    
        const userChats = updatedChats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });
    
        // Найти индекс выбранного чата
        const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    
        // Проверить, существует ли элемент с таким chatId
        if (chatIndex === -1) {
            console.error(`Chat with ID ${chat.chatId} not found in userChats`);
            return;
        }
    
        // Обновить флаг isSeen для найденного чата
        userChats[chatIndex].isSeen = true;
    
        const userChatsRef = doc(db, 'userchats', currentUser.id);
    
        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            setChats(updatedChats);
            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.error("Error updating user chats:", err);
        }
    };

    const handleDelete = async (chatId) => {
        const userChatsRef = doc(db, 'userchats', currentUser.id);

        const filteredChats = chats.filter((chat) => chat.chatId !== chatId);
        const updatedChats = filteredChats.map((item) => {
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

    const handleIconClick = () => {
        inputRef.current.focus();
    };

    const filteredChats = chats.filter((c) =>
        c.user.username.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="chatList">
            <div className="search">
                <MenuIcon
                    isOpen={isMenuOpen}
                    toggleMenu={(e) => {
                        menuToggleRef.current = true;
                        toggleMenu(e);
                    }}
                />
                {isMenuOpen && (
                    <ul className="dropdown-menu" ref={menuRef}>
                        <li>
                            <span>Profile</span>
                            <CgProfile />
                        </li>
                        <li></li>
                        <li>
                            <span>Settings</span>
                            <MdOutlineSettings />
                        </li>
                        <button className="logout" onClick={() => auth.signOut()}>
                            Log out
                        </button>
                    </ul>
                )}
                <div className={`searchBar ${isFocused ? 'focused' : ''}`}>
                    <IoMdSearch onClick={handleIconClick} className="searchIcon" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={input}
                        ref={inputRef}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {input && <CiCircleRemove className="clearIcon" onClick={clearInput} />}
                </div>
                <img
                    src={addMode ? "./minus.png" : "./plus.png"}
                    alt=""
                    className="add"
                    onClick={(e) => {
                        e.stopPropagation();
                        setAddMode((prev) => !prev);
                    }}
                />
            </div>
            <div className="chats">
                {filteredChats.map((chat, index) => (
                    <div
                        className="item"
                        key={`${chat.chatId}-${index}`}
                        onClick={() => handleSelect(chat)}
                        style={{
                            backgroundColor:
                                chat.chatId === selectedChatId
                                    ? '#766ac8'
                                    : chat.isSeen
                                    ? 'transparent'
                                    : '#766ac8',
                        }}
                    >
                        <img
                            src={
                                chat.user.blocked.includes(currentUser.id)
                                    ? "./avatar.png"
                                    : chat.user.avatar || "./avatar.png"
                            }
                            alt=""
                        />
                        <div className="texts">
                            <span>
                                {chat.user.blocked.includes(currentUser.id)
                                    ? "Blocked"
                                    : chat.user.username}
                            </span>
                            <span className="lastMessage">{chat.lastMessage || "No message"}</span>
                        </div>
                        <button
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chat.chatId);
                            }}
                        >
                            {<FaRegTrashCan />}
                        </button>
                    </div>
                ))}
            </div>
            {addMode && <AddUser setAddMode={setAddMode} handleSelect={handleSelect} />}
        </div>
    );
};

export default ChatList;