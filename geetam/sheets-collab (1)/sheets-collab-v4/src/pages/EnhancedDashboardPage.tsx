import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid3X3, 
  List, 
  Filter, 
  SortAsc, 
  Plus,
  FolderPlus,
  Upload,
  MoreVertical
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Breadcrumb } from '../components/files/Breadcrumb';
import { FileGrid } from '../components/files/FileGrid';
import { ShareModal } from '../components/sharing/ShareModal';
import { CreateSpreadsheetModal } from '../components/dashboard/CreateSpreadsheetModal';

export function EnhancedDashboardPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState('/');

  // Mock data - replace with real data from API
  const [files, setFiles] = useState([
    {
      id: '1',
      name: 'Q4 Budget Analysis',
      type: 'spreadsheet' as const,
      owner: { name: 'John Doe', email: 'john@example.com' },
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isStarred: true,
      isShared: true,
      size: '2.4 MB',
      permissions: ['EDIT'],
    },
    {
      id: '2',
      name: 'Marketing Reports',
      type: 'folder' as const,
      owner: { name: 'Sarah Wilson', email: 'sarah@example.com' },
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      isStarred: false,
      isShared: true,
      permissions: ['VIEW'],
    },
    {
      id: '3',
      name: 'Sales Dashboard',
      type: 'spreadsheet' as const,
      owner: { name: 'Mike Johnson', email: 'mike@example.com' },
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      isStarred: false,
      isShared: false,
      size: '1.8 MB',
      permissions: ['OWNER'],
    },
    {
      id: '4',
      name: 'Project Timeline',
      type: 'spreadsheet' as const,
      owner: { name: 'You', email: 'you@example.com' },
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      isStarred: true,
      isShared: false,
      size: '956 KB',
      permissions: ['OWNER'],
    },
  ]);

  const breadcrumbItems = [
    // { id: 'root', name: 'My Drive', path: '/' },
    { id: 'root', name: 'Grow24-Sheets', path: '/' },
  ];

  const handleFileClick = (file: any) => {
    if (file.type === 'folder') {
      // Navigate to folder
      setCurrentPath(`${currentPath}${file.name}/`);
    } else {
      // Open spreadsheet
      navigate(`/spreadsheet/${file.id}`);
    }
  };

  const handleFileAction = (action: string, file: any) => {
    switch (action) {
      case 'share':
        setSelectedItem(file);
        setShowShareModal(true);
        break;
      case 'star':
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, isStarred: !f.isStarred } : f
        ));
        break;
      case 'delete':
        setFiles(prev => prev.filter(f => f.id !== file.id));
        break;
      case 'rename':
        // TODO: Implement rename
        break;
      case 'copy':
        // TODO: Implement copy
        break;
      case 'move':
        // TODO: Implement move
        break;
      case 'download':
        // TODO: Implement download
        break;
    }
  };

  const handleCreateSpreadsheet = (data: { title: string; description?: string }) => {
    const newFile = {
      id: Date.now().toString(),
      name: data.title,
      type: 'spreadsheet' as const,
      owner: { name: 'You', email: 'you@example.com' },
      lastModified: new Date().toISOString(),
      isStarred: false,
      isShared: false,
      size: '0 KB',
      permissions: ['OWNER'],
    };
    setFiles(prev => [newFile, ...prev]);
    navigate(`/spreadsheet/${newFile.id}`);
  };

  const sortedFiles = [...files].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'modified':
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      case 'owner':
        return a.owner.name.localeCompare(b.owner.name);
      default:
        return 0;
    }
  });

  const filteredFiles = sortedFiles.filter(file => {
    switch (filterBy) {
      case 'spreadsheets':
        return file.type === 'spreadsheet';
      case 'folders':
        return file.type === 'folder';
      case 'starred':
        return file.isStarred;
      case 'shared':
        return file.isShared;
      default:
        return true;
    }
  });

  return (
    // <MainLayout title="My Drive">
    <MainLayout title="Grow24-Sheets">
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb 
            items={breadcrumbItems} 
            onNavigate={setCurrentPath} 
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Create Menu */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                New
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <div className="w-6 h-6 bg-green-100 rounded mr-3 flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                  </div>
                  Spreadsheet
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                  <FolderPlus className="w-5 h-5 text-gray-500 mr-3" />
                  Folder
                </button>
                <hr className="my-2" />
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                  <Upload className="w-5 h-5 text-gray-500 mr-3" />
                  File upload
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All items</option>
                <option value="spreadsheets">Spreadsheets</option>
                <option value="folders">Folders</option>
                <option value="starred">Starred</option>
                <option value="shared">Shared</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="modified">Last modified</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File Grid */}
        <FileGrid
          files={filteredFiles}
          viewMode={viewMode}
          onFileClick={handleFileClick}
          onFileAction={handleFileAction}
        />

        {/* Empty State */}
        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderPlus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No files found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating a new spreadsheet or folder
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create spreadsheet
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showShareModal && selectedItem && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          item={selectedItem}
        />
      )}

      {showCreateModal && (
        <CreateSpreadsheetModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSpreadsheet}
        />
      )}
    </MainLayout>
  );
}