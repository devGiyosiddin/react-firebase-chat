import './Settings.css';
import './media.css';
import React, { useState } from 'react';
import { User, Bell, Lock, Moon, Globe, HelpCircle, LogOut, X } from 'lucide-react';
import ProfileSettings from './profileSettings/ProfileSettings';

const Settings = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  const renderContent = () => {
    switch(activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'language':
        return <LanguageSettings />;
      default:
        return <ProfileSettings />;
    }
  };
  
  return (
    <div className="settings-wrapper">
          <button className="settings-close" onClick={onClose}>
              <X size={24} />
          </button>
      {/* Sidebar Navigation */}
      <div className="settings__sidebar">
        <div className="settings__sidebar-header">
          <h2 className="settings__sidebar-title">Settings</h2>
        </div>
        
        <nav className="settings__nav">
          <ul className="settings__nav-list">
            <li className="settings__nav-item">
              <button 
                className={`settings__nav-button ${activeTab === 'profile' ? 'settings__nav-button--active' : 'settings__nav-button--default'}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={20} className="settings__nav-icon" />
                <span>Profile</span>
              </button>
            </li>
            <li className="settings__nav-item">
              <button 
                className={`settings__nav-button ${activeTab === 'notifications' ? 'settings__nav-button--active' : 'settings__nav-button--default'}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={20} className="settings__nav-icon" />
                <span>Notifications</span>
              </button>
            </li>
            <li className="settings__nav-item">
              <button 
                className={`settings__nav-button ${activeTab === 'privacy' ? 'settings__nav-button--active' : 'settings__nav-button--default'}`}
                onClick={() => setActiveTab('privacy')}
              >
                <Lock size={20} className="settings__nav-icon" />
                <span>Privacy & Security</span>
              </button>
            </li>
            <li className="settings__nav-item">
              <button 
                className={`settings__nav-button ${activeTab === 'appearance' ? 'settings__nav-button--active' : 'settings__nav-button--default'}`}
                onClick={() => setActiveTab('appearance')}
              >
                <Moon size={20} className="settings__nav-icon" />
                <span>Appearance</span>
              </button>
            </li>
            <li className="settings__nav-item">
              <button 
                className={`settings__nav-button ${activeTab === 'language' ? 'settings__nav-button--active' : 'settings__nav-button--default'}`}
                onClick={() => setActiveTab('language')}
              >
                <Globe size={20} className="settings__nav-icon" />
                <span>Language</span>
              </button>
            </li>
            <li className="settings__nav-item settings__nav-item--separated">
              <button className="settings__nav-button settings__nav-button--default">
                <HelpCircle size={20} className="settings__nav-icon" />
                <span>Help & Support</span>
              </button>
            </li>
            <li className="settings__nav-item">
              <button className="settings__nav-button settings__nav-button--danger">
                <LogOut size={20} className="settings__nav-icon" />
                <span>Logout</span>
              </button>
            </li>
          </ul>

          </nav>
      </div>
      
      {/* Content Area */}
      <div className="settings__content">
        {renderContent()}
      </div>
    </div>
  );
};

import './NotificationSettings.css';
const NotificationSettings = () => (
  <div className="notification-settings">
    <h2 className="notification-settings__heading">Notification Settings</h2>
    
    <div className="notification-settings__section">
      <h3 className="notification-settings__section-heading">Chat Notifications</h3>
      
      <div className="notification-settings__options">
        <div className="notification-settings__option">
          <div className="notification-settings__option-info">
            <h4 className="notification-settings__option-title">New Messages</h4>
            <p className="notification-settings__option-description">Get notified when you receive a new message</p>
          </div>
          <label className="notification-settings__toggle">
            <input type="checkbox" className="notification-settings__toggle-input" defaultChecked />
            <div className="notification-settings__toggle-slider"></div>
          </label>
        </div>
        
        <div className="notification-settings__option">
          <div className="notification-settings__option-info">
            <h4 className="notification-settings__option-title">Message Reactions</h4>
            <p className="notification-settings__option-description">Get notified when someone reacts to your messages</p>
          </div>
          <label className="notification-settings__toggle">
            <input type="checkbox" className="notification-settings__toggle-input" defaultChecked />
            <div className="notification-settings__toggle-slider"></div>
          </label>
        </div>
        
        <div className="notification-settings__option">
          <div className="notification-settings__option-info">
            <h4 className="notification-settings__option-title">Mentions</h4>
            <p className="notification-settings__option-description">Get notified when someone mentions you</p>
          </div>
          <label className="notification-settings__toggle">
            <input type="checkbox" className="notification-settings__toggle-input" defaultChecked />
            <div className="notification-settings__toggle-slider"></div>
          </label>
        </div>
      </div>
      
      <div className="notification-settings__subsection">
        <h3 className="notification-settings__section-heading">Email Notifications</h3>
        
        <div className="notification-settings__options">
          <div className="notification-settings__option">
            <div className="notification-settings__option-info">
              <h4 className="notification-settings__option-title">Weekly Summary</h4>
              <p className="notification-settings__option-description">Receive a weekly summary of your activity</p>
            </div>
            <label className="notification-settings__toggle">
              <input type="checkbox" className="notification-settings__toggle-input" defaultChecked />
              <div className="notification-settings__toggle-slider"></div>
            </label>
          </div>

          <div className="notification-settings__option">
            <div className="notification-settings__option-info">
              <h4 className="notification-settings__option-title">New Features</h4>
              <p className="notification-settings__option-description">Get emails about new features and updates</p>
            </div>
            <label className="notification-settings__toggle">
              <input type="checkbox" className="notification-settings__toggle-input" />
              <div className="notification-settings__toggle-slider"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <div className="notification-settings__actions">
      <button className="notification-settings__save-button">
        Save Changes
      </button>
    </div>
  </div>
);

import "./PrivacySettings.module.css";

const PrivacySettings = () => (
  <div className="privacy-settings">
    <h2>Privacy & Security</h2>

    <div className="settings-container">
      <h3>Account Privacy</h3>

      <div>
        <div className="setting-item">
          <div>
            <h4>Online Status</h4>
            <p>Show when you`re active in the app</p>
          </div>
          <label>
            <input type="checkbox" defaultChecked />
            <div className="toggle"></div>
          </label>
        </div>

        <div className="setting-item">
          <div>
            <h4>Read Receipts</h4>
            <p>Let others know when you`ve read their messages</p>
          </div>
          <label>
            <input type="checkbox" defaultChecked />
            <div className="toggle"></div>
          </label>
        </div>
      </div>

      <div className={"security-section"}>
        <h3>Security</h3>

        <div className={"security-item"}>
          <h4>Two-Factor Authentication</h4>
          <p>Add an extra layer of security to your account</p>
          <button className={`${"btn"} ${"btn-green"}`}>Enable 2FA</button>
        </div>

        <div className={"security-item"}>
          <h4>Change Password</h4>
          <p>Update your password regularly for better security</p>
          <button className={`${"btn"} ${"btn-blue"}`}>Change Password</button>
        </div>

        <div className={"security-item"}>
          <h4>Active Sessions</h4>
          <p>Manage devices that are currently logged in</p>
          <button className={`${"btn"} ${"btn-gray"}`}>View Sessions</button>
        </div>
      </div>
    </div>
  </div>
);

// AppearanceSettings.jsx
import styles from './AppearanceSettings.module.css';

const AppearanceSettings = () => {
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [fontSize, setFontSize] = useState(16);

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
  };

  const handleBackgroundChange = (index) => {
    setSelectedBackground(index);
  };

  const handleFontSizeChange = (e) => {
    setFontSize(e.target.value);
  };

  const handleReset = () => {
    setSelectedTheme('light');
    setSelectedBackground(0);
    setFontSize(16);
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Settings saved:', { selectedTheme, selectedBackground, fontSize });
  };

  // Background preview colors
  const backgrounds = [
    '#ffffff', 
    '#f7fafc', 
    '#edf2f7', 
    '#e2e8f0'
  ];

  return (
    <div className={styles.appearanceSettings}>
      <h2>Appearance</h2>
      
      <div className={styles.settingsContainer}>
        <h3>Theme</h3>
        <div className={styles.themeOptions}>
          <div 
            className={`${styles.themeCard} ${selectedTheme === 'light' ? styles.selected : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <div className={`${styles.preview} ${styles.light}`}></div>
            {selectedTheme === 'light' && <div className={styles.indicator}></div>}
            <div>Light</div>
          </div>

          <div 
            className={`${styles.themeCard} ${selectedTheme === 'dark' ? styles.selected : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className={`${styles.preview} ${styles.dark}`}></div>
            {selectedTheme === 'dark' && <div className={styles.indicator}></div>}
            <div>Dark</div>
          </div>

          <div 
            className={`${styles.themeCard} ${selectedTheme === 'system' ? styles.selected : ''}`}
            onClick={() => handleThemeChange('system')}
          >
            <div className={`${styles.preview} ${styles.system}`}></div>
            {selectedTheme === 'system' && <div className={styles.indicator}></div>}
            <div>System</div>
          </div>
        </div>
      </div>

      <div className={styles.settingsContainer}>
        <h3>Chat Background</h3>
        <div className={styles.backgroundOptions}>
          {backgrounds.map((bg, index) => (
            <div 
              key={index}
              className={`${styles.bgOption} ${selectedBackground === index ? styles.selected : ''}`}
              onClick={() => handleBackgroundChange(index)}
            >
              <div 
                className={styles.preview} 
                style={{ background: bg }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsContainer}>
        <h3>Font Size</h3>
        <div className={styles.fontSizeSlider}>
          <span className={styles.smallA}>A</span>
          <input 
            type="range" 
            min="12" 
            max="24" 
            value={fontSize}
            onChange={handleFontSizeChange}
            className={styles.slider}
          />
          <span className={styles.largeA}>A</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className={styles.saveBtn} onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

import "./LanguageSettings.module.css";

const LanguageSettings = () => (
  <div className={"language-settings"}>
    <h2>Language Settings</h2>

    <div className={"settings-container"}>
      <h3>App Language</h3>

      <div className={"field-group"}>
        <label>Primary Language</label>
        <select>
          <option value="en">English (US)</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="ru">Russian</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese (Simplified)</option>
        </select>
      </div>

      <div className={"field-group"}>
        <label>Secondary Language</label>
        <select>
          <option value="">None</option>
          <option value="en">English (US)</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="ru">Russian</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese (Simplified)</option>
        </select>
        <p>You`ll see translations for this language when available</p>
      </div>

      <div className={"grid-container"}>
        <div className={"field-group"}>
          <label>Date Format</label>
          <select>
            <option value="mdy">MM/DD/YYYY</option>
            <option value="dmy">DD/MM/YYYY</option>
            <option value="ymd">YYYY/MM/DD</option>
          </select>
        </div>

        <div className={"field-group"}>
          <label>Time Format</label>
          <select>
            <option value="12">12-hour (AM/PM)</option>
            <option value="24">24-hour</option>
          </select>
        </div>

        <div className={"field-group"}>
          <label>First Day of Week</label>
          <select>
            <option value="sun">Sunday</option>
            <option value="mon">Monday</option>
            <option value="sat">Saturday</option>
          </select>
        </div>

        <div className={"field-group"}>
          <label>Time Zone</label>
          <select>
            <option value="utc-8">Pacific Time (UTC-8)</option>
            <option value="utc-5">Eastern Time (UTC-5)</option>
            <option value="utc+0">UTC</option>
            <option value="utc+1">Central European Time (UTC+1)</option>
            <option value="utc+8">China Standard Time (UTC+8)</option>
            <option value="utc+9">Japan Standard Time (UTC+9)</option>
          </select>
        </div>
      </div>
    </div>

    <div className={"button-container"}>
      <button className={"save-btn"}>Save Changes</button>
    </div>
  </div>
);

export default Settings;