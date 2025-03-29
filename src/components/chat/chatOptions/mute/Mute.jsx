import './mute.css';

import { IoVolumeMediumOutline, IoVolumeMuteOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const ToggleMute = ({ chatId, onStatusChange }) => {
    const [status, setStatus] = useState("unmute");
    const [userSoundSetting, setUserSoundSetting] = useState("unmute");

    useEffect(() => {
        if (!chatId) {
            console.error("chatId is undefined or null");
            return;
        }
   
        const chatRef = doc(db, "chats", chatId);
        const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const chatStatus = docSnapshot.data().status || "unmute";
                setStatus(chatStatus);
                if (onStatusChange) {
                    onStatusChange(chatStatus);
                }
            } else {
                console.error(`No document exists for chat ID: ${chatId}`);
                // Optionally create the document if it doesn't exist
                // updateDoc(chatRef, { status: "unmute" });
            }
        }, (error) => {
            console.error("Error fetching chat document:", error);
        });
   
        return () => unsubscribe();
    }, [chatId, onStatusChange]);    

    // Handler for toggling status
    const handleToggle = async () => {
        try {
            if (!chatId) {
                console.error("Cannot update: chatId is undefined");
                return;
            }

            const chatRef = doc(db, "chats", chatId);
            const newStatus = status === "mute" ? "unmute" : "mute";
            
            await updateDoc(chatRef, {
                status: newStatus,
            });

            setStatus(newStatus);
            if (onStatusChange) {
                onStatusChange(newStatus);
            }
            console.log(`Chat ${chatId} status updated to: ${newStatus}`);
        } catch (error) {
            console.error("Error updating chat status:", error);
            
            // Additional debugging
            console.log("Current chatId:", chatId);
            console.log("Current status:", status);
        }
    };

    return (
        <div className="option" onClick={handleToggle}>
            {status === "mute" ? (
                <>
                    <IoVolumeMuteOutline size="24" className="option-icon" />
                    Unmute
                </>
            ) : (
                <>
                    <IoVolumeMediumOutline size="24" className="option-icon" />
                    Mute
                </>
            )}
        </div>
    );
};

export default ToggleMute;