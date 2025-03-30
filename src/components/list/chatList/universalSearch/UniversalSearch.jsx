import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import './universalSearch.css';
import { Search, User, MessageSquare, Star, Plus } from 'lucide-react';

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
        
        // Поиск существующих чатов
        const chatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.uid)
        );
        
        // Поиск всех пользователей
        const usersQuery = query(
            collection(db, 'users'),
            where('username', '>=', queryLower),
            where('username', '<=', queryLower + '\uf8ff')
        );

        const [chatsSnapshot, usersSnapshot] = await Promise.all([
            getDocs(chatsQuery),
            getDocs(usersQuery)
        ]);

        // Обработка результатов
        const chats = [];
        const messages = [];
        const existingUsers = new Set();

        chatsSnapshot.forEach(doc => {
            const chatData = doc.data();
            if (chatData.lastMessage?.toLowerCase().includes(queryLower)) {
                chats.push({ id: doc.id, ...chatData });
            }
            
            chatData.messages?.forEach(msg => {
                if (msg.text?.toLowerCase().includes(queryLower)) {
                    messages.push({
                        chatId: doc.id,
                        chatName: chatData.name,
                        ...msg
                    });
                }
            });

            chatData.participants.forEach(uid => existingUsers.add(uid));
        });

        // Разделение пользователей на существующие и новые
        const users = [];
        const newUsers = [];

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.uid !== currentUser.uid) {
                if (existingUsers.has(userData.uid)) {
                    users.push({ id: doc.id, ...userData });
                } else {
                    newUsers.push({ id: doc.id, ...userData });
                }
            }
        });

        setResults({ users, messages, chats, newUsers });
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    return (
        <div className="universal-search">
            <div className="search-input-container">
                <Search className="search-icon" />
                <input
                    type="text"
                    placeholder="Search messages, users, or chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="search-filters">
                    <button
                        className={activeFilter === 'all' ? 'active' : ''}
                        onClick={() => setActiveFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={activeFilter === 'users' ? 'active' : ''}
                        onClick={() => setActiveFilter('users')}
                    >
                        Users
                    </button>
                    <button
                        className={activeFilter === 'messages' ? 'active' : ''}
                        onClick={() => setActiveFilter('messages')}
                    >
                        Messages
                    </button>
                </div>
            </div>

            <div className="search-results">
                {(activeFilter === 'all' || activeFilter === 'users') && (
                    <>
                        {results.users.length > 0 && (
                            <div className="results-section">
                                <h3>Existing Contacts</h3>
                                {results.users.map(user => (
                                    <div
                                        key={user.id}
                                        className="result-item"
                                        onClick={() => onSelect('user', user)}
                                    >
                                        <User className="result-icon" />
                                        <span>{user.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {results.newUsers.length > 0 && (
                            <div className="results-section">
                                <h3>New Users</h3>
                                {results.newUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="result-item"
                                    >
                                        <User className="result-icon" />
                                        <span>{user.username}</span>
                                        <button
                                            className="add-user-btn"
                                            onClick={() => onCreateChat(user)}
                                        >
                                            <Plus size={16} />
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {(activeFilter === 'all' || activeFilter === 'messages') && (
                    <>
                        {results.messages.length > 0 && (
                            <div className="results-section">
                                <h3>Messages</h3>
                                {results.messages.map((message, idx) => (
                                    <div
                                        key={idx}
                                        className="result-item"
                                        onClick={() => onSelect('message', message)}
                                    >
                                        <MessageSquare className="result-icon" />
                                        <div className="message-preview">
                                            <span className="chat-name">{message.chatName}</span>
                                            <p>{message.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UniversalSearch;
