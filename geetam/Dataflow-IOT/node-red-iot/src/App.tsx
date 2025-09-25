import React from 'react';
import { Toaster } from 'react-hot-toast';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <WorkflowBuilder />
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;