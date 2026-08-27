import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
} from 'lucide-react';
import type { LeadQualification, LeadWithLatestQualification } from '../types';
import { useLeads } from '../context/LeadContext';

interface QualificationHistoryModalProps {
  isOpen: boolean;
  lead: LeadWithLatestQualification | null;
  onClose: () => void;
}

export const QualificationHistoryModal: React.FC<QualificationHistoryModalProps> = ({
  isOpen,
  lead,
  onClose,
}) => {
  const { fetchLeadHistory } = useLeads();
  const [history, setHistory] = useState<LeadQualification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const leadId = lead?.id;

  useEffect(() => {
    if (isOpen && leadId) {
      setIsLoading(true);
      fetchLeadHistory(leadId)
        .then((res) => setHistory(res))
        .catch(() => setHistory(lead?.qualificationsHistory || []))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, leadId, fetchLeadHistory]);

  if (!isOpen || !lead) return null;

  const renderBadge = (classification: string) => {
    const cls = (classification || '').toUpperCase();
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
    return (
      <span className="classification-badge badge-cold">
        <Snowflake size={11} />
        <span>COLD</span>
      </span>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="var(--gold-primary)" />
              <h2 className="modal-title">Qualification Audit Trail</h2>
            </div>
            <span className="modal-subtitle">
              Historical analysis records for prospect #{lead.id}: {lead.name}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--silver-muted)' }}>
              <Sparkles size={24} className="animate-spin" color="var(--gold-primary)" style={{ margin: '0 auto 0.75rem' }} />
              <div>Fetching chronological qualification snapshots...</div>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--silver-muted)' }}>
              <History size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: 'var(--platinum-200)' }}>
                Zero Historical Records
              </div>
              <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>
                This prospect has not yet undergone AI qualification analysis.
              </p>
            </div>
          ) : (
            <div className="history-timeline">
              {history.map((record, index) => {
                const score = Math.round(Number(record.score) || 0);
                const isLatest = index === 0;

                return (
                  <div key={record.id} className="history-item">
                    <div className="history-item-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {renderBadge(record.classification)}
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--platinum-100)' }}>
                          Score: {score}/100
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'rgba(212, 175, 55, 0.15)',
                              color: 'var(--gold-light)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                            }}
                          >
                            LATEST
                          </span>
                        )}
                      </div>

                      <div className="history-timestamp">
                        {new Date(record.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'rgba(14, 17, 26, 0.65)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 10,
                        padding: '1rem',
                        marginTop: '0.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', color: 'var(--platinum-200)' }}>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginRight: 6 }}>
                          Summary:
                        </span>
                        {record.summary}
                      </div>

                      <div style={{ fontSize: '0.84rem', color: 'var(--ai-cyan)' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginRight: 6 }}>
                          Action:
                        </span>
                        {record.recommended_action}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem', color: 'var(--silver-dark)', fontFamily: 'var(--font-mono)', paddingTop: 6, borderTop: '1px solid var(--border-hairline)' }}>
                        <span>Provider: {record.ai_provider}</span>
                        <span>•</span>
                        <span>Model: {record.ai_model}</span>
                        <span>•</span>
                        <span>ID: #{record.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="header-btn header-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
