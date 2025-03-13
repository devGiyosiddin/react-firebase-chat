import "./chatList.css";
import { useEffect, useState, useRef } from "react";
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
import { MdOutlineSettings } from "react-icons/md";
import Joyride from "react-joyride";
import UserInfo from '../userInfo/UserInfo'

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
    const addRef = useRef(null);
    const menuButtonRef = useRef(null);
    const { chatId, changeChat } = useChatStore();
    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const db = getFirestore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const toggleProfile = () => {
        setIsProfileOpen((prev) => !prev);
    };

    
    // Steps for Joyride
    const [tourState, setTourState] = useState({
        run: false,
        steps: [
            {
                target: '.chatList',
                content: 'Welcome to the chat!',
                placement: 'center',
                disableBeacon: true
            },
            {
                target: '.menu-button',
                content: 'This is the menu button',
                placement: 'right',
                disableBeacon: true
            },
            {
                target: '.add',
                content: 'Click here to add a new chat',
                placement: 'left',
                disableBeacon: true
            },
            {
                target: '.searchBar',
                content: 'Search for users here',
                placement: 'bottom',
                disableBeacon: true
            }
        ]
    });

    // Check if the tour has been completed previously
    useEffect(() => {
        const hasCompletedGuide = localStorage.getItem("guideCompleted");
        if (!hasCompletedGuide) {
            // Small delay to ensure components are mounted
            const timer = setTimeout(() => {
                setTourState(prev => ({
                    ...prev,
                    run: true
                }));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { action, index, status, type } = data;

        // Handle tour completion
        if (status === 'finished' || action === 'skip') {
            setTourState(prev => ({
                ...prev,
                run: false
            }));
            localStorage.setItem("guideCompleted", "true");
            // Clean up any open states
            setIsMenuOpen(false);
            setAddMode(false);
            return;
        }
        
        // Update UI based on the current step
        if (type === 'step:before') {
            // Reset states before showing new step
            setIsMenuOpen(false);
            setAddMode(false);
            
            // Set appropriate state for the upcoming step
            if (index === 1) { // Menu button step
                setIsMenuOpen(true);
            } else if (index === 2) { // Add button step
                setAddMode(false); // Keep closed initially to show the add button
            } else if (index === 3 && addMode) { // Search step
                // If we're on search step but add mode is open, close it
                setAddMode(false);
            }
        }
    };

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
                const chatData = chatDocSnap.exists() ? chatDocSnap.data() : {};              console.log('chatdata:', chatData);
                const lastMessage = chatData.lastMessage;
                console.log(lastMessage)
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
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside both menu and menu button
            if (
                menuRef.current && 
                !menuRef.current.contains(event.target) &&
                menuButtonRef.current && 
                !menuButtonRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
        };

        // Add event listener
        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    const toggleMenu = (e) => {
        e.stopPropagation();
        setIsMenuOpen(prev => !prev);
    };

    const handleSelect = async (chat) => {
        setSelectedChatId(chat.chatId);
    
        // If this is a new chat being added from AddUser component
        if (!chats.some(c => c.chatId === chat.chatId)) {
            // Just update the UI and chat store without modifying Firestore
            changeChat(chat.chatId, chat.user);
            return;
        }
    
        const updatedChats = chats.map((item) => {
            if (item.chatId === chat.chatId) {
                return { ...item, isSeen: true };
            }
            return item;
        });
    
        // Keep track of statuses when mapping to Firestore format
        const userChats = updatedChats.map((item) => {
            return {
                chatId: item.chatId,
                lastMessage: item.lastMessage || '',
                receiverId: item.receiverId || item.user?.id,
                updatedAt: item.updatedAt || Date.now(),
                isSeen: item.chatId === chat.chatId ? true : item.isSeen,
                status: item.status || 'online',
                receiverStatus: item.receiverStatus || 'offline'
            };
        });
    
        const userChatsRef = doc(db, 'userchats', currentUser.id);
        const chatRef = doc(db, 'chats', chat.chatId);
    
        try {
            // Update user chats document
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
    
            // Update the chat document to record last seen time
            await updateDoc(chatRef, {
                [`lastSeen.${currentUser.id}`]: Date.now()
            });
    
            setChats(updatedChats);
            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.error("Error updating user chats:", err);
        }
    };
    
    // Add a function to update user status (call this on app load/unload)
    const updateUserStatus = async (status) => {
        if (!currentUser?.id) return;
        
        try {
            // Get all chats for the current user
            const userChatsRef = doc(db, 'userchats', currentUser.id);
            const userChatsSnap = await getDoc(userChatsRef);
            
            if (!userChatsSnap.exists()) return;
            
            const userChats = userChatsSnap.data().chats;
            
            // Update status in each chat document
            for (const chat of userChats) {
                // Update the chat document status
                await updateDoc(doc(db, 'chats', chat.chatId), {
                    [`status.${currentUser.id}`]: status
                });
                
                // Update receiver's reference to this user's status
                const receiverChatsRef = doc(db, 'userchats', chat.receiverId);
                const receiverChatsSnap = await getDoc(receiverChatsRef);
                
                if (receiverChatsSnap.exists()) {
                    const receiverChats = receiverChatsSnap.data().chats;
                    const chatIndex = receiverChats.findIndex(rc => rc.chatId === chat.chatId);
                    
                    if (chatIndex !== -1) {
                        receiverChats[chatIndex].receiverStatus = status;
                        
                        await updateDoc(receiverChatsRef, {
                            chats: receiverChats
                        });
                    }
                }
            }
            
            // Update status in user's own chats record
            await updateDoc(userChatsRef, {
                chats: userChats.map(chat => ({
                    ...chat,
                    status: status
                }))
            });
        } catch (err) {
            console.error("Error updating user status:", err);
        }
    };
    
    // Add event listeners for online/offline status in the ChatList component
    useEffect(() => {
        // Set user as online when component mounts
        updateUserStatus('online');
        
        // Set user as offline when component unmounts or window closes
        const handleBeforeUnload = () => {
            updateUserStatus('offline');
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            updateUserStatus('offline');
        };
    }, [currentUser?.id]);

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

    // Handle tour reset for testing purposes
    const resetTour = () => {
        localStorage.removeItem("guideCompleted");
        setTourState(prev => ({
            ...prev,
            run: true
        }));
    };

    return (
        <div className="chatList">
            {isProfileOpen && <UserInfo toggleProfile={toggleProfile} />}
            <Joyride
                callback={handleJoyrideCallback}
                continuous={true}
                run={tourState.run}
                steps={tourState.steps}
                scrollToFirstStep={true}
                showProgress={true}
                showSkipButton={true}
                styles={{
                    options: {
                        zIndex: 1000,
                        primaryColor: '#766ac8',
                        backgroundColor: 'var(--container-color)',
                        textColor: '#fff',
                    },
                    buttonNext: {
                        backgroundColor: 'var(--purple)',
                    },
                    buttonBack: {
                        color: 'var(--red-btn)',
                    }
                }}
                locale={{
                    last: "Finish",
                    skip: "Skip tour"
                }}
                floaterProps={{
                    disableAnimation: true
                }}
            />
            <div className="search">
                <div ref={menuButtonRef} className="menu-button">
                    <MenuIcon
                        isOpen={isMenuOpen}
                        toggleMenu={toggleMenu}
                    />
                </div>
                {isMenuOpen && (
                    <ul className="dropdown-menu" ref={menuRef}>
                        <li className="user"
                            onClick={toggleProfile}>
                            <img className="avatar" src={currentUser.avatar || '../../../../public/avatar.png'} alt="" />
                            <span>{currentUser.username}</span>
                        </li>
                        <li>
                            <MdOutlineSettings />
                            <span>Settings</span>
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
                    ref={addRef}
                    onClick={() => setAddMode(prev => !prev)}
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
                    <div className="user-avatar">
                        <img
                            src={
                                chat.user.blocked.includes(currentUser.id)
                                    ? "./avatar.png"
                                    : chat.user.avatar || "./avatar.png"
                            }
                            alt=""
                        />
                        <div 
                            className={`status-indicator ${chat.receiverStatus || 'offline'}`}
                            title={chat.receiverStatus || 'offline'}
                        ></div>  
                    </div>
                        <div className="texts">
                            <span>
                                {chat.user.blocked.includes(currentUser.id)
                                    ? "Blocked"
                                    : chat.user.username}
                            </span>
                            <span className="lastMessage">{chat.lastMessage || 'No message'}</span>
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
            
            {/* Uncomment this button if you need to reset the tour for testing */}
            {/* <button 
                onClick={resetTour} 
                style={{
                    position: 'absolute', 
                    bottom: '10px', 
                    right: '10px', 
                    zIndex: 1001
                }}
            >
                Reset Tour
            </button> */}
        </div>
    );
};

export default ChatList;