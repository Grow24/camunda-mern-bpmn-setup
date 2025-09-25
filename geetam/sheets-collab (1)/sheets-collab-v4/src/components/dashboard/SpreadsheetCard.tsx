import React from 'react';
import { FileSpreadsheet, Users, Clock } from 'lucide-react';

interface Spreadsheet {
  id: string;
  title: string;
  description?: string;
  updatedAt: string;
  permissions: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }>;
}

interface SpreadsheetCardProps {
  spreadsheet: Spreadsheet;
  onClick: () => void;
}

export function SpreadsheetCard({ spreadsheet, onClick }: SpreadsheetCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <FileSpreadsheet className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {spreadsheet.title}
            </h3>
            {spreadsheet.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {spreadsheet.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(spreadsheet.updatedAt)}
        </div>

        <div className="flex items-center">
          <Users className="h-3 w-3 mr-1" />
          {spreadsheet.permissions.length}
        </div>
      </div>

      {/* Collaborators */}
      <div className="mt-3 flex -space-x-1">
        {spreadsheet.permissions.slice(0, 3).map((permission) => (
          <img
            key={permission.user.id}
            src={permission.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(permission.user.name)}&background=3b82f6&color=fff&size=24`}
            alt={permission.user.name}
            className="h-6 w-6 rounded-full border-2 border-white"
            title={permission.user.name}
          />
        ))}
        {spreadsheet.permissions.length > 3 && (
          <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600">
            +{spreadsheet.permissions.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}