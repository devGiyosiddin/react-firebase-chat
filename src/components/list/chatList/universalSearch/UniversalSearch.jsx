import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import './universalSearch.css';
import { Search, User, MessageSquare, X } from 'lucide-react';

const UniversalSearch = ({ onSelect, onCreateChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState({
        users: [],
        messages: [],
        chats: [],
        newUsers: []
    });
    const [activeFilter, setActiveFilter] = useState('all');
    const currentUser = auth.currentUser;

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setResults({ users: [], messages: [], chats: [], newUsers: [] });
            return;
        }

        const queryLower = query.toLowerCase();
        
        try {
            // Search existing chats
            const chatsRef = collection(db, 'chats');
            const chatsQuery = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
            const chatsSnapshot = await getDocs(chatsQuery);

            // Search users
            const usersRef = collection(db, 'users');
            const usersQuery = query(
                usersRef,
                where('username', '>=', queryLower),
                where('username', '<=', queryLower + '\uf8ff')
            );
            const usersSnapshot = await getDocs(usersQuery);

            const chats = [];
            const messages = [];
            const existingUsers = new Set();

            // Process chats and messages
            chatsSnapshot.forEach(doc => {
                const chatData = doc.data();
                if (chatData.lastMessage?.toLowerCase().includes(queryLower)) {
                    chats.push({ id: doc.id, type: 'chat', ...chatData });
                }
                
                // Search in messages
                if (chatData.messages) {
                    chatData.messages.forEach(msg => {
                        if (msg.text?.toLowerCase().includes(queryLower)) {
                            messages.push({
                                chatId: doc.id,
                                type: 'message',
                                chatName: chatData.name,
                                ...msg
                            });
                        }
                    });
                }

                chatData.participants.forEach(uid => existingUsers.add(uid));
            });

            // Process users
            const users = [];
            const newUsers = [];

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.uid !== currentUser.uid) {
                    const user = { id: doc.id, type: 'user', ...userData };
                    if (existingUsers.has(userData.uid)) {
                        users.push(user);
                    } else {
                        newUsers.push(user);
                    }
                }
            });

            setResults({ users, messages, chats, newUsers });
        } catch (error) {
            console.error("Error searching:", error);
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleResultClick = (result) => {
        if (result.type === 'user' && !result.chatId) {
            onCreateChat(result);
        } else {
            onSelect(result);
        }
        setSearchQuery('');
    };

    const getFilteredResults = () => {
        if (activeFilter === 'all') {
            return [
                ...results.chats,
                ...results.messages,
                ...results.users,
                ...results.newUsers
            ];
        }
        return results[activeFilter] || [];
    };

    return (
        <div className="universal-search">
            <div className="search-input-container">
                <Search className="search-icon" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages, users, or chats..."
                    className="search-input"
                />
                {searchQuery && (
                    <button className="clear-button" onClick={() => setSearchQuery('')}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {searchQuery && (
                <div className="search-filters">
                    <button
                        className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-button ${activeFilter === 'chats' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('chats')}
                    >
                        Chats
                    </button>
                    <button
                        className={`filter-button ${activeFilter === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('users')}
                    >
                        Users
                    </button>
                    <button
                        className={`filter-button ${activeFilter === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('messages')}
                    >
                        Messages
                    </button>
                </div>
            )}

            {searchQuery && (
                <div className="search-results">
                    {getFilteredResults().map((result, index) => (
                        <div
                            key={`${result.type}-${result.id || index}`}
                            className="search-result-item"
                            onClick={() => handleResultClick(result)}
                        >
                            <div className="result-icon">
                                {result.type === 'user' ? (
                                    <User size={18} />
                                ) : result.type === 'message' ? (
                                    <MessageSquare size={18} />
                                ) : (
                                    <MessageSquare size={18} />
                                )}
                            </div>
                            <div className="result-content">
                                <div className="result-title">
                                    {result.type === 'user' ? result.username :
                                     result.type === 'message' ? result.chatName :
                                     result.name || 'Unnamed Chat'}
                                </div>
                                {result.type === 'message' && (
                                    <div className="result-subtitle">{result.text}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UniversalSearch;