import "./blockUser.css";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../../lib/chatStore";
import { db } from "../../../lib/firebase";
import { useUserStore } from "../../../lib/userStore";
import { MdBlock } from "react-icons/md";

const BlockUser = () => {
    const { user, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();

    const handleBlock = async () => {
        if (!user) return;

        const userDocRef = doc(db, 'users', currentUser.id);
        try { 
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        
        <div style={{ color: isReceiverBlocked ? "var(--icon-green)" : "tomato" }} className="option option-block" onClick={handleBlock}>
            <MdBlock style={{color: 'inherit'}} className="option-icon option-block-icon" />
            {isReceiverBlocked ? "Unblock User" : "Block User"}
        </div>
    );
};

export default BlockUser;