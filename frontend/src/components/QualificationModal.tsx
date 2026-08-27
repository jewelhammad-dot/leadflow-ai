import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
  Cpu,
  Send,
  MessageSquare,
  Clock,
} from 'lucide-react';
import type { LeadWithLatestQualification } from '../types';
import { useLeads } from '../context/LeadContext';

interface QualificationModalProps {
  isOpen: boolean;
  lead: LeadWithLatestQualification | null;
  onClose: () => void;
  onViewHistory: (lead: LeadWithLatestQualification) => void;
}

export const QualificationModal: React.FC<QualificationModalProps> = ({
  isOpen,
  lead,
  onClose,
  onViewHistory,
}) => {
  const { qualifyLead, isQualifying } = useLeads();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const qualification = lead.latestQualification;
  const isCurrentlyQualifying = !!isQualifying[lead.id];

  const handleRunQualify = async () => {
    setErrorMessage(null);
    try {
      await qualifyLead(lead.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI qualification failed.');
    }
  };

  const getScoreDetails = (classification: string) => {
    const cls = (classification || '').toUpperCase();
    if (cls === 'HOT') {
      return {
        color: 'var(--hot-color)',
        bg: 'var(--hot-bg)',
        border: 'var(--hot-border)',
        label: 'HOT PRIORITY',
        icon: <Flame size={18} color="var(--hot-color)" />,
      };
    }
    if (cls === 'WARM') {
      return {
        color: 'var(--warm-color)',
        bg: 'var(--warm-bg)',
        border: 'var(--warm-border)',
        label: 'WARM ENGAGEMENT',
        icon: <Zap size={18} color="var(--warm-color)" />,
      };
    }
    return {
      color: 'var(--cold-color)',
      bg: 'var(--cold-bg)',
      border: 'var(--cold-border)',
      label: 'COLD NURTURE',
      icon: <Snowflake size={18} color="var(--cold-color)" />,
    };
  };

  const score = qualification ? Math.round(Number(qualification.score) || 0) : 0;
  const details = qualification
    ? getScoreDetails(qualification.classification)
    : null;

  // SVG Gauge calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--gold-primary)" />
              <h2 className="modal-title">AI Intelligence Dossier</h2>
            </div>
            <span className="modal-subtitle">
              Prospect #{lead.id}: {lead.name} {lead.company ? `(${lead.company})` : ''}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {errorMessage && (
            <div className="alert-banner alert-error">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Top Score Banner / Hero */}
          {qualification && details ? (
            <div className="dossier-hero-box">
              {/* Radial Score Gauge */}
              <div className="dossier-gauge-wrap">
                <svg width="110" height="110" className="gauge-svg-circle">
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke={details.color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 1s var(--ease-spring)' }}
                  />
                </svg>
                <div className="gauge-center-text">
                  <span className="gauge-score-val" style={{ color: details.color }}>
                    {score}
                  </span>
                  <span className="gauge-score-label">AI Score</span>
                </div>
              </div>

              {/* Classification Meta */}
              <div className="dossier-meta-column">
                <div className="dossier-classification-row">
                  <span
                    className="classification-badge"
                    style={{
                      background: details.bg,
                      color: details.color,
                      borderColor: details.border,
                      fontSize: '0.86rem',
                      padding: '6px 14px',
                    }}
                  >
                    {details.icon}
                    <span>{details.label}</span>
                  </span>
                </div>

                <div className="dossier-telemetry-strip" style={{ marginTop: '0.5rem' }}>
                  <div className="dossier-telemetry-item">
                    <Cpu size={13} color="var(--ai-cyan)" />
                    <span>{qualification.ai_model || 'gpt-4o-mini'}</span>
                  </div>
                  <div className="dossier-telemetry-item">
                    <Clock size={13} />
                    <span>
                      {new Date(qualification.created_at).toLocaleDateString()}{' '}
                      {new Date(qualification.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="dossier-hero-box"
              style={{
                justifyContent: 'center',
                textAlign: 'center',
                flexDirection: 'column',
                padding: '2.5rem',
              }}
            >
              <Sparkles size={36} color="var(--gold-primary)" style={{ opacity: 0.8 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--platinum-100)' }}>
                No AI Qualification on Record
              </div>
              <p style={{ color: 'var(--silver-muted)', fontSize: '0.85rem', maxWidth: 400 }}>
                This lead has not yet been processed by the neural qualification model.
                Click below to execute autonomous qualification.
              </p>
            </div>
          )}

          {/* AI Executive Summary Card */}
          {qualification && (
            <>
              <div className="dossier-section-card">
                <div className="dossier-card-title">
                  <Sparkles size={14} color="var(--gold-primary)" />
                  <span>Executive AI Assessment</span>
                </div>
                <div className="dossier-card-text">{qualification.summary}</div>
              </div>

              {/* Recommended Action Card */}
              <div
                className="dossier-section-card"
                style={{
                  borderColor: 'rgba(0, 242, 254, 0.25)',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.04), rgba(12, 16, 26, 0.7))',
                }}
              >
                <div className="dossier-card-title" style={{ color: 'var(--ai-cyan)' }}>
                  <Send size={14} color="var(--ai-cyan)" />
                  <span>Strategic Recommended Action</span>
                </div>
                <div className="dossier-card-text" style={{ fontWeight: 600 }}>
                  {qualification.recommended_action}
                </div>
              </div>
            </>
          )}

          {/* Prospect Contact & Inquiry Context */}
          <div className="dossier-section-card">
            <div className="dossier-card-title" style={{ color: 'var(--silver-muted)' }}>
              <MessageSquare size={14} />
              <span>Prospect Context & Inquiry Notes</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--silver-dark)' }}>Email</span>
                <div style={{ fontSize: '0.88rem', color: 'var(--platinum-200)' }}>
                  {lead.email || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--silver-dark)' }}>Phone</span>
                <div style={{ fontSize: '0.88rem', color: 'var(--platinum-200)' }}>
                  {lead.phone || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--silver-dark)' }}>Company</span>
                <div style={{ fontSize: '0.88rem', color: 'var(--platinum-200)' }}>
                  {lead.company || '—'}
                </div>
              </div>
            </div>

            {lead.message ? (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.85rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  color: 'var(--platinum-300)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                "{lead.message}"
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--silver-dark)', fontStyle: 'italic' }}>
                No inquiry notes provided with this record.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {qualification && (
            <button
              type="button"
              className="header-btn header-btn-ghost"
              onClick={() => onViewHistory(lead)}
            >
              <Clock size={15} />
              <span>Audit History ({lead.qualificationsHistory?.length || 1})</span>
            </button>
          )}

          <button
            type="button"
            className="header-btn header-btn-gold"
            onClick={handleRunQualify}
            disabled={isCurrentlyQualifying}
          >
            <Sparkles size={15} className={isCurrentlyQualifying ? 'animate-spin' : ''} />
            <span>
              {isCurrentlyQualifying
                ? 'Reasoning with AI...'
                : qualification
                ? 'Re-Analyze with AI'
                : 'Run AI Qualification'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
