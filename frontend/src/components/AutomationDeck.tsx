import React from 'react';
import {
  Workflow,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AutomationDeck: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Overview Intro */}
      <div className="pipeline-hero-card">
        <div className="pipeline-header">
          <div>
            <div className="pipeline-eyebrow">
              <Workflow size={14} />
              <span>Event-Driven Integration Architecture</span>
            </div>
            <h2 className="pipeline-title">Autonomous Action Pipeline</h2>
          </div>
          <p className="pipeline-subtitle">
            Downstream dispatch triggers execute asynchronously via fire-and-forget fault-tolerant pipelines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="system-status-pill" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <ShieldCheck size={14} />
            <span>Non-Blocking Isolation Enabled</span>
          </div>
          <div className="system-status-pill" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--ai-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.08)' }}>
            <Lock size={14} />
            <span>HMAC-SHA256 Payload Signature Active</span>
          </div>
        </div>
      </div>

      {/* Grid of Integration Cards */}
      <div className="integrations-grid">
        {/* Card 1: n8n Webhook */}
        <div className="integration-card">
          <div className="integration-card-top">
            <div className="integration-icon-wrap" style={{ color: 'var(--ai-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
              <Workflow size={24} />
            </div>
            <span className="integration-status-tag tag-ready">
              Architecture: Ready
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--platinum-100)', marginBottom: '0.35rem' }}>
              n8n Workflow Webhooks
            </h3>
            <p style={{ color: 'var(--silver-muted)', fontSize: '0.86rem', lineHeight: 1.5 }}>
              Dispatches structured event payloads (`lead.qualified`) directly to custom n8n workflow automations, CRM pipelines, and external sinks.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(6, 8, 12, 0.7)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 10,
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
            }}
          >
            <div style={{ color: 'var(--gold-light)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Payload Telemetry Structure:
            </div>
            <pre style={{ color: 'var(--platinum-300)', overflowX: 'auto', lineHeight: 1.4 }}>
{`{
  "event_type": "lead.qualified",
  "lead_id": 42,
  "lead_name": "Jane Prospect",
  "company": "Acme Corp",
  "qualification_status": "HOT",
  "qualification_score": 87.5
}`}
            </pre>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--silver-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color="var(--success-color)" />
              <span>Header: <code>X-Webhook-Signature: sha256=...</code></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color="var(--success-color)" />
              <span>Configurable timeout (default 10s)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Email Notification Engine */}
        <div className="integration-card">
          <div className="integration-card-top">
            <div className="integration-icon-wrap" style={{ color: 'var(--gold-primary)', borderColor: 'var(--gold-border)' }}>
              <Mail size={24} />
            </div>
            <span className="integration-status-tag tag-ready">
              Dual Provider: Ready
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--platinum-100)', marginBottom: '0.35rem' }}>
              Email Notification Service
            </h3>
            <p style={{ color: 'var(--silver-muted)', fontSize: '0.86rem', lineHeight: 1.5 }}>
              Autonomous transactional notification engine delivering instant qualification alerts and follow-up templates via SMTP or SendGrid.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(6, 8, 12, 0.7)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 10,
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
            }}
          >
            <div style={{ color: 'var(--gold-light)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Active Provider Adapters:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--platinum-300)' }}>
              <div>• <strong>SMTPEmailProvider</strong> (Built-in STARTTLS / Auth)</div>
              <div>• <strong>SendGridEmailProvider</strong> (REST API Token Delivery)</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--silver-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color="var(--success-color)" />
              <span>HTML & Plaintext multi-part formatting</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color="var(--success-color)" />
              <span>Credential concealment in logs & payload</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
