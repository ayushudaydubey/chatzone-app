import React from 'react';
import { X, MessageCircle, Bot, Sparkles } from 'lucide-react';
import { useContext } from 'react';
import { chatContext } from '../Context/Context';

const UserList = ({
  users,
  toUser,
  setToUser,
  username,
  formatTime,
  isRegistered,
  isOpen,
  onClose,
  getUnreadCount,
  getLastMessage,
  getTotalUnreadCount,
}) => {
  const { logout, isLoading, markMessagesAsRead } = useContext(chatContext);

  const allUsers = users || [];
  
  // Helper function to check if user is Elva AI
  const isElvaAI = (userName) => {
    if (!userName) return false;
    const name = userName.toLowerCase();
    return name.includes('elva') || name.includes('elva ai');
  };

  // Modified function to get total unread count (excluding AI users)
  const getTotalUnreadCountExcludingAI = () => {
    if (!getTotalUnreadCount || !getUnreadCount) return 0;
    
    return allUsers.reduce((total, user) => {
      const userObj = typeof user === 'object' ? user : { username: user };
      const userName = userObj.username;
      
      // Skip AI users when counting unread messages
      if (isElvaAI(userName)) return total;
      
      const unreadCount = getUnreadCount(userName) || 0;
      return total + unreadCount;
    }, 0);
  };

  const totalUnread = getTotalUnreadCountExcludingAI();

  // Helper function to truncate message text
  const truncateMessage = (message, maxLength = 30) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Helper function to format timestamp for last message
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle user selection with immediate unread count removal
  const handleUserClick = async (userName) => {
    const isAI = isElvaAI(userName);
    const unreadCount = getUnreadCount && !isAI ? getUnreadCount(userName) : 0;

    // Set the selected user
    setToUser(userName);

    // Immediately mark messages as read if there are unread messages (only for non-AI users)
    if (unreadCount > 0 && markMessagesAsRead && !isAI) {
      await markMessagesAsRead(userName);
    }

    // Close the user list on mobile
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay Background */}
      <div
        className={`fixed inset-0 bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* User List Container */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full w-72 sm:w-80 md:w-96 lg:w-full bg-zinc-950 border-r border-blue-400/30 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Unified Header */}
        <div className="relative p-4 border-b border-gray-700 bg-zinc-950 flex-shrink-0">
          <h2 className="text-blue-200 font-semibold text-2xl tracking-wide">Chatzone</h2>
          <div className="flex items-center gap-2">
            <h2 className="text-blue-200 font-thin text-md">All registered users</h2>

            {totalUnread > 0 && (
              <span className="animate-pulse shadow-sm shadow-pink-600 bg-gradient-to-b from-red-600/70 to-pink-700/70 absolute top-5 right-10 text-white text-xs px-2 py-2 rounded tracking-wide font-thin">
                <span className=''> {totalUnread} New Messages </span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 p-1 bg-zinc-900 hover:text-white absolute right-5 top-5 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Close user list"
          >
            <X size={20} />
          </button>
        </div>

        {/* Users List - Scrollable Container */}
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
            <div className="min-h-full">
              {/* Other Users */}
              {allUsers.map((user, index) => {
                const userObj = typeof user === 'object' ? user : { username: user, isOnline: true };
                const { username: userName, isOnline } = userObj;
                const isAI = isElvaAI(userName);
                
                // Only get unread count for non-AI users
                const unreadCount = getUnreadCount && !isAI ? getUnreadCount(userName) : 0;
                const lastMessage = getLastMessage ? getLastMessage(userName) : null;

                return (
                  <div
                    key={`${userName}-${index}`}
                    onClick={() => handleUserClick(userName)}
                    className={`relative flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 border-b hover:border-gray-700
                      ${isAI
                        ? `border-cyan-700/40 ${toUser === userName
                          ? 'bg-gradient-to-r from-teal-900/20 via-cyan-900/30 to-emerald-900/30 border-cyan-700/70 shadow-lg shadow-cyan-800/10'
                          : 'bg-gradient-to-r from-teal-950/30 via-cyan-950/30 to-emerald-950/30 hover:from-teal-900/10 hover:via-cyan-900/20 hover:to-emerald-900/30 hover:shadow-md hover:shadow-cyan-900/10'
                        }`
                        : `border-gray-600 ${toUser === userName
                          ? 'bg-green-900/30'
                          : unreadCount > 0
                            ? 'bg-zinc-950 hover:bg-zinc-950/80'
                            : 'hover:bg-zinc-900'
                        }`
                      }
                    `}
                  >
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0 mt-1">
                      {isAI ? (
                        <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center shadow-lg border-[1px] border-cyan-500 ring-2 ring-cyan-400/30 animate-pulse">
                          <Bot className="text-blue-200 w-6 h-6 drop-shadow-md " />
                        </div>
                      ) : (
                        <div className="w-10 h-10 border-[1px] border-green-600 bg-gradient-to-br from-zinc-950 to-green-800 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-semibold text-sm">
                            {userName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}

                      {/* Online/Offline Status Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${isAI
                          ? 'bg-green-500 shadow-cyan-400/60 shadow-md animate-pulse'
                          : isOnline
                            ? 'bg-green-500 shadow-green-500/50 shadow-sm'
                            : 'bg-gray-500 shadow-gray-500/50 shadow-sm'
                        }`} />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium capitalize truncate text-sm sm:text-base ${isAI
                              ? 'text-blue-200'
                              : 'text-white'
                            }`}>
                            {userName || 'Unknown User'}
                          </p>
                          {isAI && (
                            <div className="flex items-center gap-1px-2 py-1">
                              <Sparkles className="w-3 h-3 text-cyan-400 animate-ping" />
                            </div>
                          )}
                        </div>
                        {lastMessage && (
                          <span className={`text-xs flex-shrink-0 ml-2 ${isAI ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                            {formatLastMessageTime(lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      {/* Last Message Preview */}
                      {lastMessage ? (
                        <div className="flex items-center gap-1">
                          {lastMessage.isFile ? (
                            <>
                              <span className="text-xs">📎</span>
                              <p className={`text-xs truncate ${isAI ? 'text-teal-200' : 'text-gray-400'
                                }`}>
                                Sent a file
                              </p>
                            </>
                          ) : (
                            <p className={`text-xs truncate ${unreadCount > 0 && !isAI
                                ? 'text-white font-medium'
                                : isAI
                                  ? 'text-blue-200'
                                  : 'text-gray-400'
                              }`}>
                              {truncateMessage(lastMessage.message)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className={`text-xs sm:text-sm font-medium ${isAI
                            ? 'text-blue-300/50 font-thin tracking-wide flex items-center gap-1'
                            : isOnline
                              ? 'text-green-400'
                              : 'text-gray-400'
                          }`}>
                          {isAI ? (
                            <>
                              AI Assistant
                            </>
                          ) : isOnline ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>

                    {/* Message Indicators - ONLY show for non-AI users with unread messages */}
                    <div className="flex-shrink-0 flex items-center">
                      {/* Unread Message Count - ONLY show for non-AI users if unreadCount > 0 */}
                      {!isAI && unreadCount > 0 && (
                        <div className="bg-green-500/70 animate-bounce text-white text-xs px-3 py-1 rounded-full font-thin min-w-[20px] text-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>

                    {/* AI Special Glow Effect */}
                    {isAI && (
                      <div className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-emerald-500/5 shadow-inner"></div>
                    )}
                  </div>
                );
              })}

              {/* No Users */}
              {allUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
                  <div className="text-gray-500 text-4xl mb-4">👥</div>
                  <p className="text-gray-400 text-sm mb-2 font-medium">No users available</p>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-48">
                    Other registered users will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current User Section */}
        <div className="p-4 border-[1px] border-blue-400/30 rounded flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="animate-pulse w-10 h-10 bg-gradient-to-br from-zinc-900 via-pink-700 to-zinc-900 rounded-full flex items-center justify-center shadow-lg ring-2 ring-red-500">
                <span className="text-white font-semibold text-sm">
                  {username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-800 shadow-green-500/50 shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 font-medium capitalize truncate text-sm">
                {username} (You)
              </p>
              <p className="text-green-600/70 text-xs font-medium">Online</p>
            </div>
            <button
              onClick={() => logout()}
              className={`px-4 py-1 text-red-500 text-xs cursor-pointer transition-all tracking-wide font-thin border-[1px] rounded-md border-red-500/60 hover:scale-95 hover:text-blue-50 hover:shadow-sm hover:shadow-red-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserList;