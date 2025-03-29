import './ProfileSettings.css';
import {useUserStore} from '../../lib/userStore';
const ProfileSettings = () => {
    const { currentUser } = useUserStore();
    return (
        <div className="profile-settings">
            <h2 className="profile-settings__heading">Profile Settings</h2>
    
            <div className="profile-settings__section">
                <div className="profile-settings__photo-area">
                    <img src={currentUser.avatar || "../../../../public/avatar.png"} alt="User Avatar" className="profile-settings__photo" />
                    <div>
                        <button className="profile-settings__photo-button">
                            Change Photo
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
                            defaultValue="Alex"
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Last Name</label>
                        <input
                            type="text"
                            className="profile-settings__input"
                            defaultValue="Morgan"
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Email</label>
                        <input
                            type="email"
                            className="profile-settings__input"
                            defaultValue="alex.morgan@example.com"
                        />
                    </div>
                    <div className="profile-settings__form-field">
                        <label className="profile-settings__label">Phone Number</label>
                        <input
                            type="tel"
                            className="profile-settings__input"
                            defaultValue="+1 (555) 123-4567"
                        />
                    </div>
                    <div className="profile-settings__form-field profile-settings__form-field--full">
                        <label className="profile-settings__label">Bio</label>
                        <textarea
                            className="profile-settings__textarea"
                            defaultValue="Product designer based in New York. I enjoy creating user-centric, delightful, and human experiences."
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
    )
};

export default ProfileSettings;