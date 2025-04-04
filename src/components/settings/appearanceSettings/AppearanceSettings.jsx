import './appearanceSettings.css';
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useUserStore } from '../../lib/userStore';

const AppearanceSettings = () => {
  const themes = [
    { id: 'light', name: 'Light', primaryColor: '#ffffff', secondaryColor: '#f8fafc' },
    { id: 'dark', name: 'Dark', primaryColor: '#1a202c', secondaryColor: '#2d3748' },
    { id: 'sepia', name: 'Sepia', primaryColor: '#fbf0d9', secondaryColor: '#f5e5c3' },
    { id: 'nord', name: 'Nord', primaryColor: '#2e3440', secondaryColor: '#3b4252' },
    { id: 'solarized', name: 'Solarized', primaryColor: '#fdf6e3', secondaryColor: '#eee8d5' },
    { id: 'dracula', name: 'Dracula', primaryColor: '#282a36', secondaryColor: '#44475a' },
    { id: 'github', name: 'GitHub', primaryColor: '#ffffff', secondaryColor: '#f6f8fa' },
    { id: 'green', name: 'Green', primaryColor: '#ffffff', secondaryColor: '#1a202c' }
  ];

  const backgrounds = ['#ffffff', '#f7fafc', '#edf2f7', '#e2e8f0'];

  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const currentUserId = auth?.currentUser?.uid;

  // Загружаем настройки при первом рендере
  useEffect(() => {
    if (currentUserId) {
      loadUserSettings();
    }
  }, [currentUserId]);

  // Применяем тему в HTML при изменении выбранной темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, [selectedTheme]);

  // Загружаем настройки пользователя из Firestore
  const loadUserSettings = async () => {
    try {
      const userRef = doc(db, 'users', currentUserId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userSettings = userData.settings || {};
        setSelectedTheme(userSettings.selectedTheme || 'light');
        setSelectedBackground(userSettings.selectedBackground ?? 0);
        setFontSize(userSettings.fontSize ?? 16);
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
    }
  };

  // Обновляем настройки пользователя в Firestore
  const updateUserSettings = async () => {
    try {
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        settings: {
          selectedTheme,
          selectedBackground,
          fontSize
        }
      });
      console.log('Настройки пользователя обновлены');
    } catch (error) {
      console.error('Ошибка при обновлении настроек пользователя:', error);
    }
  };

  // Сбрасываем настройки к дефолтным
  const handleReset = async () => {
    const defaultSettings = {
      selectedTheme: 'light',
      selectedBackground: 0,
      fontSize: 16
    };
    setSelectedTheme(defaultSettings.selectedTheme);
    setSelectedBackground(defaultSettings.selectedBackground);
    setFontSize(defaultSettings.fontSize);
    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        settings: defaultSettings
      });
      console.log('Настройки сброшены к дефолтным');
    } catch (error) {
      console.error('Ошибка при сбросе настроек:', error);
    }
  };

  return (
    <div className="appereance">
      <h2 className='title'>Appearance</h2>

      <div className="settingsContainer">
        <h3>Theme</h3>
        <div className="themeGrid">
          {themes.map(theme => (
            <div
              key={theme.id}
              className={`themeCard ${selectedTheme === theme.id ? 'selected' : ''}`}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <div className="preview" style={{ background: theme.primaryColor }}>
                <div
                  className="previewContent"
                  style={{
                    background: theme.secondaryColor,
                    color: ['light', 'sepia', 'solarized', 'github'].includes(theme.id)
                      ? '#1a202c'
                      : '#ffffff'
                  }}
                >
                  Aa
                </div>
              </div>
              {selectedTheme === theme.id && <div className="indicator"></div>}
              <div className="themeName">{theme.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="settingsContainer">
        <h3>Chat Background</h3>
        <div className="backgroundOptions">
          {backgrounds.map((bg, index) => (
            <div
              key={index}
              className={`bgOption ${selectedBackground === index ? 'selected' : ''}`}
              onClick={() => setSelectedBackground(index)}
            >
              <div className="preview" style={{ background: bg }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="settingsContainer">
        <h3>Font Size</h3>
        <div className="fontSizeSlider">
          <span className="smallA">A</span>
          <input
            type="range"
            min="12"
            max="24"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="slider"
          />
          <span className="largeA">A</span>
          <span className="fontSizeValue">{fontSize}px</span>
        </div>
      </div>

      <div className="actions">
        <button className="resetBtn" onClick={handleReset}>Reset to Defaults</button>
        <button className="saveBtn" onClick={updateUserSettings}>Save Changes</button>
      </div>
    </div>
  );
};

export default AppearanceSettings;