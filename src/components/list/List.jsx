import "./list.css";
import { useState } from "react";
import ChatList from "./chatList/ChatList";
import UserInfo from "./userInfo/UserInfo";

const List = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleProfile = () => {
        setIsProfileOpen((prev) => !prev);
    };

    return (
        <div className="list">
            {isProfileOpen && <UserInfo toggleProfile={toggleProfile} />}
            <ChatList toggleProfile={toggleProfile} />
        </div>
    );
};

export default List;