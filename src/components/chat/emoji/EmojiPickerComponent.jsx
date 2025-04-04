import './emojiPicker.css';
import { useCallback, memo, forwardRef, useState, Suspense, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";

const MemoizedEmojiPicker = memo(({ onEmojiClick, theme }) => {
  return (
    <div className="picker">
      <EmojiPicker theme={theme} onEmojiClick={onEmojiClick} />
    </div>
  );
});

MemoizedEmojiPicker.displayName = 'MemoizedEmojiPicker';

const EmojiPickerComponent = forwardRef(({ onEmojiSelect, isOpen, setIsOpen }, ref) => {
  const handleEmojiClick = useCallback((emojiObject) => {
    if (onEmojiSelect && emojiObject?.emoji) {
      onEmojiSelect(emojiObject);
    }
  }, [onEmojiSelect]);
  
  const togglePicker = useCallback(() => {
    setIsOpen(prev => !prev);
  }, [setIsOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setIsOpen]);
  
  return (
    <div className="emoji" ref={ref}>
      <BsEmojiSmile
        className="emoji-icon"
        onClick={togglePicker}
      />
      {isOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <MemoizedEmojiPicker
            onEmojiClick={handleEmojiClick}
          />
        </Suspense>
      )}
    </div>
  );
});

EmojiPickerComponent.displayName = 'EmojiPickerComponent';

export default memo(EmojiPickerComponent);