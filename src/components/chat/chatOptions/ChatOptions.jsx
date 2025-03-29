import React, { useState, useEffect, useRef } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import BlockUser from "./blockUser";
import ChatBgImg from "./chatBgImg/chatBgImg";
import "./chatOptions.css";
import { useChatStore } from "../../lib/chatStore";
import ToggleMute from "./mute/Mute"; // Update path if needed

const ChatOptions = ({ onUploadComplete, currentChatId, onSoundSettingChange }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [chatSoundSetting, setChatSoundSetting] = useState("unmute");
    const optionsRef = useRef(null);
    const { chatId } = useChatStore();
    
    useEffect(() => {
        console.log("Получен chatId в ChatOptions:", chatId);
    }, [chatId]);
    
    const handleSoundSettingChange = (setting) => {
        setChatSoundSetting(setting);
        // Pass the sound setting up to the parent component (Chat)
        if (onSoundSettingChange) {
            onSoundSettingChange(setting);
        }
    };
    
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
    
    // Check if currentChatId exists
    if (!currentChatId) {
        return <div>Ошибка: chatId отсутствует.</div>;
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
                    <ToggleMute
                        chatId={chatId}
                        onStatusChange={handleSoundSettingChange}
                    />
                    <div className="option">Option 2</div>
                    <div className="option">Option 3</div>
                    <BlockUser />
                </div>
            )}
        </div>
    );
};

export default ChatOptions;