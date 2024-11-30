import React, { useState, useEffect, useRef } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import BlockUser from "./blockUser";
import ChatBgImg from "./chatBgImg/chatBgImg";
import "./chatOptions.css";
import { useChatStore } from "../../lib/chatStore";
import ToggleMute from "../../notification/sounds/ToggleMute";

const ChatOptions = ({ onUploadComplete, currentChatId }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [chatStatus, setChatStatus] = useState("unmute"); // Локальное состояние для статуса
    const optionsRef = useRef(null);
    const { chatId } = useChatStore();

    useEffect(() => {
        console.log("Получен chatId в ChatBgImg:", chatId);
    }, [chatId]);

    const handleStatusChange = (status) => {
        setChatStatus(status); // Обновляем локальный статус при изменении в ToggleMute
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

    // Проверка наличия currentChatId
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
                        onStatusChange={handleStatusChange} // Передаем коллбек для обновления статуса
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