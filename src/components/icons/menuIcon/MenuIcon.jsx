import { useState } from 'react';
import "./menuIcon.css";

const MenuIcon = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
          className="menu-icon-button"
    >
      <div className={`menu-icon ${isOpen ? 'open' : ''}`}>
        <span className="line top"></span>
        <span className="line middle"></span>
        <span className="line bottom"></span>
      </div>
    </button>
  );
};

export default MenuIcon;