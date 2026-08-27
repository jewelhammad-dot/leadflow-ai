import React, { useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useLeads } from './context/LeadContext';
import { AuthPortal } from './components/AuthPortal';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HeroPipeline } from './components/HeroPipeline';
import { MetricsDeck } from './components/MetricsDeck';
import { LeadsTable } from './components/LeadsTable';
import { LeadModal } from './components/LeadModal';
import { QualificationModal } from './components/QualificationModal';
import { QualificationHistoryModal } from './components/QualificationHistoryModal';
import { AutomationDeck } from './components/AutomationDeck';
import { SettingsDeck } from './components/SettingsDeck';
import { AuditHistoryDeck } from './components/AuditHistoryDeck';
import type { LeadWithLatestQualification, NavigationView } from './types';
import { Sparkles, AlertTriangle } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { leads, error, clearError } = useLeads();

  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [leadToEdit, setLeadToEdit] = useState<LeadWithLatestQualification | null>(null);

  const [isQualificationModalOpen, setIsQualificationModalOpen] = useState<boolean>(false);
  const [activeDossierLead, setActiveDossierLead] = useState<LeadWithLatestQualification | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyLead, setHistoryLead] = useState<LeadWithLatestQualification | null>(null);
  // Handlers
  const handleOpenCreateLead = useCallback(() => {
    setLeadToEdit(null);
    setIsLeadModalOpen(true);
  }, []);

  const handleEditLead = useCallback((lead: LeadWithLatestQualification) => {
    setLeadToEdit(lead);
    setIsLeadModalOpen(true);
  }, []);

  const handleViewDossier = useCallback((lead: LeadWithLatestQualification) => {
    setActiveDossierLead(lead);
    setIsQualificationModalOpen(true);
  }, []);

  const handleViewHistory = useCallback((lead: LeadWithLatestQualification) => {
    setHistoryLead(lead);
    setIsHistoryModalOpen(true);
  }, []);

  const handleQualifyDirectly = useCallback(async (lead: LeadWithLatestQualification) => {
    setActiveDossierLead(lead);
    setIsQualificationModalOpen(true);
  }, []);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg-canvas)',
          color: 'var(--platinum-200)',
        }}
      >
        <Sparkles size={32} className="animate-spin" color="var(--gold-primary)" />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--silver-muted)' }}>
          INITIALIZING SECURE COMMAND CENTER...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="ambient-lighting">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
        </div>
        <AuthPortal />
      </>
    );
  }

  return (
    <div className="app-layout">
      {/* Dynamic Ambient Mesh */}
      <div className="ambient-lighting">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Work Area */}
      <main className="app-main">
        <Navbar
          currentView={currentView}
          onOpenCreateLead={handleOpenCreateLead}
        />

        <div className="view-container">
          {/* Global Alert if Error */}
          {error && (
            <div className="alert-banner alert-error" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <>
              <HeroPipeline />
              <MetricsDeck />
              <LeadsTable
                onViewLead={handleViewDossier}
                onEditLead={handleEditLead}
                onQualifyLead={handleQualifyDirectly}
                onViewHistory={handleViewHistory}
              />
            </>
          )}

          {/* VIEW: LEADS */}
          {currentView === 'leads' && (
            <>
              <MetricsDeck />
              <LeadsTable
                onViewLead={handleViewDossier}
                onEditLead={handleEditLead}
                onQualifyLead={handleQualifyDirectly}
                onViewHistory={handleViewHistory}
              />
            </>
          )}

          {/* VIEW: AI QUALIFICATION */}
          {currentView === 'qualify' && (
            <>
              <HeroPipeline />
              <LeadsTable
                onViewLead={handleViewDossier}
                onEditLead={handleEditLead}
                onQualifyLead={handleQualifyDirectly}
                onViewHistory={handleViewHistory}
              />
            </>
          )}

          {/* VIEW: AUDIT HISTORY */}
          {currentView === 'history' && (
            <AuditHistoryDeck onViewDossier={handleViewDossier} />
          )}

          {/* VIEW: AUTOMATIONS */}
          {currentView === 'automation' && <AutomationDeck />}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && <SettingsDeck />}
        </div>
      </main>

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        leadToEdit={leadToEdit}
        onClose={() => {
          setIsLeadModalOpen(false);
          setLeadToEdit(null);
        }}
      />

      <QualificationModal
        isOpen={isQualificationModalOpen}
        lead={
          activeDossierLead
            ? leads.find((l) => l.id === activeDossierLead.id) || activeDossierLead
            : null
        }
        onClose={() => {
          setIsQualificationModalOpen(false);
          setActiveDossierLead(null);
        }}
        onViewHistory={(lead) => {
          setIsQualificationModalOpen(false);
          handleViewHistory(lead);
        }}
      />

      <QualificationHistoryModal
        isOpen={isHistoryModalOpen}
        lead={historyLead}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryLead(null);
        }}
      />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
