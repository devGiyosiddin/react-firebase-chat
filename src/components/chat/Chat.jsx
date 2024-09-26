import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import upload from "../lib/upload";
const Chat = () => {
    const [chat, setChat] = useState("");
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({
        file: null,
        url: '',
    });
    const endRef = useRef(null);
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
            })

        return () => {
            unSub();
        }
    }, [chatId]);

    console.log(chat);
    
    const handleEmoji = (e) => {
        setText(prev => prev + e.emoji);
        setOpen(false)
    };

    const handleImg = e => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    };

    const handleSend = async () => {
        if (text === '') return;

        let imgUrl = null;

        try {

            if (img.file) {
                imgUrl = await upload(img.file);
            }

            await updateDoc(doc(db, 'chats', chatId), {
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    ...(imgUrl && {img: imgUrl}),
                })
            });

            const userIds = [currentUser.id, user.id]
            userIds.forEach(async (id) => {

                const userChatsRef = doc(db, 'userchats', id);
                const userChatSnapshot = await getDoc(userChatsRef);
                
                if (userChatSnapshot.exists()) {
                    const userChatsData = userChatSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);
                    
                    userChatsData.chats[chatIndex] = {
                        ...userChatsData.chats[chatIndex],
                        lastMessage: text,
                        isSeen: id === currentUser.id ? true : false,
                        updatedAt: Date.now(),
                    };
                    
                    
                    await updateDoc(userChatsRef, {
                        chats: userChatsData.chats,
                    })
                }
            });

        } catch (err) {
            console.log("Error on handleSend:", err);
        }

        setImg({
            file: null,
            ulr: ''
        })

        setText('');

    }
    
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
                    <input type="file"  id='file' style={{display:'none'}} onChange={handleImg} />
                    <img src="./camera.png" alt="icon" />
                    <img src="./mic.png" alt="icon" />
                </div>
                <input
                    type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You are blocked" : "Type a message..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className="emoji">
                    <img src="./emoji.png"
                        alt="icon" onClick={() => setOpen(prev => !prev)} />
                        <div className="picker">
                            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
                        </div>
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked} >Send</button>
            </div>
        </div>
    )
}
export default Chat