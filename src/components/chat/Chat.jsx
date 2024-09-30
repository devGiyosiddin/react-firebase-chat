import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import upload from "../lib/upload";
import { FiDelete } from "react-icons/fi";

const Chat = () => {
    const [chat, setChat] = useState("");
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: '',
    });
    const [audioFile, setAudioFile] = useState(null); // Для голосовых
    const endRef = useRef(null);
    const emojiPickerRef = useRef(null); // Создаем ref для emoji-picker
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
    const { currentUser } = useUserStore();
    
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(
            doc(db, 'chats', chatId),
            (res) => {
                setChat(res.data());
                endRef.current?.scrollIntoView({ behavior: 'smooth' }); // Скролл вниз при получении сообщения
            }
        );

        return () => {
            unSub();
        }
    }, [chatId]);

    const handleEmoji = (e) => {
        setText(prev => prev + e.emoji); // Добавляем эмодзи к тексту
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setOpen(false); // Закрываем emoji-picker при клике вне его области
            }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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

            // Делание снимка
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            video.pause();
            stream.getTracks().forEach(track => track.stop()); // Останавливаем камеру

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
                mediaRecorder.stop(); // Останавливаем запись через 5 секунд (или по другому условию)
            }, 5000);
        } catch (err) {
            console.log("Voice error:", err);
        }
    };

    const removeText = () => {
        // remove last character from input value
        setText(prev => prev.slice(0, -1));
    };

    const handleSend = async () => {
        if (text === '' && !img.file && !audioFile) return;

        let imgUrl = null;
        let audioUrl = null;

        try {
            if (img.file) {
                imgUrl = await upload(img.file);
            }

            if (audioFile) {
                audioUrl = await upload(audioFile); // Логика загрузки аудио
            }

            await updateDoc(doc(db, 'chats', chatId), {
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgUrl && { img: imgUrl }),
                    ...(audioUrl && { audio: audioUrl }), // Добавляем аудио
                })
            });

            endRef.current?.scrollIntoView({ behavior: 'smooth' }); // Скролл вниз при отправке сообщения
        } catch (err) {
            console.log("Error on handleSend:", err);
        }

        setImg({
            file: null,
            url: ''
        });

        setAudioFile(null);
        setText('');
    };

    return (
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="user img" />
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p>Lorem ipsum dolor sit amet consectetur</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="icon" />
                    <img src="./video.png" alt="icon" />
                    <img src="./info.png" alt="icon" />
                </div>
            </div>
            <div className="center">
                {chat?.messages?.map(message => (
                    <div className={message.senderId === currentUser.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className="texts">
                            {message.img && <img src={message.img} alt="User image" />}
                            {message.audio && <audio controls src={message.audio}></audio>} {/* Воспроизведение аудио */}
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
                {img.url && <div className="message own">
                    <div className="texts">
                        <img src={img.url} alt="" />
                    </div>
                </div>}
                <div ref={endRef}></div>
            </div>

            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="icon" />
                    </label>
                    <input type="file" id='file' style={{ display: 'none' }} onChange={handleImg} />
                    <img src="./camera.png" alt="icon" onClick={handleCamera} />
                    <img src="./mic.png" alt="icon" onClick={handleVoice} />
                </div>
                <input
                    type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You are blocked" : "Type a message..."}
                    value={text}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <FiDelete onClick={removeText} className="removeText" />
                <div className="emoji" ref={emojiPickerRef}>
                    <img src="./emoji.png" alt="icon" onClick={() => setOpen(prev => !prev)} />
                    {open && (
                        <div className="picker">
                            <EmojiPicker 
                                onEmojiClick={handleEmoji} 
                                theme={Theme.DARK} 
                            />
                        </div>
                    )}
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
            </div>
        </div>
    );
};

export default Chat;