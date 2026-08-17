import React from 'react';
import {
  ShieldCheck,
  Radio,
  Moon,
  Sun,
  Users,
} from 'lucide-react';

/**
 * Header Component
 * Monochromatic corporate header bar with operations room indicators
 */
export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="app-header" role="banner">
      <div className="header-container">
        {/* Brand & Room Identifier */}
        <div className="header-brand-group">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <ShieldCheck size={20} className="brand-logo-icon" />
          </div>
          <div className="brand-text-block">
            <div className="brand-title-row">
              <h1 className="brand-title">OP-ROOM 01 // VERIFICATION MATRIX</h1>
              <span className="environment-badge">LIVE STREAM</span>
            </div>
            <p className="brand-subtitle">
              Enterprise Event-Driven Workflow Stream Engine
            </p>
          </div>
        </div>

        {/* Global Stats & Metrics */}
        <div className="header-meta-group">
          <div className="header-stat-chip" title="Connected Operators in active Operations Room">
            <Users size={13} aria-hidden="true" />
            <span className="stat-label">Active Operators:</span>
            <span className="stat-val">12 Peers</span>
          </div>

          <div className="header-stat-chip" title="WebSocket Protocol">
            <Radio size={13} aria-hidden="true" />
            <span className="stat-label">Stream:</span>
            <span className="stat-val">wss:// v2.4</span>
          </div>

          {/* Theme Toggle (Dark / Light Monochromatic) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} monochromatic mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
