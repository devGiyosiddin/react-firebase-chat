import React, { useState } from 'react';

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
    <div className="appearanceSettings">
      <h2>Appearance</h2>
     
      <div className="settingsContainer">
        <h3>Theme</h3>
        <div className="themeOptions">
          <div
            className={`themeCard ${selectedTheme === 'light' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <div className={`preview light`}></div>
            {selectedTheme === 'light' && <div className="indicator"></div>}
            <div>Light</div>
          </div>
          <div
            className={`themeCard ${selectedTheme === 'dark' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className={`preview dark`}></div>
            {selectedTheme === 'dark' && <div className="indicator"></div>}
            <div>Dark</div>
          </div>
          <div
            className={`themeCard ${selectedTheme === 'system' ? 'selected' : ''}`}
            onClick={() => handleThemeChange('system')}
          >
            <div className={`preview system`}></div>
            {selectedTheme === 'system' && <div className="indicator"></div>}
            <div>System</div>
          </div>
        </div>
      </div>
      <div className="settingsContainer">
        <h3>Chat Background</h3>
        <div className="backgroundOptions">
          {backgrounds.map((bg, index) => (
            <div
              key={index}
              className={`bgOption ${selectedBackground === index ? 'selected' : ''}`}
              onClick={() => handleBackgroundChange(index)}
            >
              <div
                className="preview"
                style={{ background: bg }}
              ></div>
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
            onChange={handleFontSizeChange}
            className="slider"
          />
          <span className="largeA">A</span>
        </div>
      </div>
      <div className="actions">
        <button className="resetBtn" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className="saveBtn" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AppearanceSettings;