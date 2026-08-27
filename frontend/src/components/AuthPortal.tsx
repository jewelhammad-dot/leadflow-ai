import React, { useState } from 'react';
import { Crown, Sparkles, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPortal: React.FC = () => {
  const { login, register, error, clearError, isLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all required credentials.');
      return;
    }

    if (tab === 'register' && !name.trim()) {
      setLocalError('Please provide your officer name.');
      return;
    }

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      // Error handled in AuthContext
    }
  };

  const handleQuickFillDemo = () => {
    setEmail('admin@leadflow.ai');
    setPassword('LeadFlow123!');
    if (tab === 'register') {
      setName('LeadFlow Operator');
    }
  };

  const displayedError = localError || error;

  return (
    <div className="auth-portal-wrapper">
      <div className="auth-card-frame">
        {/* Brand Icon & Name */}
        <div className="auth-brand-center">
          <div className="brand-logo-gem" style={{ width: 50, height: 50, marginBottom: '1rem' }}>
            <Crown size={28} color="var(--gold-primary)" />
          </div>
          <h1 className="brand-name" style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>
            LeadFlow<span>AI</span>
          </h1>
          <p style={{ color: 'var(--silver-muted)', fontSize: '0.82rem', maxWidth: 300 }}>
            Autonomous Sales Intelligence & Qualification Command Center
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs-toggle">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setLocalError(null);
              clearError();
            }}
          >
            Access Portal
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setLocalError(null);
              clearError();
            }}
          >
            Register Officer
          </button>
        </div>

        {/* Error Alert */}
        {displayedError && (
          <div className="alert-banner alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>{displayedError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">
                <UserIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alexander Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={tab === 'register'}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
              Officer Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. operator@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={12} style={{ display: 'inline', marginRight: 4 }} />
              Secure Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isLoading}>
            {isLoading ? (
              <span>Authenticating...</span>
            ) : tab === 'login' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Authenticate Session</span>
                <ArrowRight size={16} />
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Create Officer Account</span>
                <Sparkles size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickFillDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--silver-dark)',
              fontSize: '0.76rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              transition: 'color var(--duration-fast)',
            }}
            onMouseOver={(e) => ((e.target as HTMLElement).style.color = 'var(--gold-light)')}
            onMouseOut={(e) => ((e.target as HTMLElement).style.color = 'var(--silver-dark)')}
          >
            Auto-fill credentials helper
          </button>
        </div>

        {/* Security Badge */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.72rem',
            color: 'var(--silver-dark)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <ShieldCheck size={13} color="var(--success-color)" />
          <span>AES-256 JWT Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
};
