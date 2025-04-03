import './profileSettings.css';
import { useUserStore } from '../../lib/userStore';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '../../lib/firebase';

// TODO: Restyle the component UI
const ProfileSettings = () => {
    const { currentUser } = useUserStore();
    const fileInputRef = useRef(null);
    const [avatar, setAvatar] = useState(currentUser?.avatar || null);
    const [isUploading, setIsUploading] = useState(false);
    const [username, setUsername] = useState(currentUser?.username || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [firstName, setFirstName] = useState(currentUser?.firstName || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [usernameAvailable, setUsernameAvailable] = useState(true);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [formChanged, setFormChanged] = useState(false);

    // Initialize form with current user data
    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setEmail(currentUser.email || '');
            setFirstName(currentUser.firstName || '');
            setPhone(currentUser.phone || '');
            setBio(currentUser.bio || '');
            setAvatar(currentUser.avatar || null);
        }
    }, [currentUser]);

    // Check if form data changed from original
    useEffect(() => {
        if (!currentUser) return;
        
        const hasChanges = 
            username !== (currentUser.username || '') ||
            firstName !== (currentUser.firstName || '') ||
            phone !== (currentUser.phone || '') ||
            bio !== (currentUser.bio || '');
            
        setFormChanged(hasChanges);
    }, [username, firstName, phone, bio, currentUser]);

    const checkUsernameAvailability = async (usernameToCheck) => {
        if (!usernameToCheck || usernameToCheck === currentUser?.username) {
            return true; // Current username is always available for the user
        }
        
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", usernameToCheck));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    };

    const handlePhotoButtonClick = () => {
        fileInputRef.current.click();
    };

    const handlePhotoChange = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }
        
        // Check file type
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            alert("Only JPG, PNG, and GIF files are allowed.");
            return;
        }

        setIsUploading(true);
        
        try {
            // Upload image to Firebase Storage
            const imageUrl = await uploadImage(file, `userAvatars/${currentUser.id}/${file.name}`);
            
            // Create a reference to the user document
            const userDocRef = doc(db, 'users', currentUser.id);
            
            // Update the avatar URL in Firestore
            await updateDoc(userDocRef, {
                avatar: imageUrl
            });
            
            // Update the local state with the new avatar URL
            setAvatar(imageUrl);
            
            // Update global user state
            useUserStore.setState({ 
                currentUser: { 
                    ...currentUser, 
                    avatar: imageUrl 
                } 
            });
            
            console.log("Avatar updated successfully!");
        } catch (error) {
            console.error("Error updating avatar:", error);
            alert("Failed to update profile picture. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUsernameChange = async (e) => {
        const newUsername = e.target.value.trim().toLowerCase();
        setUsername(newUsername);

        // Basic validation
        const isValid = /^[a-z0-9_]{3,20}$/.test(newUsername);
        if (!newUsername || !isValid) {
            setUsernameAvailable(false);
            return;
        }

        // Skip check if username hasn't changed
        if (newUsername === currentUser?.username) {
            setUsernameAvailable(true);
            return;
        }

        setCheckingUsername(true);
        const available = await checkUsernameAvailability(newUsername);
        setUsernameAvailable(available);
        setCheckingUsername(false);
    };

    const handleCancel = () => {
        // Reset form to original values
        setUsername(currentUser?.username || '');
        setFirstName(currentUser?.firstName || '');
        setPhone(currentUser?.phone || '');
        setBio(currentUser?.bio || '');
        setFormChanged(false);
    };

    const handleSaveChanges = async () => {
        try {
            if (!username.trim()) {
                alert("Username cannot be empty.");
                return;
            }
            
            if (!usernameAvailable) {
                alert("Please choose a valid and available username.");
                return;
            }

            const userDocRef = doc(db, 'users', currentUser.id);
            const updatedData = {};

            if (username !== currentUser.username) updatedData.username = username;
            if (firstName !== currentUser.firstName) updatedData.firstName = firstName;
            if (phone !== currentUser.phone) updatedData.phone = phone;
            if (bio !== currentUser.bio) updatedData.bio = bio;

            if (Object.keys(updatedData).length === 0) {
                alert("No changes detected.");
                return;
            }

            await updateDoc(userDocRef, updatedData);

            // Update global user state
            useUserStore.setState({ 
                currentUser: { 
                    ...currentUser, 
                    ...updatedData 
                } 
            });

            setFormChanged(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    return (
        <div className="profile-settings">
            <h2 className="profile-settings__heading">Profile Settings</h2>
            <div className="profile-settings__section">
                <div className="profile-settings__photo-area">
                    <img 
                        src={avatar || "/avatar.png"} 
                        alt="User Avatar" 
                        className="profile-settings__photo" 
                    />
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/jpeg, image/png, image/gif"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="profile-settings__photo-button"
                            onClick={handlePhotoButtonClick}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Change Photo'}
                        </button>
                        <p className="profile-settings__photo-info">JPG, GIF or PNG. Max size 5MB</p>
                    </div>
                </div>
     
                <div className="profile-settings__form">
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">First Name</label>
                        <input
                            type="text"
                            className="profile-settings__input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Username</label>
                        <input
                            type="text"
                            className="profile-settings__input"
                            value={username}
                            onChange={handleUsernameChange}
                        />
                        {username && (
                            <div className="profile-settings__input-message">
                                {checkingUsername ? (
                                    <span>Checking availability...</span>
                                ) : !usernameAvailable ? (
                                    <span className="profile-settings__input-error">
                                        Username unavailable or invalid (min 3 chars, alphanumeric)
                                    </span>
                                ) : (
                                    <span className="profile-settings__input-success">
                                        Username available
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Email</label>
                        <input
                            type="email"
                            className="profile-settings__input"
                            value={email}
                            disabled // Email typically shouldn't be changed easily
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Phone Number</label>
                        <input
                            type="tel"
                            className="profile-settings__input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="profile-settings__form-field profile-settings__form-field--full">
                        <label className="profile-settings__label">Bio</label>
                        <textarea
                            className="profile-settings__textarea"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        ></textarea>
                    </div>
                </div>
            </div>
   
            <div className="profile-settings__actions">
                <button 
                    className="profile-settings__button profile-settings__button--cancel"
                    onClick={handleCancel}
                    disabled={!formChanged}
                >
                    Cancel
                </button>
                <button 
                    className="profile-settings__button profile-settings__button--save"
                    onClick={handleSaveChanges}
                    disabled={!formChanged || !usernameAvailable || checkingUsername}
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ProfileSettings;