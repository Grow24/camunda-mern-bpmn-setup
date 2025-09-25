import React from 'react';
import { Play, Save, Settings, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onSave: () => void;
  onExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
}

export function Header({ onSave, onExecute, isExecuting, isConnected }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          IoT Workflow Builder
        </h1>
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onSave}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
        
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="flex items-center space-x-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Running...' : 'Run Flow'}</span>
        </button>
        
        <div className="flex items-center space-x-1 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}