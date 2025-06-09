import React from 'react';
import { BsPersonLinesFill } from "react-icons/bs";
import { Users } from 'lucide-react';

const ChatHeader = ({ toUser, users, onToggleUserList }) => {
  const userObj = users.find(u => (typeof u === 'object' ? u.username : u) === toUser);
  const isOnline = userObj && typeof userObj === 'object' ? userObj.isOnline : true;

  return (
    <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-700 bg-zinc-950 flex items-center gap-3 flex-shrink-0">
      {/* Mobile User List Toggle Button */}
      <button
        onClick={onToggleUserList}
        className="lg:hidden text-white hover:text-green-300 p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
        aria-label="Toggle user list"
      >
        <Users size={20} />
      </button>

      {/* Desktop Icon - Only shown on desktop */}
      <span className='hidden lg:block text-white text-2xl font-bold flex-shrink-0'>
        <BsPersonLinesFill />
      </span>

      {/* Chat Title and User Info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg lg:text-xl font-semibold text-white truncate">
          Chat with <span className="text-green-300 capitalize">{toUser || '...'}</span>
        </h1>
        
        {/* User Status - Only show if user is selected */}
        {toUser && (
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`h-2 w-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
            />
            <p className="text-xs lg:text-sm text-gray-400 truncate">
              {isOnline ? 'Online now' : 'Offline - Messages will be delivered when online'}
            </p>
          </div>
        )}
      </div>

      {/* User Avatar - Mobile Only */}
      <div className="lg:hidden flex-shrink-0">
        {toUser && (
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-950 to-green-800 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {toUser.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;