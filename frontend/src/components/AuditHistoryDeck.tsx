import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
  Cpu,
  Clock,
  Eye,
  Building2,
  Send,
} from 'lucide-react';
import { useLeads } from '../context/LeadContext';
import type { LeadQualification, LeadWithLatestQualification } from '../types';

interface AuditHistoryDeckProps {
  onViewDossier: (lead: LeadWithLatestQualification) => void;
}

interface AuditEventEntry {
  qualification: LeadQualification;
  lead: LeadWithLatestQualification;
}

export const AuditHistoryDeck: React.FC<AuditHistoryDeckProps> = ({
  onViewDossier,
}) => {
  const { leads, isLoading } = useLeads();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Aggregate and sort all historical qualification events across all leads
  const allAuditEvents = useMemo(() => {
    const events: AuditEventEntry[] = [];
    const seenIds = new Set<number>();

    leads.forEach((lead) => {
      const history =
        lead.qualificationsHistory && lead.qualificationsHistory.length > 0
          ? lead.qualificationsHistory
          : lead.latestQualification
          ? [lead.latestQualification]
          : [];

      history.forEach((q) => {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          events.push({ qualification: q, lead });
        }
      });
    });

    events.sort(
      (a, b) =>
        new Date(b.qualification.created_at).getTime() -
        new Date(a.qualification.created_at).getTime()
    );

    return events;
  }, [leads]);

  // Filter events based on search and classification pills
  const filteredEvents = useMemo(() => {
    return allAuditEvents.filter((entry) => {
      const { qualification, lead } = entry;
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        (lead.company && lead.company.toLowerCase().includes(query)) ||
        (lead.email && lead.email.toLowerCase().includes(query)) ||
        (qualification.ai_model && qualification.ai_model.toLowerCase().includes(query)) ||
        (qualification.summary && qualification.summary.toLowerCase().includes(query)) ||
        (qualification.recommended_action &&
          qualification.recommended_action.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const cls = (qualification.classification || '').toUpperCase();
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'hot') return cls === 'HOT';
      if (selectedFilter === 'warm') return cls === 'WARM';
      if (selectedFilter === 'cold') return cls === 'COLD';

      return true;
    });
  }, [allAuditEvents, searchQuery, selectedFilter]);

  const renderBadge = (classification: string) => {
    const cls = (classification || '').toUpperCase();
    if (cls === 'HOT') {
      return (
        <span className="classification-badge badge-hot">
          <Flame size={12} />
          <span>HOT</span>
        </span>
      );
    }
    if (cls === 'WARM') {
      return (
        <span className="classification-badge badge-warm">
          <Zap size={12} />
          <span>WARM</span>
        </span>
      );
    }
    return (
      <span className="classification-badge badge-cold">
        <Snowflake size={12} />
        <span>COLD</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="pipeline-hero-card">
        <div className="pipeline-header">
          <div>
            <div className="pipeline-eyebrow">
              <History size={14} />
              <span>Full Historical Intelligence Ledger</span>
            </div>
            <h2 className="pipeline-title">Qualification Audit Repository</h2>
          </div>
          <p className="pipeline-subtitle">
            Immutable chronological record of all AI qualification analyses, score progressions, and strategic assessments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="system-status-pill" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <Clock size={14} />
            <span>Total Events Logged: {allAuditEvents.length}</span>
          </div>
          <div
            className="system-status-pill"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'var(--hot-color)',
              borderColor: 'var(--hot-border)',
              background: 'var(--hot-bg)',
            }}
          >
            <Flame size={14} />
            <span>
              Hot Events: {allAuditEvents.filter((e) => (e.qualification.classification || '').toUpperCase() === 'HOT').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Ledger Deck */}
      <div className="intelligence-deck">
        <div className="deck-toolbar">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon-pos" />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search audit trail by prospect, company, model, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="filter-pills-row">
            <button
              className={`filter-pill-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All Events ({allAuditEvents.length})
            </button>
            <button
              className={`filter-pill-btn ${selectedFilter === 'hot' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('hot')}
            >
              🔥 Hot Only
            </button>
            <button
              className={`filter-pill-btn ${selectedFilter === 'warm' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('warm')}
            >
              ⚡ Warm Only
            </button>
            <button
              className={`filter-pill-btn ${selectedFilter === 'cold' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('cold')}
            >
              ❄️ Cold Only
            </button>
          </div>
        </div>

        {/* Audit Stream List */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading && allAuditEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--silver-muted)' }}>
              <Sparkles size={28} className="animate-spin" color="var(--gold-primary)" style={{ margin: '0 auto 1rem' }} />
              <div>Loading audit repository snapshots...</div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--silver-muted)' }}>
              <History size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--platinum-100)' }}>
                {searchQuery || selectedFilter !== 'all'
                  ? 'No Matching Audit Records Found'
                  : 'No Qualification Audit History Yet'}
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', maxWidth: 450, margin: '0.35rem auto 0' }}>
                {searchQuery || selectedFilter !== 'all'
                  ? 'Try clearing or changing your search filters.'
                : 'As you analyze leads using the AI engine, chronological qualification records and score snapshots will be securely cataloged here.'}
              </p>
            </div>
          ) : (
            filteredEvents.map((entry) => {
              const { qualification, lead } = entry;
              const score = Math.round(Number(qualification.score) || 0);
              const dateObj = new Date(qualification.created_at);

              return (
                <div
                  key={qualification.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(18, 22, 34, 0.7) 0%, rgba(10, 12, 18, 0.85) 100%)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 14,
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'all var(--duration-normal) var(--ease-spring)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top Bar: Lead Info, Badge, Score, Timestamp, Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderBottom: '1px solid var(--border-hairline)',
                      paddingBottom: '0.85rem',
                    }}
                  >
                    {/* Lead Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--platinum-100)' }}>
                          {lead.name}
                        </div>
                        {lead.company ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--silver-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={11} />
                            <span>{lead.company}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: 'var(--silver-dark)' }}>
                            No Company Specified
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Classification & Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {renderBadge(qualification.classification)}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border-hairline)',
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'var(--silver-dark)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                          Score:
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--platinum-100)' }}>
                          {score}/100
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--silver-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={12} />
                        <span>{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Open Dossier Button */}
                      <button
                        type="button"
                        className="action-btn-sm"
                        onClick={() => onViewDossier(lead)}
                        title="Open Full Intelligence Dossier"
                      >
                        <Eye size={13} />
                        <span>View Dossier</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary & Recommended Action */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {/* Executive Summary */}
                    <div
                      style={{
                        background: 'rgba(8, 10, 16, 0.5)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 10,
                        padding: '0.85rem 1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--gold-light)',
                          fontFamily: 'var(--font-mono)',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Executive Summary</span>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--platinum-200)', lineHeight: 1.5 }}>
                        {qualification.summary}
                      </div>
                    </div>

                    {/* Recommended Action */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.03) 0%, rgba(8, 10, 16, 0.5) 100%)',
                        border: '1px solid rgba(0, 242, 254, 0.15)',
                        borderRadius: 10,
                        padding: '0.85rem 1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--ai-cyan)',
                          fontFamily: 'var(--font-mono)',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <Send size={12} />
                        <span>Recommended Action</span>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--platinum-100)', fontWeight: 600, lineHeight: 1.5 }}>
                        {qualification.recommended_action}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      fontSize: '0.72rem',
                      color: 'var(--silver-dark)',
                      fontFamily: 'var(--font-mono)',
                      paddingTop: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Cpu size={12} color="var(--ai-cyan)" />
                      <span>Model: {qualification.ai_model || 'gpt-4o-mini'}</span>
                    </div>
                    <span>•</span>
                    <div>Provider: {qualification.ai_provider || 'openrouter'}</div>
                    <span>•</span>
                    <div>Event ID: #{qualification.id}</div>
                    <span>•</span>
                    <div>Lead Reference: #{lead.id}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
