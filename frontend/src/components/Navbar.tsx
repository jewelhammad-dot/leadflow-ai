import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useLeads } from '../context/LeadContext';
import type { NavigationView } from '../types';
import { api } from '../api/client';

interface NavbarProps {
  currentView: NavigationView;
  onOpenCreateLead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onOpenCreateLead,
}) => {
  const { refreshLeads, isLoading } = useLeads();
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.checkHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Command Center';
      case 'leads':
        return 'Leads Intelligence';
      case 'qualify':
        return 'AI Qualification Engine';
      case 'history':
        return 'Qualification Audit Trail';
      case 'automation':
        return 'Automation & Integrations';
      case 'settings':
        return 'System Configuration';
      default:
        return 'Command Center';
    }
  };

  return (
    <header className="app-header">
      <div className="header-title-group">
        <h1 className="header-view-title">{getViewTitle()}</h1>
        <div
          className="system-status-pill"
          style={
            !backendOnline
              ? {
                  color: 'var(--hot-color)',
                  borderColor: 'var(--hot-border)',
                  background: 'var(--hot-bg)',
                }
              : undefined
          }
        >
          <span
            className="status-dot-pulse"
            style={!backendOnline ? { backgroundColor: 'var(--hot-color)' } : undefined}
          />
          {backendOnline ? 'AI Core: Online' : 'AI Core: Connecting...'}
        </div>
      </div>

      <div className="header-actions">
        <button
          className="header-btn header-btn-ghost"
          onClick={() => refreshLeads()}
          title="Refresh Data"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>

        <button className="header-btn header-btn-gold" onClick={onOpenCreateLead}>
          <Plus size={16} />
          <span>New Lead</span>
        </button>
      </div>
    </header>
  );
};
