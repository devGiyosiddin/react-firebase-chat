import './emojiPicker.css';
import { useCallback, memo, useRef, useState, Suspense } from "react";
import { Theme } from "emoji-picker-react";
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

// Основной компонент для работы с эмодзи
const EmojiPickerComponent = ({ onEmojiSelect }) => {
  const [open, setOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  
  // Мемоизированная функция для выбора эмодзи
  const handleEmojiClick = useCallback((emojiObject) => {
    if (onEmojiSelect && emojiObject?.emoji) {
      onEmojiSelect(emojiObject);
    }
  }, [onEmojiSelect]);
  
  // Мемоизированная функция для переключения видимости пикера
  const togglePicker = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  // useEffect для закрытия пикера при клике вне компонента
  // Перенесите этот хук в родительский компонент Chat
  
  return (
    <div className="emoji" ref={emojiPickerRef}>
      <BsEmojiSmile 
        className="emoji-icon"
        onClick={togglePicker} 
      />
      {open && (
        <Suspense fallback={<div>Loading...</div>}>
          <MemoizedEmojiPicker 
            onEmojiClick={handleEmojiClick} 
            theme={Theme.DARK} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default memo(EmojiPickerComponent);