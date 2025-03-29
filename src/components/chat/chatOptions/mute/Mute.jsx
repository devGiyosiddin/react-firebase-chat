import './mute.css';
import { IoVolumeMediumOutline, IoVolumeMuteOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";

const ToggleMute = ({ chatId, onStatusChange }) => {
    const [userSoundSetting, setUserSoundSetting] = useState("mute");
    const currentUserId = auth.currentUser.uid;

    useEffect(() => {
        if (!chatId || !currentUserId) {
            console.error("chatId or userId is undefined or null");
            return;
        }
   
        // Get user-specific sound settings from Firebase
        const getUserSoundSettings = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUserId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log(userData.soundSettings);
                    if (userData.soundSettings && userData.soundSettings[chatId]) {
                        setUserSoundSetting(userData.soundSettings[chatId]);
                        if (onStatusChange) {
                            onStatusChange(userData.soundSettings[chatId]);
                        }
                    } else {
                        // If settings for this chat don't exist, set default
                        const initialSetting = "mute";
                        await updateUserSoundSetting(initialSetting);
                        setUserSoundSetting(initialSetting);
                        if (onStatusChange) {
                            onStatusChange(initialSetting);
                        }
                    }
                }
            } catch (err) {
                console.error("Error getting user sound settings:", err);
            }
        };

        getUserSoundSettings();
        
        return () => {};
    }, [chatId, currentUserId, onStatusChange]);    

    // Update user sound settings in Firebase
    const updateUserSoundSetting = async (newSetting) => {
        try {
            const userRef = doc(db, 'users', currentUserId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentSettings = userData.soundSettings || {};
                
                // Update settings for specific chat
                await updateDoc(userRef, {
                    soundSettings: {
                        ...currentSettings,
                        [chatId]: newSetting
                    }
                });
            } else {
                // Use setDoc instead of updateDoc for new documents
                await setDoc(userRef, {
                    soundSettings: {
                        [chatId]: newSetting
                    }
                });
            }
            console.log(`Chat ${chatId} sound setting updated to: ${newSetting}`);
        } catch (err) {
            console.error("Error updating sound settings:", err);
        }
    };

    // Handler for toggling status
    const handleToggle = async () => {
        try {
            if (!chatId) {
                console.error("Cannot update: chatId is undefined");
                return;
            }
            
            const newSetting = userSoundSetting === "mute" ? "unmute" : "mute";
            
            // Update user settings in Firebase
            await updateUserSoundSetting(newSetting);
            
            // Update local state
            setUserSoundSetting(newSetting);
            
            if (onStatusChange) {
                onStatusChange(newSetting);
            }
            
            console.log("Before toggle:", userSoundSetting);
            console.log("After toggle:", newSetting);
        } catch (error) {
            console.error("Error updating sound settings:", error);
            console.log("Current chatId:", chatId);
            console.log("Current setting:", userSoundSetting);
        }

    };

    return (
        <div className="option" onClick={handleToggle}>
            {userSoundSetting === "mute" ? (
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