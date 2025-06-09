import React from 'react';
import { Download, FileText } from 'lucide-react';

const ChatMessages = ({ messages, username, toUser, formatTime, formatDate, messagesEndRef }) => {
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileMessage = (message) => {
    const { fileInfo } = message;
    const isImage = fileInfo?.mimeType?.startsWith('image/');
    const isVideo = fileInfo?.mimeType?.startsWith('video/');

    if (isImage) {
      return (
        <div className="max-w-xs lg:max-w-sm">
          <img
            src={message.message}
            alt={fileInfo?.fileName || 'Shared image'}
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.message, '_blank')}
            loading="lazy"
          />
          {fileInfo?.fileName && (
            <div className="text-xs text-gray-300 mt-2 flex items-center justify-between">
              <span className="truncate flex-1 mr-2">{fileInfo.fileName}</span>
              <a
                href={message.message}
                download
                className="flex-shrink-0 p-1 hover:bg-gray-600 rounded transition-colors"
                title="Download"
              >
                <Download size={12} />
              </a>
            </div>
          )}
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="max-w-xs lg:max-w-sm">
          <video
            controls
            className="rounded-lg max-w-full h-auto"
            preload="metadata"
          >
            <source src={message.message} type={fileInfo?.mimeType} />
            Your browser does not support the video tag.
          </video>
          {fileInfo?.fileName && (
            <div className="text-xs text-gray-300 mt-2 flex items-center justify-between gap-2">
              <span className="truncate flex-1">{fileInfo.fileName}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {fileInfo.fileSize && (
                  <span className="text-gray-400">({formatFileSize(fileInfo.fileSize)})</span>
                )}
                <a
                  href={message.message}
                  download
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                  title="Download"
                >
                 
                </a>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback for other file types
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg max-w-xs lg:max-w-sm">
        <FileText size={20} className="text-gray-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {fileInfo?.fileName || 'Unknown file'}
          </div>
          {fileInfo?.fileSize && (
            <div className="text-xs text-gray-400">
              {formatFileSize(fileInfo.fileSize)}
            </div>
          )}
        </div>
        <a
          href={message.message}
          download
          className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
          title="Download"
        >
          {/* <Download size={14} /> */}
        </a>
      </div>
    );
  };

  return (
    <div className="flex-1 px-3 lg:px-6 py-4 space-y-3 pb-32 lg:pb-28 overflow-y-auto bg-zinc-950">
      {/* No chat selected state */}
      {!toUser && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="text-6xl lg:text-8xl mb-4 opacity-20">💬</div>
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-300 mb-2">
            Select a chat to start messaging
          </h3>
          <p className="text-gray-500 text-sm lg:text-base">
            Choose from your contacts on the {window.innerWidth >= 1024 ? 'left' : 'user list'} to begin a conversation
          </p>
        </div>
      )}

      {/* Messages */}
      {toUser && messages
        .filter(
          (m) =>
            (m.fromUser === username && m.toUser === toUser) ||
            (m.fromUser === toUser && m.toUser === username)
        )
        .map((m, i, filteredMessages) => {
          const messageTime = m.timestamp || m.timeStamp || Date.now();
          const isFileMessage = m.messageType === 'file';
          const isOwnMessage = m.fromUser === username;
          
          return (
            <div key={i} className="flex flex-col">
              {/* Date Separator */}
              {i === 0 || formatDate(messageTime) !== formatDate(filteredMessages[i - 1]?.timestamp || filteredMessages[i - 1]?.timeStamp || Date.now()) ? (
                <div className="text-center text-xs text-gray-500 my-3 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative inline-block bg-zinc-950 px-3">
                    {formatDate(messageTime)}
                  </div>
                </div>
              ) : null}

              {/* Message Bubble */}
              <div className={`px-3 py-3 rounded-2xl mb-1 max-w-[85%] lg:max-w-sm break-words ${
                isOwnMessage
                  ? 'bg-green-900 text-white self-end ml-auto rounded-br-md'
                  : 'bg-green-800 text-white self-start mr-auto rounded-bl-md'
              }`}>
                <div className="flex flex-col gap-1">
                  {/* Sender Name - Only show for received messages on mobile */}
                  {!isOwnMessage && (
                    <span className="font-medium text-green-300 capitalize text-xs lg:text-sm">
                      {m.fromUser}
                    </span>
                  )}
                  
                  {/* Message Content */}
                  <div className="flex-1">
                    {isFileMessage ? (
                      <div className="mt-1">
                        {renderFileMessage(m)}
                      </div>
                    ) : (
                      <span className="text-sm lg:text-base leading-relaxed">
                        {m.message}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Timestamp */}
                <div className={`text-xs mt-2 ${
                  isOwnMessage ? 'text-green-200' : 'text-gray-300'
                } text-right`}>
                  {formatTime(messageTime)}
                </div>
              </div>
            </div>
          );
        })}
      
      {/* Empty chat state */}
      {toUser && messages.filter(
        (m) =>
          (m.fromUser === username && m.toUser === toUser) ||
          (m.fromUser === toUser && m.toUser === username)
      ).length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="text-4xl lg:text-6xl mb-4 opacity-30">👋</div>
          <h3 className="text-lg lg:text-xl font-semibold text-gray-300 mb-2">
            Start your conversation with {toUser}
          </h3>
          <p className="text-gray-500 text-sm lg:text-base">
            Send a message to begin chatting
          </p>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;