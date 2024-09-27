import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../lib/chatStore";
import { auth, db } from "../lib/firebase";
import { useUserStore } from "../lib/userStore";
import "./detail.css";

const Detail = () => {

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

    return (
        <div className="detail">
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="user image" />
                <h2>{user?.username}</h2>
                <p>Lorem ipsum dolor sit amet.</p>
            </div>
            <div className="info">
                <div className="option" onClick={openItem}>
                    <div className="title">
                        <span>Chat settings</span>
                        <img src="./arrowUp.png" alt="icon" />
                    </div>
                </div>
                <div className="option" onClick={openItem}>
                    <div className="title">
                        <span>Privacy & help</span>
                        <img src="./arrowUp.png" alt="icon" />
                    </div>
                </div>
                <div className="option" onClick={openItem}>
                    <div className="title">
                        <span>Share photos</span>
                        <img src="./arrowDown.png" alt="icon" />
                    </div>
                    <div className="photos">
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="https://picsum.photos/200" alt="picsum image" />
                                <span>photo_2024_2.png</span>
                            </div>
                            <img src="./download.png" alt="icon" className="icon" />
                        </div>
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="https://picsum.photos/200" alt="picsum image" />
                                <span>photo_2024_2.png</span>
                            </div>
                            <img src="./download.png" alt="icon" className="icon" />
                        </div>
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="https://picsum.photos/200" alt="picsum image" />
                                <span>photo_2024_2.png</span>
                            </div>
                            <img src="./download.png" alt="icon" className="icon" />
                        </div>
                    </div>
                </div>
                <div className="option" onClick={openItem}>
                    <div className="title">
                        <span>Shared files</span>
                        <img src="./arrowUp.png" alt="icon" />
                    </div>
                </div>
                <button onClick={handleBlock}>
                    {isCurrentUserBlocked ? "You are blocked!" : isReceiverBlocked ? 'User blocked' : "Block user"}
                </button>
            <button className="logout" onClick={() => auth.signOut()}>Log out</button>
            </div>
        </div>
    )
}
export default Detail;
