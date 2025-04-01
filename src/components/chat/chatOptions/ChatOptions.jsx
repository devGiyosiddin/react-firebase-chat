import React, { useState, useEffect, useRef } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import BlockUser from "./blockUser";
import ChatBgImg from "./chatBgImg/chatBgImg";
import "./chatOptions.css";
import { useChatStore } from "../../lib/chatStore";
import ToggleMute from "./mute/Mute";

const ChatOptions = ({ onUploadComplete, currentChatId, onSoundSettingChange }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [chatSoundSetting, setChatSoundSetting] = useState("unmute");
    const optionsRef = useRef(null);
    const { chatId } = useChatStore();
    
    // Use currentChatId from props or chatId from store
    const activeChatId = currentChatId || chatId;
    
    useEffect(() => {
        console.log("ChatOptions using chatId:", activeChatId);
    }, [activeChatId]);
    
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
    
    // Check if activeChatId exists
    if (!activeChatId) {
        return <div>Ошибка: chatId отсутствует.</div>;
    }
    
    return (
        <div className="chat-options-wrapper" ref={optionsRef}>
            <SlOptionsVertical
                className="chatOptions-icon"
                onClick={toggleOptions}
                size={24}
            />
            {isVisible && (
                <div className="chat-options">
                    <ChatBgImg chatId={activeChatId} onUploadComplete={onUploadComplete} />
                    <ToggleMute
                        chatId={activeChatId}
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