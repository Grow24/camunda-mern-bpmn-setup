import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, FileSpreadsheet, Users, Settings, Search, LogOut } from 'lucide-react';
import { RootState } from '../store';
import { fetchSpreadsheets, createSpreadsheet } from '../store/slices/spreadsheetSlice';
import { addToast } from '../store/slices/uiSlice';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CreateSpreadsheetModal } from '../components/dashboard/CreateSpreadsheetModal';
import { SpreadsheetCard } from '../components/dashboard/SpreadsheetCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const { spreadsheets, loading } = useSelector((state: RootState) => state.spreadsheet);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchSpreadsheets() as any);
  }, [dispatch]);

  const handleCreateSpreadsheet = async (data: { title: string; description?: string }) => {
    try {
      const result = await dispatch(createSpreadsheet(data) as any);
      if (result.payload) {
        navigate(`/spreadsheet/${result.payload.id}`);
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to create spreadsheet',
        message: 'Please try again'
      }));
    }
  };

  const filteredSpreadsheets = spreadsheets.filter(sheet =>
    sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sheet.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Collaborative Spreadsheet
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || '')}&background=3b82f6&color=fff`}
                  alt={user?.name || user?.email}
                  className="h-8 w-8 rounded-full"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Spreadsheets</h2>
            <p className="mt-1 text-gray-600">
              Create and collaborate on spreadsheets in real-time
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Spreadsheet
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search spreadsheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Spreadsheets grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredSpreadsheets.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery ? 'No spreadsheets found' : 'No spreadsheets yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Get started by creating a new spreadsheet'
              }
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Spreadsheet
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSpreadsheets.map(spreadsheet => (
              <SpreadsheetCard
                key={spreadsheet.id}
                spreadsheet={spreadsheet}
                onClick={() => navigate(`/spreadsheet/${spreadsheet.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSpreadsheetModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSpreadsheet}
        />
      )}
    </div>
  );
}