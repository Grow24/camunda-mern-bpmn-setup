import React, { useState } from 'react';
import { useSpreadsheetStore, Comment } from '../../stores/spreadsheetStore';
import { MessageSquare, Reply, X, Send } from 'lucide-react';

interface CommentSystemProps {
  row: number;
  col: number;
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export const CommentSystem: React.FC<CommentSystemProps> = ({
  row,
  col,
  isVisible,
  onClose,
  position
}) => {
  const { sheets, activeSheet, addComment, addReply, theme } = useSpreadsheetStore();
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const cell = sheets[activeSheet]?.[row]?.[col];
  const comments = cell?.comments || [];
  const legacyComment = cell?.comment;

  // Convert legacy comment to new format if needed
  const allComments = legacyComment && !comments.length ? [{
    id: 'legacy',
    text: legacyComment,
    author: 'User',
    timestamp: 'Legacy comment',
    replies: []
  }] : comments;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      text: newComment.trim(),
      author: 'User', // In a real app, this would be the current user
      timestamp: new Date().toLocaleString(),
      replies: []
    };
    
    addComment(row, col, comment);
    setNewComment('');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    
    const reply: Comment = {
      id: `reply-${Date.now()}`,
      text: replyText.trim(),
      author: 'User',
      timestamp: new Date().toLocaleString(),
      replies: []
    };
    
    addReply(row, col, commentId, reply);
    setReplyText('');
    setReplyingTo(null);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}
      style={{
        left: position.x,
        top: position.y-300,
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b ${
        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <span className="font-medium">Comments</span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded hover:bg-gray-100 ${
            theme === 'dark' ? 'hover:bg-gray-700' : ''
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Comments List */}
      <div className="p-3 space-y-3">
        {allComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Main Comment */}
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {comment.timestamp}
                </span>
              </div>
              <p className="text-sm">{comment.text}</p>
              <button
                onClick={() => setReplyingTo(comment.id)}
                className={`mt-2 text-xs flex items-center gap-1 hover:underline ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                <Reply size={12} />
                Reply
              </button>
            </div>

            {/* Replies */}
            {comment.replies.map((reply) => (
              <div key={reply.id} className={`ml-6 p-2 rounded ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs">{reply.author}</span>
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {reply.timestamp}
                  </span>
                </div>
                <p className="text-xs">{reply.text}</p>
              </div>
            ))}

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="ml-6 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className={`w-full p-2 text-sm border rounded resize-none ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Send size={12} />
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className={`px-3 py-1 text-xs rounded border ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-white hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New Comment Input */}
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={`w-full p-2 text-sm border rounded resize-none ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            rows={3}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Send size={12} />
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};