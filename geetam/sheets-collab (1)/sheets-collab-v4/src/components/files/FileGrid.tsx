import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Folder, 
  MoreVertical, 
  Star, 
  Share2, 
  Download, 
  Trash2,
  Edit3,
  Copy,
  Move
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileItem {
  id: string;
  name: string;
  type: 'spreadsheet' | 'folder';
  owner: {
    name: string;
    email: string;
    avatar?: string;
  };
  lastModified: string;
  isStarred: boolean;
  isShared: boolean;
  size?: string;
  permissions: string[];
}

interface FileGridProps {
  files: FileItem[];
  viewMode: 'grid' | 'list';
  onFileClick: (file: FileItem) => void;
  onFileAction: (action: string, file: FileItem) => void;
}

export function FileGrid({ files, viewMode, onFileClick, onFileAction }: FileGridProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const handleFileSelect = (fileId: string, isCtrlClick: boolean) => {
    if (isCtrlClick) {
      setSelectedFiles(prev =>
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFiles([fileId]);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return Folder;
      case 'spreadsheet':
        return FileSpreadsheet;
      default:
        return FileSpreadsheet;
    }
  };

  const contextMenuItems = [
    { icon: Edit3, label: 'Rename', action: 'rename' },
    { icon: Star, label: 'Add to starred', action: 'star' },
    { icon: Share2, label: 'Share', action: 'share' },
    { icon: Copy, label: 'Make a copy', action: 'copy' },
    { icon: Move, label: 'Move', action: 'move' },
    { icon: Download, label: 'Download', action: 'download' },
    { divider: true },
    { icon: Trash2, label: 'Move to trash', action: 'delete', danger: true },
  ];

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Last modified</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1"></div>
        </div>

        {/* Files */}
        <div className="divide-y divide-gray-100">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            const isSelected = selectedFiles.includes(file.id);

            return (
              <div
                key={file.id}
                className={`grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
                onClick={(e) => {
                  if (e.detail === 2) {
                    onFileClick(file);
                  } else {
                    handleFileSelect(file.id, e.ctrlKey || e.metaKey);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className="col-span-6 flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${
                    file.type === 'folder' ? 'text-blue-500' : 'text-green-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </span>
                  {file.isStarred && (
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  )}
                  {file.isShared && (
                    <Share2 className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                <div className="col-span-2 flex items-center">
                  <img
                    src={file.owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(file.owner.name)}&background=3b82f6&color=fff&size=24`}
                    alt={file.owner.name}
                    className="h-6 w-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-600 truncate">
                    {file.owner.name}
                  </span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })}
                  </span>
                </div>

                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-gray-600">
                    {file.size || '-'}
                  </span>
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, file);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {files.map((file) => {
        const Icon = getFileIcon(file.type);
        const isSelected = selectedFiles.includes(file.id);

        return (
          <div
            key={file.id}
            className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all group ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={(e) => {
              if (e.detail === 2) {
                onFileClick(file);
              } else {
                handleFileSelect(file.id, e.ctrlKey || e.metaKey);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            <div className="flex items-center justify-between mb-3">
              <Icon className={`h-8 w-8 ${
                file.type === 'folder' ? 'text-blue-500' : 'text-green-500'
              }`} />
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.isStarred && (
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                )}
                {file.isShared && (
                  <Share2 className="h-4 w-4 text-gray-400" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                {file.name}
              </h3>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {contextMenuItems.map((item, index) => {
              if (item.divider) {
                return <hr key={index} className="my-2" />;
              }

              const Icon = item.icon!;
              return (
                <button
                  key={index}
                  onClick={() => {
                    onFileAction(item.action!, contextMenu.file);
                    setContextMenu(null);
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    item.danger ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}