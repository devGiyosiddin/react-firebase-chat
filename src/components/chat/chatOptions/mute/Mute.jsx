import './mute.css';
import { IoVolumeMediumOutline, IoVolumeMuteOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";

const ToggleMute = ({ chatId, onStatusChange }) => {
    const [userSoundSetting, setUserSoundSetting] = useState(null); // Start with null to indicate loading
    const [isLoading, setIsLoading] = useState(true);
    const currentUserId = auth.currentUser.uid;

    useEffect(() => {
        let isMounted = true;
        
        if (!chatId || !currentUserId) {
            console.error("chatId or userId is undefined or null");
            return;
        }
    
        // Get user-specific sound settings from Firebase
        const getUserSoundSettings = async () => {
            try {
                setIsLoading(true);
                
                if (!isMounted) return;
                
                const userDoc = await getDoc(doc(db, 'users', currentUserId));
                if (userDoc.exists() && isMounted) {
                    const userData = userDoc.data();
                    console.log("Retrieved sound settings:", userData.soundSettings);
                    
                    if (userData.soundSettings && userData.soundSettings[chatId]) {
                        setUserSoundSetting(userData.soundSettings[chatId]);
                        if (onStatusChange) {
                            onStatusChange(userData.soundSettings[chatId]);
                        }
                    } else {
                        // If settings for this chat don't exist, set default
                        const initialSetting = "mute";
                        await updateUserSoundSetting(initialSetting);
                        if (isMounted) {
                            setUserSoundSetting(initialSetting);
                            if (onStatusChange) {
                                onStatusChange(initialSetting);
                            }
                        }
                    }
                } else {
                    // No user document exists yet
                    const initialSetting = "mute";
                    await updateUserSoundSetting(initialSetting);
                    if (isMounted) {
                        setUserSoundSetting(initialSetting);
                        if (onStatusChange) {
                            onStatusChange(initialSetting);
                        }
                    }
                }
            } catch (err) {
                console.error("Error getting user sound settings:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
    
        getUserSoundSettings();
        
        return () => {
            isMounted = false;
        };
    }, [chatId, currentUserId]); // Remove onStatusChange from dependencies
  
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
        } catch (err) {
            console.error("Error updating sound settings:", err);
        }
    };


    // Handler for toggling status
    const handleToggle = async (e) => {
        e.stopPropagation(); // Stop event propagation
        try {
            if (!chatId) {
                console.error("Cannot update: chatId is undefined");
                return;
            }
            
            const newSetting = userSoundSetting === "mute" ? "unmute" : "mute";
            
            // Update local state immediately to prevent flickering
            setUserSoundSetting(newSetting);
            
            // Update user settings in Firebase
            await updateUserSoundSetting(newSetting);
            
            if (onStatusChange) {
                onStatusChange(newSetting);
            }
        } catch (error) {
            console.error("Error updating sound settings:", error);
            // Revert local state if Firebase update fails
            setUserSoundSetting(prevSetting => prevSetting === "mute" ? "unmute" : "mute");
        }
    };

    // Show loading indicator or empty div while fetching settings
    if (isLoading || userSoundSetting === null) {
        return <div className="option">...</div>;
    }

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