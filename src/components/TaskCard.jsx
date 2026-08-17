import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Shield,
  ArrowRight,
  RotateCcw,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * TaskCard Component
 * Semantic <article> rendering individual Verification Tickets
 * Includes Approve/Reject dispatchers, disabled states, tooltips, and a11y labels
 */
export default function TaskCard({
  task,
  onStatusChange,
  isSocketOpen,
  isMutating = false,
}) {
  const [showDetails, setShowDetails] = useState(false);

  const isPending = task.status === 'PENDING';
  const isInProgress = task.status === 'IN_PROGRESS';
  const isApproved = task.status === 'APPROVED';
  const isRejected = task.status === 'REJECTED';
  const isCompleted = isApproved || isRejected;

  const offlineTooltipText = 'Offline - Reconnecting...';

  // Priority indicator badge
  const renderPriorityBadge = () => {
    const priority = task.priority || 'MEDIUM';
    return (
      <span className={`priority-badge priority-${priority.toLowerCase()}`} title={`Priority: ${priority}`}>
        {priority === 'CRITICAL' && <AlertTriangle size={11} aria-hidden="true" />}
        <span>{priority}</span>
      </span>
    );
  };

  // Status badge
  const renderStatusBadge = () => {
    switch (task.status) {
      case 'PENDING':
        return (
          <span className="status-pill status-pending" role="status">
            <Clock size={12} aria-hidden="true" />
            <span>Pending Verification</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="status-pill status-in-progress" role="status">
            <Shield size={12} aria-hidden="true" />
            <span>In Review</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="status-pill status-approved" role="status">
            <CheckCircle size={12} aria-hidden="true" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status-pill status-rejected" role="status">
            <XCircle size={12} aria-hidden="true" />
            <span>Rejected</span>
          </span>
        );
      default:
        return <span className="status-pill">{task.status}</span>;
    }
  };

  return (
    <article
      className={`task-card ${isCompleted ? 'task-card-completed' : ''} ${
        !isSocketOpen ? 'task-card-offline' : ''
      }`}
      aria-labelledby={`task-title-${task.id}`}
      aria-describedby={`task-desc-${task.id}`}
      tabIndex={0}
    >
      {/* Offline Banner indicator overlay inside card if disconnected */}
      {!isSocketOpen && (
        <div className="card-offline-banner" role="alert" aria-live="polite">
          <WifiOff size={12} aria-hidden="true" />
          <span>Offline - Reconnecting... Actions locked</span>
        </div>
      )}

      {/* Card Header */}
      <header className="task-card-header">
        <div className="task-card-meta-top">
          <span className="ticket-id-tag">{task.ticketNumber || `TCK-${task.id}`}</span>
          <span className="category-tag">{task.category}</span>
          {renderPriorityBadge()}
        </div>
        <div className="task-card-status-wrapper">{renderStatusBadge()}</div>
      </header>

      {/* Card Title & Content */}
      <div className="task-card-body">
        <h4 id={`task-title-${task.id}`} className="task-card-title">
          {task.title}
        </h4>
        <p id={`task-desc-${task.id}`} className="task-card-description">
          {task.description}
        </p>

        {/* Extended metadata collapsible */}
        {showDetails && (
          <div className="task-card-extended-details" aria-label="Additional ticket metadata">
            <div className="detail-row">
              <span className="detail-label">Risk Assessment:</span>
              <span className="detail-value risk-value">{task.riskScore}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Assigned Analyst:</span>
              <span className="detail-value">{task.assignee}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Submitted:</span>
              <span className="detail-value">{task.submittedAt}</span>
            </div>
            {task.history && task.history.length > 0 && (
              <div className="audit-trail-mini">
                <span className="detail-label">Latest Activity:</span>
                <span className="audit-entry">
                  {task.history[task.history.length - 1]?.user} (
                  {new Date(task.history[task.history.length - 1]?.timestamp).toLocaleTimeString()})
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata & Action Dispatchers */}
      <footer className="task-card-footer">
        <div className="task-card-meta-bottom">
          <span className="assignee-tag" title={`Assignee: ${task.assignee}`}>
            <User size={12} aria-hidden="true" />
            <span>{task.assignee}</span>
          </span>
          <button
            type="button"
            className="toggle-details-btn"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-label={showDetails ? 'Hide ticket details' : 'Show ticket details'}
          >
            <span>{showDetails ? 'Less' : 'Details'}</span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Action Buttons with Phase 3 Unhappy Path Offline Guard */}
        <div
          className="task-action-group"
          role="group"
          aria-label={`Actions for ticket ${task.ticketNumber || task.id}`}
        >
          {isPending && (
            <>
              {/* Start Review button */}
              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                  disabled={!isSocketOpen || isMutating}
                  className="btn-action btn-review"
                  aria-label={`Start review for ${task.ticketNumber || task.id}`}
                >
                  <span>Review</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
                {!isSocketOpen && <span className="tooltip-bubble" role="tooltip">{offlineTooltipText}</span>}
              </div>

              {/* Reject button */}
              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, 'REJECTED')}
                  disabled={!isSocketOpen || isMutating}
                  className="btn-action btn-reject"
                  aria-label={`Reject verification ticket ${task.ticketNumber || task.id}`}
                >
                  <XCircle size={14} aria-hidden="true" />
                  <span>Reject</span>
                </button>
                {!isSocketOpen && <span className="tooltip-bubble" role="tooltip">{offlineTooltipText}</span>}
              </div>

              {/* Approve button */}
              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, 'APPROVED')}
                  disabled={!isSocketOpen || isMutating}
                  className="btn-action btn-approve"
                  aria-label={`Approve verification ticket ${task.ticketNumber || task.id}`}
                >
                  <CheckCircle size={14} aria-hidden="true" />
                  <span>Approve</span>
                </button>
                {!isSocketOpen && <span className="tooltip-bubble" role="tooltip">{offlineTooltipText}</span>}
              </div>
            </>
          )}

          {isInProgress && (
            <>
              {/* Reject from In-Progress */}
              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, 'REJECTED')}
                  disabled={!isSocketOpen || isMutating}
                  className="btn-action btn-reject"
                  aria-label={`Reject ticket ${task.ticketNumber || task.id}`}
                >
                  <XCircle size={14} aria-hidden="true" />
                  <span>Reject</span>
                </button>
                {!isSocketOpen && <span className="tooltip-bubble" role="tooltip">{offlineTooltipText}</span>}
              </div>

              {/* Approve from In-Progress */}
              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, 'APPROVED')}
                  disabled={!isSocketOpen || isMutating}
                  className="btn-action btn-approve"
                  aria-label={`Approve ticket ${task.ticketNumber || task.id}`}
                >
                  <CheckCircle size={14} aria-hidden="true" />
                  <span>Approve</span>
                </button>
                {!isSocketOpen && <span className="tooltip-bubble" role="tooltip">{offlineTooltipText}</span>}
              </div>
            </>
          )}

          {isCompleted && (
            <div className="tooltip-wrapper">
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'PENDING')}
                disabled={!isSocketOpen || isMutating}
                className="btn-action btn-reopen"
                aria-label={`Re-open verification ticket ${task.ticketNumber || task.id} back to pending`}
              >
                <RotateCcw size={12} aria-hidden="true" />
                <span>Re-open</span>
              </button>
              {!isSocketOpen && <span className="tooltip-bubble" role="tooltip">{offlineTooltipText}</span>}
            </div>
          )}
        </div>
      </footer>
    </article>
  );
}
