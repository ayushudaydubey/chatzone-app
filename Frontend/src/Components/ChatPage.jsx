import React, { useContext, useEffect, useState } from 'react';
import { chatContext } from '../Context/Context';
import UserList from '../Components/UserList';
import ChatHeader from '../Components/ChatHeader';
import ChatMessages from '../Components/ChatMessages';
import ChatInput from '../Components/ChatInput';

const ChatPage = () => {
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  
  const {
    users, setToUser, toUser, username,
    message, setMessage, handleSend, messages,
    setUsername, senderId, setSenderId, receiverId, setReceiverId,
    socket, messagesEndRef, handleFileUpload, isRegistered,
    // Add the unread message functions from context
    getUnreadCount, getLastMessage, getTotalUnreadCount
  } = useContext(chatContext);

  useEffect(() => {
    setSenderId(username);
    setReceiverId(toUser);
  }, [toUser, username, setSenderId, setReceiverId]);

  // Close user list when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsUserListOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    else if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    else return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleToggleUserList = () => {
    setIsUserListOpen(!isUserListOpen);
  };

  const handleCloseUserList = () => {
    setIsUserListOpen(false);
  };

  return (
    <div className="w-full h-screen shadow-lg lg:rounded-xl lg:grid lg:grid-cols-4 overflow-hidden">
      {/* User List - Hidden on mobile by default, shown as overlay when toggled */}
      <div className="hidden lg:block">
        <UserList 
          users={users} 
          toUser={toUser} 
          setToUser={setToUser}
          username={username}
          formatTime={formatTime}
          isRegistered={isRegistered}
          isOpen={isUserListOpen}
          onClose={handleCloseUserList}
          // Pass the unread message functions
          getUnreadCount={getUnreadCount}
          getLastMessage={getLastMessage}
          getTotalUnreadCount={getTotalUnreadCount}
        />
      </div>

      {/* Mobile User List Overlay */}
      <div className="lg:hidden">
        <UserList 
          users={users} 
          toUser={toUser} 
          setToUser={setToUser}
          username={username}
          formatTime={formatTime}
          isRegistered={isRegistered}
          isOpen={isUserListOpen}
          onClose={handleCloseUserList}
          // Pass the unread message functions
          getUnreadCount={getUnreadCount}
          getLastMessage={getLastMessage}
          getTotalUnreadCount={getTotalUnreadCount}
        />
      </div>

      {/* Chat Area */}
      <div className="flex flex-col relative overflow-hidden lg:col-span-3 h-full">
        <ChatHeader 
          toUser={toUser} 
          users={users} 
          onToggleUserList={handleToggleUserList}
        />
        <ChatMessages 
          messages={messages}
          username={username}
          toUser={toUser}
          formatTime={formatTime}
          formatDate={formatDate}
          messagesEndRef={messagesEndRef}
        />
        <ChatInput 
          handleSend={handleSend}
          message={message}
          setMessage={setMessage}
          toUser={toUser}
          users={users}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default ChatPage;