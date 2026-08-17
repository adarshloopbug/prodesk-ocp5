import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { sanitizeString } from '../utils/security';

/**
 * CreateTicketModal Component
 * Accessible modal allowing users to dispatch a brand-new verification ticket over WebSocket
 */
export default function CreateTicketModal({ isOpen, onClose, onSubmit, isSocketOpen }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Identity Compliance');
  const [priority, setPriority] = useState('HIGH');
  const [assignee, setAssignee] = useState('Operator (Current Session)');
  const [riskScore, setRiskScore] = useState('0.35 - Moderate Risk');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTicket = {
      id: Date.now(),
      ticketNumber: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: sanitizeString(title),
      description: sanitizeString(description || 'Manual operational ticket queued for compliance review.'),
      category: sanitizeString(category),
      priority,
      status: 'PENDING',
      assignee: sanitizeString(assignee),
      riskScore: sanitizeString(riskScore),
      submittedAt: 'Just now',
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          user: assignee,
        },
      ],
    };

    onSubmit(newTicket);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header className="modal-header">
          <div className="modal-title-group">
            <PlusCircle size={18} aria-hidden="true" />
            <h2 id="modal-title" className="modal-title">
              Queue New Verification Ticket
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close ticket creation modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="ticket-title" className="form-label">
              Ticket Title <span className="required-star">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AML Watchlist Check - Apex Group Ltd"
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="ticket-desc" className="form-label">
              Investigation Summary / Context
            </label>
            <textarea
              id="ticket-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the anomalies, flagged rules, or settlement details..."
              className="form-textarea"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="ticket-cat" className="form-label">
                Category
              </label>
              <select
                id="ticket-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                <option value="Identity Compliance">Identity Compliance (KYC)</option>
                <option value="Sanctions / AML">Sanctions / PEP / AML</option>
                <option value="Treasury Ops">Treasury Settlement</option>
                <option value="SecOps Audit">SOC 2 / SecOps Clearance</option>
                <option value="Fraud Prevention">Fraud Heuristics</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ticket-priority" className="form-label">
                Priority Tier
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-select"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="ticket-assignee" className="form-label">
                Assignee
              </label>
              <input
                id="ticket-assignee"
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ticket-risk" className="form-label">
                Risk Classification
              </label>
              <input
                id="ticket-risk"
                type="text"
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isSocketOpen || !title.trim()}
              className="btn-modal-primary"
              aria-label="Broadcast new ticket over WebSocket"
            >
              <PlusCircle size={15} aria-hidden="true" />
              <span>Broadcast Ticket to Stream</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
