import "./userInfo.css";
import { FaPaintBrush } from "react-icons/fa";
import { useUserStore } from "../../../components/lib/userStore";
import { FaArrowLeftLong } from "react-icons/fa6";
import { MdOutlineEdit } from "react-icons/md";

// TODO: Реализовать функционал редактирования профиля и стилизации
const UserInfo = ({ toggleProfile }) => {
    const { currentUser } = useUserStore();
    return (
        <div className="userInfo-modal">
            <div className="userInfo">
                <div className="header">
                    <FaArrowLeftLong onClick={toggleProfile} className="close" size={32} />
                    <h3 className="title">Profile</h3>
                    <MdOutlineEdit className="edit-profile" size={32} color="var(--btn-blue)" />
                </div>
                <div className="user">
                    <div className="img__wrappper">
                        <img src={currentUser.avatar || "../../../../public/avatar.png"} alt="User Avatar" />
                        <FaPaintBrush size={30} className="edit-icon" />
                    </div>
                    <h2 className="username">{currentUser.username}</h2>
                    <p className="status">{currentUser.bio || "No bio"}</p>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;