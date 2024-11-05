import React from 'react';
import "./menuIcon.css";

const MenuIcon = ({ isOpen, toggleMenu }) => {
    return (
        <button
            onClick={toggleMenu}
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