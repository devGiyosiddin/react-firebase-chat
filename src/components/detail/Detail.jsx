import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../lib/chatStore";
import { db } from "../lib/firebase";
import { useUserStore } from "../lib/userStore";
import { ChevronLeft, CircleX } from "lucide-react";
import { useState } from "react";
import "./detail.css";

const Detail = ({onChangeState}) => {
    const [showAvatarPreview, setShowAvatarPreview] = useState(false);
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();

    const openItem = (e) =>  {
        const item = e.currentTarget;
        item.classList.toggle("active");
    }

    const handleBlock = async () => {
        if (!user) return;

        const userDocRef = doc(db, 'users', currentUser.id)
        try { 
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock()
        } catch (err) {
            console.log(err);
        }
    }

    const handleAvatarClick = () => {
        setShowAvatarPreview(true);
    }

    const closeAvatarPreview = () => {
        setShowAvatarPreview(false);
    }

    return (
        <div className="detail-wrapper">
            <div className="detail">
                <button type="button" className="close-icon" onClick={() => onChangeState(false)}>
                    <ChevronLeft size={28}/>
                </button>
                
                <div className="user">
                    <img 
                        src={user?.avatar || "./avatar.png"} 
                        alt="" 
                        onClick={handleAvatarClick}
                        className="avatar-image" 
                    />
                    <h2 className="username">{user?.username}</h2>
                    <p className="bio">{user?.bio || "No bio"}</p>
                </div>
                <div className="info">
                    <div className="option" onClick={openItem}>
                        <div className="title">
                            <span>Chat settings</span>
                            <img src="./arrowUp.png" alt="" />
                        </div>
                    </div>
                    <div className="option" onClick={openItem}>
                        <div className="title">
                            <span>Privacy & help</span>
                            <img src="./arrowUp.png" alt="" />
                        </div>
                    </div>
                    <div className="option" onClick={openItem}>
                        <div className="title">
                            <span>Share photos</span>
                            <img src="./arrowDown.png" alt="" />
                        </div>
                        <div className="photos">
                            <div className="photoItem">
                                <div className="photoDetail">
                                    <img src="https://picsum.photos/200" alt="" />
                                    <span>photo_2024_2.png</span>
                                </div>
                                <img src="./download.png" alt="" className="icon" />
                            </div>
                            <div className="photoItem">
                                <div className="photoDetail">
                                    <img src="https://picsum.photos/200" alt="" />
                                    <span>photo_2024_2.png</span>
                                </div>
                                <img src="./download.png" alt="" className="icon" />
                            </div>
                            <div className="photoItem">
                                <div className="photoDetail">
                                    <img src="https://picsum.photos/200" alt="" />
                                    <span>photo_2024_2.png</span>
                                </div>
                                <img src="./download.png" alt="" className="icon" />
                            </div>
                        </div>
                    </div>
                    <div className="option" onClick={openItem}>
                        <div className="title">
                            <span>Shared files</span>
                            <img src="./arrowUp.png" alt="" />
                        </div>
                    </div>
                    <button onClick={handleBlock}>
                        {isCurrentUserBlocked ? "You are blocked!" : isReceiverBlocked ? 'User blocked' : "Block user"}
                    </button>
                </div>
            </div>

            {/* Avatar Preview Modal */}
            {showAvatarPreview && (
                <div className="avatar-preview-overlay" onClick={closeAvatarPreview}>
                    <div className="avatar-preview-container" onClick={(e) => e.stopPropagation()}>
                        <button className="avatar-preview-close" onClick={closeAvatarPreview}>
                            <CircleX size={24} />
                        </button>
                        <img 
                            src={user?.avatar || "./avatar.png"} 
                            alt={`${user?.username}'s avatar`} 
                            className="avatar-preview-image" 
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
export default Detail;