import React, { useState, useEffect, useRef } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import BlockUser from "./blockUser";
import ChatBgImg from "./chatBgImg/chatBgImg";
import "./chatOptions.css";
import { useChatStore } from "../../lib/chatStore";

const ChatOptions = ({ onUploadComplete, currentChatId }) => {
    const [isVisible, setIsVisible] = useState(false);
    const optionsRef = useRef(null);
    const { chatId } = useChatStore();

    useEffect(() => {
        console.log("Received chatId in ChatBgImg:", chatId);
      }, [chatId]);

    const toggleOptions = (e) => {
        e.stopPropagation();
        setIsVisible((prev) => !prev);
    };

    const handleOutsideClick = (e) => {
        if (optionsRef.current && !optionsRef.current.contains(e.target)) {
            setIsVisible(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            document.addEventListener("mousedown", handleOutsideClick);
        } else {
            document.removeEventListener("mousedown", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isVisible]);

    // Проверка наличия currentChatId
    if (!currentChatId) {
        return <div>Error: chatId is missing.</div>;
    }

    return (
        <div className="chat-options-wrapper" ref={optionsRef}>
            <SlOptionsVertical
                className="options-icon"
                onClick={toggleOptions}
            />
            {isVisible && (
                <div className="chat-options">
                    <ChatBgImg chatId={chatId} onUploadComplete={onUploadComplete} />
                    <div className="option">Option 1</div>
                    <div className="option">Option 2</div>
                    <div className="option">Option 3</div>
                    <BlockUser />
                </div>
            )}
        </div>
    );
};

export default ChatOptions;