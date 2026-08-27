import React from 'react';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  History,
  Workflow,
  Settings,
  LogOut,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLeads } from '../context/LeadContext';
import type { NavigationView } from '../types';

interface SidebarProps {
  currentView: NavigationView;
  onSelectView: (view: NavigationView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
}) => {
  const { user, logout } = useAuth();
  const { leads, metrics } = useLeads();

  const navItems: {
    id: NavigationView;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Command Center',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'leads',
      label: 'Leads Pipeline',
      icon: <Users size={18} />,
      badgeCount: leads.length,
    },
    {
      id: 'qualify',
      label: 'AI Qualification',
      icon: <Sparkles size={18} />,
      badgeCount: metrics.hotLeads + metrics.warmLeads,
    },
    {
      id: 'history',
      label: 'Audit History',
      icon: <History size={18} />,
    },
    {
      id: 'automation',
      label: 'Integrations',
      icon: <Workflow size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="brand-section">
        <div className="brand-logo-gem">
          <Crown size={20} color="var(--gold-primary)" />
        </div>
        <div>
          <div className="brand-name">
            LeadFlow<span>AI</span>
          </div>
        </div>
        <span className="brand-badge">V1.0</span>
      </div>

      <ul className="nav-menu">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onSelectView(item.id)}
              >
                <span className="nav-link-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="nav-badge-count">{item.badgeCount}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="user-profile-section">
        <div className="user-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <div className="user-name" title={user?.email}>
            {user?.name || 'Operator'}
          </div>
          <div className="user-role">Authenticated Officer</div>
        </div>
        <button
          className="btn-logout-icon"
          onClick={logout}
          title="Sign out of Command Center"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};
