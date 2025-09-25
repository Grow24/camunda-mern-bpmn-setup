import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Clock, 
  Star, 
  Users, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  FolderPlus,
  Plus,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', count: null },
    { icon: Clock, label: 'Recent', path: '/recent', count: null },
    { icon: Star, label: 'Starred', path: '/starred', count: null },
    { icon: Users, label: 'Shared with me', path: '/shared', count: 3 },
    { icon: Trash2, label: 'Trash', path: '/trash', count: null },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleCreateSpreadsheet = () => {
    setShowCreateMenu(false);
    // TODO: Open create spreadsheet modal
  };

  const handleCreateFolder = () => {
    setShowCreateMenu(false);
    // TODO: Open create folder modal
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            // <h1 className="text-lg font-semibold text-gray-900">Drive</h1>
            <h1 className="text-lg font-semibold text-gray-900">Sheets</h1>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Create Button */}
      <div className="p-4">
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className={`w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${
              isCollapsed ? 'px-3' : ''
            }`}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2 font-medium">New</span>}
          </button>

          {/* Create Menu */}
          {showCreateMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={handleCreateSpreadsheet}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <div className="w-6 h-6 bg-green-100 rounded mr-3 flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                </div>
                Spreadsheet
              </button>
              <button
                onClick={handleCreateFolder}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <FolderPlus className="w-5 h-5 text-gray-500 mr-3" />
                Folder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      {item.count && (
                        <span className="ml-2 bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || '')}&background=3b82f6&color=fff`}
            alt={user?.name || user?.email}
            className="h-8 w-8 rounded-full flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}