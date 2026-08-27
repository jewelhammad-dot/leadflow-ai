import React from 'react';
import {
  Users,
  Flame,
  Zap,
  Snowflake,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useLeads } from '../context/LeadContext';

export const MetricsDeck: React.FC = () => {
  const { metrics } = useLeads();

  return (
    <div className="metrics-deck-grid">
      {/* Card 1: Total Leads */}
      <div className="metric-card-3d">
        <div className="metric-top-bar">
          <span className="metric-label">Total Leads</span>
          <div
            className="metric-icon-bubble"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--platinum-100)',
            }}
          >
            <Users size={17} />
          </div>
        </div>
        <div className="metric-value-huge">{metrics.totalLeads}</div>
        <div className="metric-sub-note">
          <span>In database pipeline</span>
        </div>
      </div>

      {/* Card 2: Hot Leads */}
      <div
        className="metric-card-3d"
        style={{
          borderLeft: '2px solid var(--hot-color)',
        }}
      >
        <div className="metric-top-bar">
          <span className="metric-label" style={{ color: 'var(--hot-color)' }}>
            Hot Leads
          </span>
          <div
            className="metric-icon-bubble"
            style={{
              background: 'var(--hot-bg)',
              color: 'var(--hot-color)',
            }}
          >
            <Flame size={17} />
          </div>
        </div>
        <div className="metric-value-huge" style={{ color: 'var(--hot-color)' }}>
          {metrics.hotLeads}
        </div>
        <div className="metric-sub-note">
          <span>High conversion intent</span>
        </div>
      </div>

      {/* Card 3: Warm Leads */}
      <div
        className="metric-card-3d"
        style={{
          borderLeft: '2px solid var(--warm-color)',
        }}
      >
        <div className="metric-top-bar">
          <span className="metric-label" style={{ color: 'var(--warm-color)' }}>
            Warm Leads
          </span>
          <div
            className="metric-icon-bubble"
            style={{
              background: 'var(--warm-bg)',
              color: 'var(--warm-color)',
            }}
          >
            <Zap size={17} />
          </div>
        </div>
        <div className="metric-value-huge" style={{ color: 'var(--warm-color)' }}>
          {metrics.warmLeads}
        </div>
        <div className="metric-sub-note">
          <span>Follow-up recommended</span>
        </div>
      </div>

      {/* Card 4: Cold Leads */}
      <div
        className="metric-card-3d"
        style={{
          borderLeft: '2px solid var(--cold-color)',
        }}
      >
        <div className="metric-top-bar">
          <span className="metric-label" style={{ color: 'var(--cold-color)' }}>
            Cold Leads
          </span>
          <div
            className="metric-icon-bubble"
            style={{
              background: 'var(--cold-bg)',
              color: 'var(--cold-color)',
            }}
          >
            <Snowflake size={17} />
          </div>
        </div>
        <div className="metric-value-huge" style={{ color: 'var(--cold-color)' }}>
          {metrics.coldLeads}
        </div>
        <div className="metric-sub-note">
          <span>Long-term nurturing</span>
        </div>
      </div>

      {/* Card 5: Avg AI Score */}
      <div className="metric-card-3d">
        <div className="metric-top-bar">
          <span className="metric-label">Avg AI Score</span>
          <div
            className="metric-icon-bubble"
            style={{
              background: 'rgba(0, 242, 254, 0.1)',
              color: 'var(--ai-cyan)',
            }}
          >
            <TrendingUp size={17} />
          </div>
        </div>
        <div className="metric-value-huge" style={{ color: 'var(--ai-cyan)' }}>
          {metrics.averageScore}
          <span style={{ fontSize: '1.1rem', color: 'var(--silver-dark)' }}>/100</span>
        </div>
        <div className="metric-sub-note">
          <span>{metrics.totalLeads - metrics.unqualifiedLeads} Scored Leads</span>
        </div>
      </div>

      {/* Card 6: Qualified Rate */}
      <div className="metric-card-3d">
        <div className="metric-top-bar">
          <span className="metric-label">Processed Rate</span>
          <div
            className="metric-icon-bubble"
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              color: 'var(--gold-primary)',
            }}
          >
            <Percent size={17} />
          </div>
        </div>
        <div className="metric-value-huge" style={{ color: 'var(--gold-light)' }}>
          {metrics.qualificationRate}%
        </div>
        <div className="metric-sub-note">
          <span>{metrics.unqualifiedLeads} pending analysis</span>
        </div>
      </div>
    </div>
  );
};
