import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './Dashboard';
import AcquisitionHub from './features/AcquisitionHub/AcquisitionHub';
import Sidebar from './components/Sidebar/Sidebar';
import Settings from './components/Settings/SettingsPanel';
import { SalesRepModal } from './components/Modals';
import DataIntelligencePanel from './components/DataIntelligence/DataIntelligencePanel';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#161616] text-slate-200">
        <Toaster position="bottom-right" reverseOrder={false} />
        <SalesRepModal />
        <Sidebar />
        <main className="flex-1 ml-[80px]">
          <Routes>
            {/* Redireccionar la root al Dashboard por default (o al Search hub) */}
            <Route path="/" element={<Navigate to="/search" replace />} />

            {/* The Acquisition Hub */}
            <Route path="/search" element={<AcquisitionHub />} />

            {/* The CRM Execution Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Data Intelligence Command Center */}
            <Route path="/intelligence" element={<DataIntelligencePanel />} />

            {/* Settings Section */}
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
