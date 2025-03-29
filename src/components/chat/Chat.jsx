import { useCallback, useEffect, useRef, useState, Suspense, memo } from "react";
import "./chat.css";
import EmojiPickerComponent from "./emoji/EmojiPickerComponent";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import upload from "../lib/upload";
import { FiDelete } from "react-icons/fi";
import { FaArrowDown } from "react-icons/fa";
import { MdAttachFile } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { IoVolumeMuteOutline, IoVolumeHighOutline } from "react-icons/io5"; // Иконки для звука
import ChatOptions from "./chatOptions/ChatOptions";
import { saveBackgroundImageUrl } from "../lib/firebase";
import { PiMicrophone, PiMicrophoneFill } from "react-icons/pi";
import { MdOutlineStop } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaCamera, FaStop } from "react-icons/fa";
import CameraCapture from "./capturePhoto/webcam";

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
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioRecorder, setAudioRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [audioStream, setAudioStream] = useState(null);
    const [isAudioInputActive, setIsAudioInputActive] = useState(false);
    
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
    const [lastMessageId, setLastMessageId] = useState(null);
    const recordingTimerRef = useRef(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef(null);
    const [userSoundSetting, setUserSoundSetting] = useState("unmute"); // Настройка текущего пользователя
    const sendSound = "/src/components/notification/sounds/send.mp3";
    const getSound = "/src/components/notification/sounds/get.mp3";
    const deleteSound = "/src/components/notification/sounds/delete.mp3";

    const handleSoundSettingChange = (setting) => {
        console.log("Sound setting changed to:", setting);
        setUserSoundSetting(setting);
    };

    // The playSound function can stay the same
    const playSound = (soundPath) => {
        console.log("Attempting to play sound, current setting:", userSoundSetting);
        if (userSoundSetting !== 'mute') {
            const audio = new Audio(soundPath);
            audio.play().catch((err) => console.error("Error playing sound:", err));
        } else {
            console.log("Sound is muted, not playing.");
        }
    };

    useEffect(() => {
        if (editingMessage) {
            setEditingText(editingMessage.text || "");
        }
    }, [editingMessage]);

    // Функции для записи голоса
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);
            const mediaRecorder = new MediaRecorder(stream);
            setAudioRecorder(mediaRecorder);
            
            const chunks = [];
            setAudioChunks(chunks);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                    setAudioChunks([...chunks]);
                }
            };
            
            setIsRecording(true);
            setRecordingTime(0);
            
            // Запускаем таймер для обновления времени записи
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
            mediaRecorder.start(300); // Собираем данные каждые 300ms
            setIsAudioInputActive(true);
            
        } catch (err) {
            console.error("Ошибка при запуске записи:", err);
            setIsRecording(false);
        }
    };
    
    const stopRecording = () => {
        if (audioRecorder && isRecording) {
            audioRecorder.stop();
            clearInterval(recordingTimerRef.current);
            
            audioRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                setAudioFile(audioBlob);
                
                // Останавливаем все треки в потоке
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
                
                setIsRecording(false);
                setAudioStream(null);
                
            };
        }
    };
    
    const cancelRecording = () => {
        if (audioRecorder && isRecording) {
            audioRecorder.stop();
            clearInterval(recordingTimerRef.current);
            
            // Останавливаем все треки в потоке
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
            
            setIsRecording(false);
            setAudioStream(null);
            setAudioFile(null);
            setAudioChunks([]);
        }
    };
    
    // Форматирование времени записи
    const formatRecordingTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

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

    const handleEmoji = useCallback((e) => {
        if (e?.emoji) {
            setText((prev) => prev + e.emoji);
        }
    }, []);

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
        setOpenFileList(false);
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };
    
    const handleCameraOpen = () => {
        setOpenFileList(false);
        setIsCameraActive(true);
    };

    const handlePhotoCaptured = (imageDataUrl) => {
        // Convert dataURL to Blob
        const dataURLtoBlob = (dataURL) => {
            // Split the dataURL to get the base64 data
            const byteString = atob(dataURL.split(',')[1]);
            
            // Extract the MIME type
            const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
            
            // Create an ArrayBuffer and Uint8Array
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
    
            // Create and return a Blob
            return new Blob([ab], {type: mimeString});
        };
    
        const blob = dataURLtoBlob(imageDataUrl);
        
        if (blob) {
            setImg({
                file: blob,
                url: URL.createObjectURL(blob)
            });
            setIsCameraActive(false);
        }
    };

    const closeCameraCapture = () => {
        setIsCameraActive(false);
    };
    
    
    const removeImg = () => {
        setImg({
            file: null,
            url: null,
        });
    }

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
        setIsAudioInputActive(false);
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

    // Проверяем, должна ли кнопка отправки показывать микрофон
    const shouldShowMicButton = !text && !img.file && !audioFile && !isRecording;

    // Обработчик нажатия кнопки отправки/записи
    const handleSendButtonClick = () => {
        if (shouldShowMicButton) {
            startRecording();
        } else {
            handleSend();
        }
    };

    useEffect(() => {
        console.log("Sound setting changed in Chat component:", userSoundSetting);
    }, [userSoundSetting]);

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
                <ChatOptions 
                    currentChatId={currentChatId}
                    onUploadComplete={handleBgImgUpload} 
                    onSoundSettingChange={handleSoundSettingChange} 
                />
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
                            {/* <img src={img.url} alt="" /> */}
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
                {isRecording && (
                    <div className="recording-indicator">
                        <div className="recording-wave">
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                            <span className="wave-bar"></span>
                        </div>
                        <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                        <div className="recording-actions">
                            <button onClick={cancelRecording} className="cancel-recording">
                                <RiDeleteBin6Line size={20} />
                            </button>
                            <button onClick={stopRecording} className="stop-recording">
                                <MdOutlineStop size={20} />
                            </button>
                        </div>
                    </div>
                )}
                
                {!isRecording && (
                    <div className="input-inner">
                            <EmojiPickerComponent onEmojiSelect={handleEmoji} />
                        {/* <div className="emoji" ref={emojiPickerRef}>
                            <BsEmojiSmile className="emoji-icon"
                                onClick={() => setOpen(prev => !prev)} />
                            {open && (
                                <Suspense fallback={<div>Loading...</div>}>
                                    <div className="picker">
                                    </div>
                                </Suspense>
                            )}
                        </div> */}
                        <input
                            type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You are blocked" : "Type a message..."}
                            value={text}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
                                    <img src="./img.png" alt="Upload" />
                                </label>
                                <input 
                                    type="file" 
                                    id='file' 
                                    style={{ display: 'none' }} 
                                    onChange={handleImg} 
                                />
                                <img 
                                    src="./camera.png" 
                                    alt="Open Camera" 
                                    onClick={handleCameraOpen} 
                                />
                            </div>
                        )}
                        <FiDelete onClick={removeText} className="removeText" />
                    </div>
                )}
                
                <button
                    className={`sendButton ${shouldShowMicButton ? 'mic-button' : ''} ${isRecording ? 'recording' : ''}`}
                    onClick={handleSendButtonClick}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                    >
                    {shouldShowMicButton ? (
                        <PiMicrophone size={24} />
                    ) : (
                        <MdOutlineKeyboardDoubleArrowRight size={28} />
                    )}
                </button>
            </div>

            {/* Camera Capture Modal */}
            {isCameraActive && (
                <CameraCapture 
                onCapture={handlePhotoCaptured}
                    onClose={closeCameraCapture}
                />
            )}

            {/* Audio preview */}
            {audioFile && (
                <div className="audioPreview">
                    <audio controls src={audioFile} />
                    <button 
                        title="Remove the audio" 
                        className="removeAudioBtn" 
                        onClick={cancelRecording}
                    >
                        <RiDeleteBin6Line size={20} />
                    </button>
                </div>
            )}        

            {img.file && (
                <div className="imgPreview">
                    <img className="img" src={img.url} alt="Preview" />
                    <button 
                        title="Remove the image" 
                        className="removeImgBtn" 
                        onClick={removeImg}
                    >
                        <RiDeleteBin6Line size={20} />
                    </button>
                </div>
            )}
        </div>
        </div>
        </div>
    );
}

export default Chat;