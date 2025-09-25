import React, { useState } from 'react';
import { X, Search, Copy, Mail, Link, Users, Globe, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    type: 'spreadsheet' | 'folder';
  };
}

interface ShareForm {
  email: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
  message?: string;
  expiresAt?: string;
}

export function ShareModal({ isOpen, onClose, item }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'people' | 'link'>('people');
  const [linkSettings, setLinkSettings] = useState({
    isPublic: false,
    permission: 'VIEW' as const,
    expiresAt: '',
  });
  const [shareLink, setShareLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShareForm>();

  const permissions = [
    { value: 'VIEW', label: 'Viewer', description: 'Can view only' },
    { value: 'COMMENT', label: 'Commenter', description: 'Can view and comment' },
    { value: 'EDIT', label: 'Editor', description: 'Can view and edit' },
    { value: 'ADMIN', label: 'Admin', description: 'Full access' },
  ];

  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', avatar: null },
    { id: '2', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: null },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: null },
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data: ShareForm) => {
    console.log('Share data:', data);
    // TODO: Implement sharing logic
    reset();
  };

  const generateShareLink = () => {
    const link = `${window.location.origin}/shared/${item.id}?token=abc123`;
    setShareLink(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Share "{item.title}"
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {item.type === 'folder' ? 'Folder' : 'Spreadsheet'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'people'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Share with people
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link className="h-4 w-4 inline mr-2" />
            Get link
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'people' && (
            <div className="space-y-6">
              {/* Add People Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add people
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email', { required: 'Email is required' })}
                      type="email"
                      placeholder="Enter email addresses"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permission
                    </label>
                    <select
                      {...register('permission')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {permissions.map(perm => (
                        <option key={perm.value} value={perm.value}>
                          {perm.label} - {perm.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('expiresAt')}
                        type="date"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    {...register('message')}
                    rows={3}
                    placeholder="Add a message to your invitation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send invitation
                </button>
              </form>

              {/* Current Shares */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  People with access
                </h3>
                <div className="space-y-2">
                  {selectedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                          alt={user.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <select className="text-sm border border-gray-300 rounded px-2 py-1">
                        {permissions.map(perm => (
                          <option key={perm.value} value={perm.value}>
                            {perm.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-6">
              {/* Link Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Link sharing</h3>
                    <p className="text-xs text-gray-500">Anyone with the link can access</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkSettings.isPublic}
                      onChange={(e) => setLinkSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {linkSettings.isPublic && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Permission
                        </label>
                        <select
                          value={linkSettings.permission}
                          onChange={(e) => setLinkSettings(prev => ({ ...prev, permission: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {permissions.slice(0, 3).map(perm => (
                            <option key={perm.value} value={perm.value}>
                              {perm.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expires
                        </label>
                        <input
                          type="date"
                          value={linkSettings.expiresAt}
                          onChange={(e) => setLinkSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={generateShareLink}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Generate link
                    </button>

                    {shareLink && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 mb-1">Share link</p>
                            <p className="text-sm font-mono text-gray-900 truncate">{shareLink}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(shareLink)}
                            className="ml-3 p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}