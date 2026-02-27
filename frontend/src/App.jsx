import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './Dashboard';
import SearchView from './SearchView';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#161616] text-slate-200">
        <Toaster position="bottom-right" reverseOrder={false} />
        <Sidebar />
        <main className="flex-1 ml-[80px]">
          <Routes>
            {/* Redireccionar la root al Dashboard por default (o al Search hub) */}
            <Route path="/" element={<Navigate to="/search" replace />} />

            {/* The Acquisition Hub */}
            <Route path="/search" element={<SearchView />} />

            {/* The CRM Execution Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Intelligence Section */}
            <Route path="/intelligence" element={
              <div className="p-10">
                <h1 className="text-3xl font-bold text-white mb-4">Data Intelligence</h1>
                <p className="text-slate-400">Panel reserved for API quote and cost tracking. (Coming Soon)</p>
              </div>
            } />

            {/* Settings Section */}
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
