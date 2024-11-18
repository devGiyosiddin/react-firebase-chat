import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import upload from "../lib/upload";
import { FiDelete } from "react-icons/fi";
import { FaArrowDown } from "react-icons/fa";
import { MdAttachFile } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import { SlOptionsVertical } from "react-icons/sl";
import ChatOptions from "./chatOptions/ChatOptions";

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

    const handleBgImgUpload = (url) => {
        setBgImgUrl(url);
    };

    const scrollToDown = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    useEffect(() => {
        scrollToDown();
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(
            doc(db, 'chats', chatId),
            (res) => {
                setChat(res.data());
                scrollToDown();
            }
        );

        return () => {
            unSub();
        }
    }, [chatId]);

    const handleEmoji = (e) => {
        setText(prev => prev + e.emoji);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setOpen(false);
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
            if (img.file) {
                imgUrl = await upload(img.file);
            }
    
            if (audioFile) {
                audioUrl = await upload(audioFile);
            }
    
            const newMessage = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                ...(imgUrl && { img: imgUrl }),
                ...(audioUrl && { audio: audioUrl }),
            };
    
            await updateDoc(doc(db, 'chats', chatId), {
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgUrl && { img: imgUrl }),
                    ...(audioUrl && { audio: audioUrl }),
                }),
                lastMessage: text || "Медиа",
                updatedAt: new Date()
            });            
    
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            console.log("Error on handleSend:", err);
        }
    
        setImg({
            file: null,
            url: ''
        });
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
                        <p>Lorem ipsum dolor sit amet consectetur</p>
                    </div>
                </div>
                <div className="icons">
                    <ChatOptions onUploadComplete={handleBgImgUpload} />
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

                <div className="messages" ref={messagesRef}>
                    {chat?.messages?.map(message => (
                        <div className={message.senderId === currentUser.id ? "message own" : "message"} key={message?.createdAt}>
                            <div className="texts">
                                {message.img && <img src={message.img} alt="" />}
                                {message.audio && <audio controls src={message.audio}></audio>}
                                {message.text &&<p>{message.text}</p>}
                            </div>
                        </div>
                    ))}
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
                            <div className="picker">
                                <EmojiPicker
                                    onEmojiClick={handleEmoji}
                                    theme={Theme.DARK}
                                />
                            </div>
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