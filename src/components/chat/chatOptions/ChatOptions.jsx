import ChatBgImg from "../chatBgImg/chatBgImg";
import "./chatOptions.css";
import { IoImagesOutline } from "react-icons/io5";

const ChatOptions = ({ onUploadComplete }) => {
    return (
        <div className="chat-options">
            <div className="options">
                <div className="option">
                    <IoImagesOutline className="option-icon" />
                    <ChatBgImg onUploadComplete={onUploadComplete} />
                </div>
                <div className="option">Option 1</div>
                <div className="option">Option 2</div>
                <div className="option">Option 3</div>
            </div>
        </div>
    );
};

export default ChatOptions;