import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  HelpCircle,
  Clock,
  Users,
} from 'lucide-react';
import type { LeadWithLatestQualification } from '../types';
import { useLeads } from '../context/LeadContext';

interface LeadsTableProps {
  onViewLead: (lead: LeadWithLatestQualification) => void;
  onEditLead: (lead: LeadWithLatestQualification) => void;
  onQualifyLead: (lead: LeadWithLatestQualification) => void;
  onViewHistory: (lead: LeadWithLatestQualification) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  onViewLead,
  onEditLead,
  onQualifyLead,
  onViewHistory,
}) => {
  const { leads, isLoading, isQualifying, deleteLead } = useLeads();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        (lead.company && lead.company.toLowerCase().includes(query)) ||
        (lead.email && lead.email.toLowerCase().includes(query)) ||
        (lead.phone && lead.phone.toLowerCase().includes(query)) ||
        (lead.message && lead.message.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Filter match
      const classification = (
        lead.latestQualification?.classification || ''
      ).toUpperCase();

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'hot') return classification === 'HOT';
      if (selectedFilter === 'warm') return classification === 'WARM';
      if (selectedFilter === 'cold') return classification === 'COLD';
      if (selectedFilter === 'pending') return !lead.latestQualification;

      return true;
    });
  }, [leads, searchQuery, selectedFilter]);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete lead "${name}"?`)) {
      setDeletingId(id);
      try {
        await deleteLead(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const renderClassificationBadge = (lead: LeadWithLatestQualification) => {
    if (!lead.latestQualification) {
      return (
        <span className="classification-badge badge-unscored">
          <HelpCircle size={11} />
          <span>Pending AI</span>
        </span>
      );
    }

    const cls = lead.latestQualification.classification.toUpperCase();
    if (cls === 'HOT') {
      return (
        <span className="classification-badge badge-hot">
          <Flame size={11} />
          <span>HOT</span>
        </span>
      );
    }
    if (cls === 'WARM') {
      return (
        <span className="classification-badge badge-warm">
          <Zap size={11} />
          <span>WARM</span>
        </span>
      );
    }
    if (cls === 'COLD') {
      return (
        <span className="classification-badge badge-cold">
          <Snowflake size={11} />
          <span>COLD</span>
        </span>
      );
    }

    return (
      <span className="classification-badge badge-unscored">
        <span>{cls}</span>
      </span>
    );
  };

  const renderScoreBar = (lead: LeadWithLatestQualification) => {
    if (!lead.latestQualification) {
      return <span style={{ color: 'var(--silver-dark)', fontSize: '0.78rem' }}>—</span>;
    }

    const score = Math.round(Number(lead.latestQualification.score) || 0);
    const cls = lead.latestQualification.classification.toUpperCase();
    const fillClass =
      cls === 'HOT' ? 'fill-hot' : cls === 'WARM' ? 'fill-warm' : 'fill-cold';

    return (
      <div className="score-pill-container">
        <span className="score-number-display">{score}</span>
        <div className="score-mini-bar">
          <div
            className={`score-mini-fill ${fillClass}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="intelligence-deck">
      <div className="deck-toolbar">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon-pos" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search leads by name, company, email..."
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
            All Leads ({leads.length})
          </button>
          <button
            className={`filter-pill-btn ${selectedFilter === 'hot' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('hot')}
          >
            🔥 Hot Opportunities
          </button>
          <button
            className={`filter-pill-btn ${selectedFilter === 'warm' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('warm')}
          >
            ⚡ Warm Leads
          </button>
          <button
            className={`filter-pill-btn ${selectedFilter === 'cold' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('cold')}
          >
            ❄️ Cold
          </button>
          <button
            className={`filter-pill-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('pending')}
          >
            ⏳ Pending AI
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="intelligence-table">
          <thead>
            <tr>
              <th>Lead Identity</th>
              <th>Contact Details</th>
              <th>AI Classification</th>
              <th>Score</th>
              <th style={{ textAlign: 'right' }}>Intelligence Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && leads.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                    <Sparkles size={24} className="animate-spin" color="var(--gold-primary)" />
                    <span style={{ color: 'var(--silver-muted)' }}>
                      Querying neural pipeline database...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem' }}>
                  <div style={{ color: 'var(--silver-muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--platinum-200)' }}>
                      No Leads Found
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                      {searchQuery
                        ? 'Try modifying your search or filter criteria.'
                        : 'Create your first lead to launch autonomous qualification.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const qualifying = !!isQualifying[lead.id];
                const deleting = deletingId === lead.id;

                return (
                  <tr key={lead.id}>
                    {/* Identity */}
                    <td>
                      <div className="lead-identity-cell">
                        <span className="lead-primary-name">{lead.name}</span>
                        {lead.company ? (
                          <span className="lead-company-name">
                            <Building2 size={11} style={{ display: 'inline', marginRight: 4 }} />
                            {lead.company}
                          </span>
                        ) : (
                          <span className="lead-company-name" style={{ color: 'var(--silver-dark)' }}>
                            No Company Specified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div className="contact-cell">
                        {lead.email ? (
                          <span className="contact-email">
                            <Mail size={11} style={{ display: 'inline', marginRight: 4, opacity: 0.7 }} />
                            {lead.email}
                          </span>
                        ) : (
                          <span className="contact-email" style={{ color: 'var(--silver-dark)' }}>
                            No email
                          </span>
                        )}
                        {lead.phone && (
                          <span className="contact-phone">
                            <Phone size={10} style={{ display: 'inline', marginRight: 4, opacity: 0.7 }} />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Classification */}
                    <td>{renderClassificationBadge(lead)}</td>

                    {/* Score Bar */}
                    <td>{renderScoreBar(lead)}</td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-row" style={{ justifyContent: 'flex-end' }}>
                        {/* Qualify Button */}
                        <button
                          className="action-btn-sm action-btn-qualify"
                          onClick={() => onQualifyLead(lead)}
                          disabled={qualifying}
                          title="Run AI Qualification"
                        >
                          <Sparkles size={13} className={qualifying ? 'animate-spin' : ''} />
                          <span>{qualifying ? 'Analyzing...' : 'Qualify'}</span>
                        </button>

                        {/* View Dossier / Details */}
                        <button
                          className="action-btn-sm"
                          onClick={() => onViewLead(lead)}
                          title="View Intelligence Dossier"
                        >
                          <Eye size={13} />
                          <span>Dossier</span>
                        </button>

                        {/* History */}
                        <button
                          className="action-btn-sm"
                          onClick={() => onViewHistory(lead)}
                          title="Audit Trail / History"
                        >
                          <Clock size={13} />
                        </button>

                        {/* Edit */}
                        <button
                          className="action-btn-sm"
                          onClick={() => onEditLead(lead)}
                          title="Edit Lead"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          className="action-btn-sm"
                          style={{ color: 'var(--silver-dark)' }}
                          onClick={() => handleDelete(lead.id, lead.name)}
                          disabled={deleting}
                          title="Delete Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
