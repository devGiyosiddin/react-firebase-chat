import './ProfileSettings.css';
import { useUserStore } from '../../lib/userStore';
import { doc, updateDoc } from 'firebase/firestore'; // Added doc import
import { db } from '../../lib/firebase'; // Need to import db from firebase
import { useRef, useState } from 'react';
import { uploadImage } from '../../lib/firebase';

const ProfileSettings = () => {
    const { currentUser } = useUserStore();
    const fileInputRef = useRef(null);
    const [avatar, setAvatar] = useState(currentUser?.avatar || null);
    const [isUploading, setIsUploading] = useState(false);

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
            console.log("Avatar updated successfully!");
        } catch (error) {
            console.error("Error updating avatar:", error);
            alert("Failed to update profile picture. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="profile-settings">
            <h2 className="profile-settings__heading">Profile Settings</h2>
   
            <div className="profile-settings__section">
                <div className="profile-settings__photo-area">
                    <img 
                        src={avatar || "../../../../public/avatar.png"} 
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
                            defaultValue={currentUser?.firstName || "Alex"}
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Last Name</label>
                        <input
                            type="text"
                            className="profile-settings__input"
                            defaultValue={currentUser?.lastName || "Morgan"}
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Email</label>
                        <input
                            type="email"
                            className="profile-settings__input"
                            defaultValue={currentUser?.email || "alex.morgan@example.com"}
                            disabled // Email typically shouldn't be changed easily
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Phone Number</label>
                        <input
                            type="tel"
                            className="profile-settings__input"
                            defaultValue={currentUser?.phone || "+1 (555) 123-4567"}
                        />
                    </div>
                    <div className="profile-settings__form-field profile-settings__form-field--full">
                        <label className="profile-settings__label">Bio</label>
                        <textarea
                            className="profile-settings__textarea"
                            defaultValue={currentUser?.bio || "Product designer based in New York. I enjoy creating user-centric, delightful, and human experiences."}
                        ></textarea>
                    </div>
                </div>
            </div>
   
            <div className="profile-settings__actions">
                <button className="profile-settings__button profile-settings__button--cancel">
                    Cancel
                </button>
                <button className="profile-settings__button profile-settings__button--save">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ProfileSettings;