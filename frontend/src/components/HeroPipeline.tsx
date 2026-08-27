import React from 'react';
import {
  UserPlus,
  Cpu,
  Flame,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useLeads } from '../context/LeadContext';

export const HeroPipeline: React.FC = () => {
  const { metrics } = useLeads();

  return (
    <section className="pipeline-hero-card">
      <div className="pipeline-header">
        <div>
          <div className="pipeline-eyebrow">
            <Sparkles size={14} />
            <span>Autonomous Sales Intelligence Architecture</span>
          </div>
          <h2 className="pipeline-title">LeadFlowAI Neural Qualification Core</h2>
        </div>
        <p className="pipeline-subtitle">
          Real-time ingestion, continuous prompt reasoning, and automated dispatch.
        </p>
      </div>

      <div className="pipeline-flow-grid">
        {/* Node 1: Ingest */}
        <div className="pipeline-node pipeline-node-glow-gold">
          <div className="node-step-tag">
            <span>PHASE 01</span>
            <ArrowRight size={10} />
          </div>
          <div className="node-icon-wrap node-icon-gold">
            <UserPlus size={20} />
          </div>
          <div className="node-name">Multi-Channel Ingest</div>
          <div className="node-desc">
            Direct CRM capture and API ingestion with strict user isolation.
          </div>
          <div style={{ marginTop: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--gold-light)' }}>
            Active: {metrics.totalLeads} Leads
          </div>
        </div>

        {/* Node 2: AI Reasoning */}
        <div className="pipeline-node pipeline-node-glow-ai">
          <div className="node-step-tag">
            <span>PHASE 02</span>
            <ArrowRight size={10} />
          </div>
          <div className="node-icon-wrap node-icon-cyan">
            <Cpu size={20} />
          </div>
          <div className="node-name">AI Provider Engine</div>
          <div className="node-desc">
            OpenRouter GPT-4o-mini structured analysis of intent, fit, & budget.
          </div>
          <div style={{ marginTop: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ai-cyan)' }}>
            Avg Score: {metrics.averageScore}/100
          </div>
        </div>

        {/* Node 3: Scoring & Classification */}
        <div className="pipeline-node">
          <div className="node-step-tag">
            <span>PHASE 03</span>
            <ArrowRight size={10} />
          </div>
          <div className="node-icon-wrap node-icon-violet">
            <Flame size={20} />
          </div>
          <div className="node-name">Tri-Tier Scoring</div>
          <div className="node-desc">
            Deterministic classification into HOT, WARM, and COLD priority tiers.
          </div>
          <div style={{ marginTop: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--hot-color)' }}>
            Hot Priority: {metrics.hotLeads} Leads
          </div>
        </div>

        {/* Node 4: Action & Dispatch */}
        <div className="pipeline-node">
          <div className="node-step-tag">
            <span>PHASE 04</span>
            <ShieldCheck size={12} color="var(--success-color)" />
          </div>
          <div className="node-icon-wrap node-icon-emerald">
            <Send size={20} />
          </div>
          <div className="node-name">Automated Dispatch</div>
          <div className="node-desc">
            Fault-tolerant n8n HMAC webhooks and SMTP/SendGrid notifications.
          </div>
          <div style={{ marginTop: '0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--success-color)' }}>
            Qualification Rate: {metrics.qualificationRate}%
          </div>
        </div>
      </div>
    </section>
  );
};
