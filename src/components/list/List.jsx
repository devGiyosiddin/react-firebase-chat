import "./list.css";
import { useState } from "react";
import ChatList from "./chatList/ChatList";
import UserInfo from "./userInfo/UserInfo";
import Settings from '../settings/Settings'

const List = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleProfile = () => {
        setIsProfileOpen((prev) => !prev);
    };

    return (
        <div className="list">
            {isProfileOpen && <UserInfo toggleProfile={toggleProfile} />}
            <ChatList toggleProfile={toggleProfile} />
            {/* <Settings /> */}
        </div>
    );
};

export default List;