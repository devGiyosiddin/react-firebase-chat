import './chatSearch.css';
import { useState } from 'react';

function ChatSearch({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="chat-search-container">
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={handleSearch}
        className="search-input"
      />
      {searchQuery && (
        <button
          type="button"
          aria-label="Clear search"
          title='Clear search'
          className="clear-search"
          onClick={() => {
            setSearchQuery('');
            onSearch('');
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default ChatSearch;