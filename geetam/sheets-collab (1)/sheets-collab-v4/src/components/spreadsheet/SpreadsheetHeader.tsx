import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Users, Download, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SpreadsheetHeaderProps {
  spreadsheet: {
    id: string;
    title: string;
    description?: string;
    permissions: Array<{
      user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
      };
      permission: string;
    }>;
  };
}

export function SpreadsheetHeader({ spreadsheet }: SpreadsheetHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(spreadsheet.title);

  const handleTitleSave = () => {
    // TODO: Implement title update
    setIsEditing(false);
  };

  const handleShare = () => {
    // TODO: Open share modal
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setTitle(spreadsheet.title);
                    setIsEditing(false);
                  }
                }}
                className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditing(true)}
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              >
                {spreadsheet.title}
              </h1>
            )}

            {spreadsheet.description && (
              <span className="text-sm text-gray-500">
                {spreadsheet.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Collaborators */}
          <div className="flex -space-x-1">
            {spreadsheet.permissions.slice(0, 5).map((permission) => (
              <img
                key={permission.user.id}
                src={permission.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(permission.user.name)}&background=3b82f6&color=fff&size=32`}
                alt={permission.user.name}
                className="h-8 w-8 rounded-full border-2 border-white"
                title={`${permission.user.name} (${permission.permission})`}
              />
            ))}
            {spreadsheet.permissions.length > 5 && (
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                +{spreadsheet.permissions.length - 5}
              </div>
            )}
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <Download className="h-5 w-5" />
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}