import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import upload from "../lib/upload";
import { FiDelete } from "react-icons/fi";
import { FaArrowDown } from "react-icons/fa";
import { MdAttachFile } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import { IoVolumeMuteOutline, IoVolumeHighOutline } from "react-icons/io5"; // Иконки для звука
import ChatOptions from "./chatOptions/ChatOptions";
import { saveBackgroundImageUrl } from "../lib/firebase";

const Chat = ({ onInfoClick }) => {
    const [chat, setChat] = useState("");
    const [open, setOpen] = useState(false);
    const [openFileList, setOpenFileList] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: '',
    });
    const [audioFile, setAudioFile] = useState(null);
    const endRef = useRef(null);
    const emojiPickerRef = useRef(null); 
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
    const { currentUser } = useUserStore();
    const [showScrollDown, setShowScrollDown] = useState(false);
    const messagesRef = useRef(null);
    const [bgImgUrl, setBgImgUrl] = useState("");
    const [showOptions, setShowOptions] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [currentChatId, setCurrentChatId] = useState('1234');
    const currentUserId = auth.currentUser.uid;
    
    // Персональные настройки звука
    const [userSoundSetting, setUserSoundSetting] = useState("unmute"); // Настройка текущего пользователя
    const [lastMessageId, setLastMessageId] = useState(null);
    
    const sendSound = "/src/components/notification/sounds/send.mp3";
    const getSound = "/src/components/notification/sounds/get.mp3";
    const deleteSound = "/src/components/notification/sounds/delete.mp3";
    
    // Получение персональных настроек звука при инициализации
    useEffect(() => {
        const getUserSoundSettings = async () => {
            try {
                // Получаем настройки из коллекции пользователей
                const userDoc = await getDoc(doc(db, 'users', currentUserId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.soundSettings && userData.soundSettings[chatId]) {
                        setUserSoundSetting(userData.soundSettings[chatId]);
                    } else {
                        // Если настроек для этого чата нет, устанавливаем по умолчанию
                        const initialSetting = "unmute";
                        await updateUserSoundSetting(initialSetting);
                        setUserSoundSetting(initialSetting);
                    }
                }
            } catch (err) {
                console.error("Ошибка при получении настроек звука пользователя:", err);
            }
        };
        
        if (chatId && currentUserId) {
            getUserSoundSettings();
        }
    }, [chatId, currentUserId]);

    // Обновление настроек звука пользователя
    const updateUserSoundSetting = async (newSetting) => {
        try {
            const userRef = doc(db, 'users', currentUserId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentSettings = userData.soundSettings || {};
                
                // Обновляем настройки для конкретного чата
                await updateDoc(userRef, {
                    soundSettings: {
                        ...currentSettings,
                        [chatId]: newSetting
                    }
                });
            } else {
                // Если документ пользователя не существует, создаем его
                await updateDoc(userRef, {
                    soundSettings: {
                        [chatId]: newSetting
                    }
                });
            }
        } catch (err) {
            console.error("Ошибка при обновлении настроек звука:", err);
        }
    };

    // Воспроизведение звука с учетом персональных настроек
    const playSound = (soundPath) => {
        if (userSoundSetting !== 'mute') {
            const audio = new Audio(soundPath);
            audio.play().catch((err) => console.error("Error playing sound:", err));
        }
    };
    
    // Переключение режима звука
    const toggleSoundMode = async () => {
        const newMode = userSoundSetting === 'mute' ? 'unmute' : 'mute';
        await updateUserSoundSetting(newMode);
        setUserSoundSetting(newMode);
    };

    useEffect(() => {
        if (editingMessage) {
            setEditingText(editingMessage.text || "");
        }
    }, [editingMessage]);

    const handleEditMessage = async (messageId, newText) => {
        try {
            const updatedMessages = chat.messages.map((message) =>
                message.createdAt.seconds === messageId
                    ? { ...message, text: newText }
                    : message
            );
            await updateDoc(doc(db, "chats", chatId), {
                messages: updatedMessages,
                lastMessage: newText || chat.lastMessage,
            });
            setChat((prev) => ({ ...prev, messages: updatedMessages }));
        } catch (err) {
            console.error("Error editing message:", err);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            const updatedMessages = chat.messages.filter(
                (message) => message.createdAt.seconds !== messageId
            );

            await updateDoc(doc(db, "chats", chatId), {
                messages: updatedMessages,
                lastMessage:
                    updatedMessages.length > 0
                        ? updatedMessages[updatedMessages.length - 1].text || "Медиа"
                        : "",
            });
            playSound(deleteSound);
            setChat((prev) => ({ ...prev, messages: updatedMessages }));
        } catch (err) {
            console.error("Error deleting message:", err);
        }
    };

    const handleContextMenu = (e, message) => {
        e.preventDefault(); // Предотвращаем стандартное контекстное меню
        
        // Получаем размеры окна
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Получаем координаты клика
        let x = e.clientX;
        let y = e.clientY;
        
        // Создаем виртуальный элемент для расчета размеров меню
        const menuWidth = 150; // Примерная ширина меню
        const menuHeight = 80; // Примерная высота меню
        
        // Корректируем позицию, если меню выходит за пределы окна
        if (x + menuWidth > windowWidth) {
            x = windowWidth - menuWidth;
        }
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight;
        }
        
        setContextMenu({ x, y, message });
    };

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const saveEditedMessage = () => {
        if (editingMessage && editingText.trim()) {
            handleEditMessage(editingMessage.createdAt.seconds, editingText);
            setEditingMessage(null);
            setEditingText("");
        }
    };

    const handleBgImgUpload = async (url) => {
        try {
            await saveBackgroundImageUrl(chatId, url);
            setBgImgUrl(url);
        } catch (err) {
            console.error("Ошибка при загрузке фонового изображения:", err);
        }
    };

    const scrollToDown = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    useEffect(() => {
        scrollToDown();
    }, []);

    useEffect(() => {
        const chatRef = doc(db, 'chats', chatId);
    
        const unSub = onSnapshot(chatRef, async (res) => {
            if (!res.exists()) return;
    
            const chatData = res.data();
            setChat(chatData);
            setBgImgUrl(chatData?.bgImgUrl || "");
    
            const messages = chatData?.messages || [];
            const lastMessage = messages[messages.length - 1]; // Get the last message

            // Проверяем необходимость воспроизведения звука для входящего сообщения
            if (
                lastMessage && 
                lastMessage.senderId !== currentUserId && 
                lastMessageId !== lastMessage.createdAt?.seconds &&
                userSoundSetting !== 'mute' // Используем локальную настройку пользователя
            ) {
                playSound(getSound);
                setLastMessageId(lastMessage.createdAt?.seconds); // Update lastMessageId to prevent duplicate sounds
            }
    
            scrollToDown();
        });
    
        return () => {
            unSub();
        };
    }, [chatId, currentUserId, lastMessageId, userSoundSetting]);    

    const handleEmoji = (e) => {
        if (e?.emoji) {
            setText((prev) => prev + e.emoji);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [emojiPickerRef]);

    const handleImg = e => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            video.pause();
            stream.getTracks().forEach(track => track.stop());
            const imgDataUrl = canvas.toDataURL('image/jpeg');
            const response = await fetch(imgDataUrl);
            const blob = await response.blob();
            setImg({
                file: blob,
                url: imgDataUrl,
            });
        } catch (err) {
            console.log("Camera error:", err);
        }
    };

    const handleVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                setAudioFile(audioBlob);
            };
            mediaRecorder.start();
            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);
        } catch (err) {
            console.log("Voice error:", err);
        }
    };

    const removeText = () => {
        setText(prev => prev.slice(0, -1));
    };

    const handleSend = async () => {
        if (text === '' && !img.file && !audioFile) return;
    
        let imgUrl = null;
        let audioUrl = null;
    
        try {
            if (img.file) imgUrl = await upload(img.file);
            if (audioFile) audioUrl = await upload(audioFile);
    
            const newMessage = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                ...(imgUrl && { img: imgUrl }),
                ...(audioUrl && { audio: audioUrl }),
            };
    
            await updateDoc(doc(db, 'chats', chatId), {
                messages: arrayUnion(newMessage),
                lastMessage: text || "Медиа",
                updatedAt: new Date(),
            });
    
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
            
            // Воспроизводим звук отправки с учетом настроек текущего пользователя
            if (userSoundSetting !== 'mute') {
                playSound(sendSound);
            }
        } catch (err) {
            console.log("Error on handleSend:", err);
        }
    
        setImg({ file: null, url: '' });
        setAudioFile(null);
        setText('');
        setOpenFileList(false);
    };

    const handleScroll = () => {
        const scrollTop = messagesRef.current.scrollTop;
        const scrollHeight = messagesRef.current.scrollHeight;
        const clientHeight = messagesRef.current.clientHeight;
    
        if (scrollTop + clientHeight < scrollHeight - 100) {
            setShowScrollDown(true);
        } else {
            setShowScrollDown(false);
        }
    };

    useEffect(() => {
        const messagesElement = messagesRef.current;
        messagesElement?.addEventListener("scroll", handleScroll);
    
        return () => {
            messagesElement?.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" onClick={onInfoClick} />
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p className="user-bio">
                            {user?.bio || ""}
                        </p>
                    </div>
                            {userSoundSetting === 'mute' && <span
                                className="mute-indicator">
                                    <IoVolumeMuteOutline className="sound-icon-small muted" />
                                </span>
                            }
                </div>
                <div className="icons">
                    <div 
                        className="sound-control" 
                        title={userSoundSetting === 'mute' ? 'Включить уведомления' : 'Отключить уведомления'}
                        onClick={toggleSoundMode}
                    >
                        {userSoundSetting === 'mute' ? (
                            <IoVolumeMuteOutline size={24} className="sound-icon muted" />
                        
                        ) : (
                            <IoVolumeHighOutline size={24} className="sound-icon" />
                        )}
                    </div>
                    <ChatOptions currentChatId={currentChatId} onUploadComplete={handleBgImgUpload} />
                </div>
            </div>
            <div className="chat">
                <div 
                    id="center-bgImg" 
                    className="center" 
                    style={{ 
                        backgroundImage: bgImgUrl ? `url(${bgImgUrl})` : `url('../../../public/chat-bg-img.jpg')`, 
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat"
                    }}
                >

                <div className="messages" ref={messagesRef} onClick={closeContextMenu}>
                    {chat?.messages?.map(message => (
                        <div
                            className={message.senderId === currentUser.id ? "message own" : "message"}
                            key={message?.createdAt}
                            onContextMenu={(e) => handleContextMenu(e, message)}
                        >
                            <div className="texts">
                                {message.img && <img src={message.img} alt="" />}
                                {message.audio && <audio controls src={message.audio}></audio>}
                                {message.text && <p>{message.text}</p>}
                            </div>
                        </div>
                    ))}
                    {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={() => {
                            setEditingMessage(contextMenu.message);
                            setContextMenu(null);
                        }}
                    >
                        ✏️ Изменить
                    </button>
                    <button
                        onClick={() => {
                            handleDeleteMessage(contextMenu.message.createdAt.seconds);
                            setContextMenu(null);
                        }}
                    >
                        🗑️ Удалить
                    </button>
                </div>
            )}

            {editingMessage && (
                <div className="edit-message">
                    <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEditedMessage()}
                    />
                    <button onClick={saveEditedMessage}>💾 Сохранить</button>
                    <button onClick={() => setEditingMessage(null)}>❌ Отмена</button>
                </div>
            )}
                    {img.url && <div className="message own">
                        <div className="texts">
                            <img src={img.url} alt="" />
                        </div>
                    </div>}
                    <div ref={endRef}></div>
                    {showScrollDown && (
                        <button onClick={scrollToDown} id="scrollDownBtn">
                            <FaArrowDown />
                        </button>
                    )}
                    

                </div>

            <div className="send-wrapper">
                <div className="input-inner">
                    <div className="emoji" ref={emojiPickerRef}>
                        <BsEmojiSmile className="emoji-icon"  onClick={() => setOpen(prev => !prev)} />
                        {open && (
                            <Suspense fallback={<div>Loading...</div>}>
                                <div className="picker">
                                    <EmojiPicker
                                        onEmojiClick={handleEmoji}
                                        theme={Theme.DARK}
                                    />
                                </div>
                            </Suspense>
                        )}
                    </div>
                    <input
                        type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You are blocked" : "Type a message..."}
                        value={text}
                        onKeyDown={(e) => e.key  === 'Enter' && handleSend()}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isCurrentUserBlocked || isReceiverBlocked}
                        />
                    <MdAttachFile 
                        onClick={() => setOpenFileList(!openFileList)}
                        className="file" 
                    />
                    {openFileList && (
                        <div className="icons">
                            <label htmlFor="file">
                                <img src="./img.png" alt="" />
                            </label>
                            <input type="file" id='file' style={{ display: 'none' }} onChange={handleImg} />
                            <img src="./camera.png" alt="" onClick={handleCamera} />
                            <img src="./mic.png" alt="" onClick={handleVoice} />
                        </div>
                    )}
                    <FiDelete onClick={removeText} className="removeText" />
                    
                </div>
                    <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
                </div>
            </div>
            </div>
        </div>
    );
}

export default Chat;