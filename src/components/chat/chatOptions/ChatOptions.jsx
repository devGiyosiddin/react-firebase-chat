import React, { useState, useEffect, useRef } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import BlockUser from "./blockUser";
import ChatBgImg from "./chatBgImg/chatBgImg";
import "./chatOptions.css";

const ChatOptions = ({ onUploadComplete }) => {
    const [isVisible, setIsVisible] = useState(false);
    const optionsRef = useRef(null);

    const toggleOptions = () => {
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
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isVisible]);

    return (
        <div className="chat-options-wrapper">
            <SlOptionsVertical className="options-icon" onClick={toggleOptions} />
            {isVisible && (
                <div className="chat-options" ref={optionsRef}>
                    <ChatBgImg onUploadComplete={onUploadComplete} />
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