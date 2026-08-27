import React from 'react';
import {
  Settings,
  Cpu,
  Database,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsDeck: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="pipeline-hero-card">
        <div className="pipeline-header">
          <div>
            <div className="pipeline-eyebrow">
              <Settings size={14} />
              <span>Platform Core Configuration</span>
            </div>
            <h2 className="pipeline-title">System & Security Parameters</h2>
          </div>
          <p className="pipeline-subtitle">
            Environment-driven configuration with multi-tenant isolation and hardware security.
          </p>
        </div>
      </div>

      <div className="integrations-grid">
        {/* Card 1: AI Model Configuration */}
        <div className="integration-card">
          <div className="integration-card-top">
            <div className="integration-icon-wrap" style={{ color: 'var(--ai-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
              <Cpu size={24} />
            </div>
            <span className="integration-status-tag tag-ready">Active Provider</span>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--platinum-100)' }}>
            AI Reasoning Engine
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Provider: </span>
              <strong style={{ color: 'var(--platinum-100)' }}>OpenRouter AI</strong>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Primary Model: </span>
              <strong style={{ color: 'var(--ai-cyan)' }}>openai/gpt-4o-mini</strong>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Output Format: </span>
              <span style={{ color: 'var(--platinum-200)' }}>Deterministic JSON Schema</span>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Timeout: </span>
              <span style={{ color: 'var(--platinum-200)' }}>30s Request Limit</span>
            </div>
          </div>
        </div>

        {/* Card 2: Database & Storage */}
        <div className="integration-card">
          <div className="integration-card-top">
            <div className="integration-icon-wrap" style={{ color: 'var(--gold-primary)', borderColor: 'var(--gold-border)' }}>
              <Database size={24} />
            </div>
            <span className="integration-status-tag tag-ready">PostgreSQL 16</span>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--platinum-100)' }}>
            Relational Persistence
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Engine: </span>
              <strong style={{ color: 'var(--platinum-100)' }}>PostgreSQL with SQLAlchemy ORM</strong>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Alembic Head: </span>
              <code style={{ color: 'var(--gold-light)' }}>68893a2270d1</code>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Isolation: </span>
              <span style={{ color: 'var(--platinum-200)' }}>Per-User Foreign Key Enforcement</span>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Transactions: </span>
              <span style={{ color: 'var(--platinum-200)' }}>ACID Compliant Savepoints</span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Session */}
        <div className="integration-card">
          <div className="integration-card-top">
            <div className="integration-icon-wrap" style={{ color: 'var(--success-color)', borderColor: 'var(--success-border)' }}>
              <Shield size={24} />
            </div>
            <span className="integration-status-tag tag-ready">JWT HS256</span>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--platinum-100)' }}>
            Authentication & Access
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Current Officer: </span>
              <strong style={{ color: 'var(--platinum-100)' }}>{user?.email || 'Authenticated'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Token Protocol: </span>
              <span style={{ color: 'var(--platinum-200)' }}>OAuth2 Bearer Token</span>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Hashing: </span>
              <span style={{ color: 'var(--platinum-200)' }}>Bcrypt (72-byte safe)</span>
            </div>
            <div>
              <span style={{ color: 'var(--silver-dark)' }}>Token Expiry: </span>
              <span style={{ color: 'var(--platinum-200)' }}>60 Minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
