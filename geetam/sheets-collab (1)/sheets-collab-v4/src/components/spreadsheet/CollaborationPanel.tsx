import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Users, Clock } from 'lucide-react';

export function CollaborationPanel() {
  const { activeUsers } = useSelector((state: RootState) => state.collaboration);
  const { currentSpreadsheet } = useSelector((state: RootState) => state.spreadsheet);

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* Active Users */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center mb-3">
          <Users className="h-4 w-4 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">
            Active Users ({activeUsers.length})
          </h3>
        </div>
        
        <div className="space-y-2">
          {activeUsers.map(user => (
            <div key={user.userId} className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#10b981' }}
              />
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=24`}
                alt={user.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-700 truncate">
                {user.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center mb-3">
          <Clock className="h-4 w-4 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
        </div>
        
        <div className="space-y-3">
          {currentSpreadsheet?.activities?.slice(0, 10).map((log, index) => (
            <div key={index} className="text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <img
                  src={log.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.user?.name || log.user?.email || '')}&background=3b82f6&color=fff&size=16`}
                  alt={log.user?.name || log.user?.email}
                  className="w-4 h-4 rounded-full"
                />
                <span className="font-medium">{log.user?.name || log.user?.email}</span>
              </div>
              <p className="mt-1 text-gray-500">
                {log.action.replace('_', ' ').toLowerCase()}
              </p>
              <p className="text-gray-400">
                {new Date(log.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}