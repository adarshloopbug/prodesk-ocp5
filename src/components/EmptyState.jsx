import React from 'react';
import { CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

/**
 * Celebratory Empty State component shown when all tasks are completed
 * or when a specific column is cleared.
 */
export default function EmptyState({
  title = 'All caught up!',
  subtitle = 'Zero pending verification tickets in queue. Operations are running smoothly.',
  onReset,
  isGlobal = false,
}) {
  return (
    <div
      className={`empty-state-container ${isGlobal ? 'empty-state-global' : 'empty-state-column'}`}
      role="status"
      aria-live="polite"
      aria-label={`${title} - ${subtitle}`}
    >
      <div className="empty-state-graphic-wrapper">
        <div className="empty-state-ring-pulse" />
        <div className="empty-state-icon-badge">
          <CheckCircle2 className="empty-state-main-icon" aria-hidden="true" size={44} />
          <Sparkles className="empty-state-sparkle-icon" aria-hidden="true" size={20} />
        </div>
      </div>

      <div className="empty-state-text-block">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-subtitle">{subtitle}</p>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="empty-state-action-btn"
          aria-label="Reset demonstration dataset with sample tickets"
        >
          <RefreshCw size={14} className="icon-spin-hover" aria-hidden="true" />
          <span>Reset Sample Queue</span>
        </button>
      )}
    </div>
  );
}
