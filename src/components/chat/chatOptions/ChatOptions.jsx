import BlockUser from "./blockUser";
import ChatBgImg from "./chatBgImg/chatBgImg";
import "./chatOptions.css";

const ChatOptions = ({ onUploadComplete }) => {
    return (
        <div className="chat-options">
            <div className="options">
                <ChatBgImg onUploadComplete={onUploadComplete} />
                <div className="option">Option 1</div>
                <div className="option">Option 2</div>
                <div className="option">Option 3</div>
                <BlockUser />
            </div>
        </div>
    );
};

export default ChatOptions;