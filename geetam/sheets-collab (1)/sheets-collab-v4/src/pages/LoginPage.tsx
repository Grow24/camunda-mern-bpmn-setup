import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, FileSpreadsheet } from 'lucide-react';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleKeycloakLogin = () => {
    window.location.href = '/api/auth/keycloak';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Collaborative Spreadsheet
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in with your Keycloak account to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm text-red-800 font-medium">Authentication Error</p>
                <p className="text-sm text-red-700 mt-1">
                  {error === 'auth_failed' && 'Authentication failed. Please try again.'}
                  {error === 'token_generation_failed' && 'Failed to generate authentication token.'}
                  {error === 'Authentication failed' && 'Unable to authenticate. Please check your credentials.'}
                  {!['auth_failed', 'token_generation_failed', 'Authentication failed'].includes(error) && error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleKeycloakLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Sign in with Keycloak
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Secure authentication powered by Keycloak
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Features</h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Real-time collaboration
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Live cursors and presence
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Formula support
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}