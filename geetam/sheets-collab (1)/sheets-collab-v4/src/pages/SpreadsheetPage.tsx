import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchSpreadsheet } from '../store/slices/spreadsheetSlice';
import { wsService } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SpreadsheetHeader } from '../components/spreadsheet/SpreadsheetHeader';
import { SpreadsheetGrid } from '../components/spreadsheet/SpreadsheetGrid';
import { CollaborationPanel } from '../components/spreadsheet/CollaborationPanel';

export function SpreadsheetPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { currentSpreadsheet, loading, error } = useSelector((state: RootState) => state.spreadsheet);

  useEffect(() => {
    if (id) {
      dispatch(fetchSpreadsheet(id) as any);
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (id && user) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        wsService.connect(token);
        wsService.joinSpreadsheet(id);
      }
    }

    return () => {
      if (id) {
        wsService.leaveSpreadsheet(id);
      }
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !currentSpreadsheet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Spreadsheet not found</h1>
          <p className="mt-2 text-gray-600">
            {error || 'The spreadsheet you are looking for does not exist or you do not have access to it.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <SpreadsheetHeader spreadsheet={currentSpreadsheet} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <SpreadsheetGrid spreadsheet={currentSpreadsheet} />
        </div>
        
        <CollaborationPanel />
      </div>
    </div>
  );
}