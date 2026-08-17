import React, { useState } from 'react';
import {
  Terminal,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  Copy,
  Check,
} from 'lucide-react';

/**
 * TelemetryFeed Component
 * Displays live WebSocket JSON payloads (Outgoing dispatches & Incoming broadcasts)
 * and analytics telemetry events in real time.
 */
export default function TelemetryFeed({ logs = [], onClearLogs }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyPayload = (log) => {
    navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section
      className={`telemetry-section ${isOpen ? 'telemetry-expanded' : 'telemetry-collapsed'}`}
      aria-label="Real-time WebSocket Telemetry and Frames Inspector"
    >
      <header className="telemetry-header">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="telemetry-toggle-btn"
          aria-expanded={isOpen}
          aria-controls="telemetry-feed-body"
        >
          <div className="telemetry-header-title">
            <Terminal size={15} aria-hidden="true" />
            <span>WebSocket Live Frame Stream & Telemetry Log</span>
            <span className="telemetry-counter-badge">{logs.length} events</span>
          </div>
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {isOpen && (
          <div className="telemetry-header-actions">
            <button
              type="button"
              onClick={onClearLogs}
              className="telemetry-clear-btn"
              aria-label="Clear telemetry logs"
              title="Clear event history"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </header>

      {isOpen && (
        <div id="telemetry-feed-body" className="telemetry-body" role="region" tabIndex={0}>
          {logs.length === 0 ? (
            <div className="telemetry-empty">
              <Activity size={24} className="telemetry-empty-icon" aria-hidden="true" />
              <p>Awaiting WebSocket frames. Dispatched actions and received events will stream here.</p>
            </div>
          ) : (
            <ul className="telemetry-log-list" role="list">
              {logs.map((log) => {
                const isOutgoing = log.direction === 'OUT';
                const isIncoming = log.direction === 'IN';
                const isAnalytics = log.direction === 'ANALYTICS';

                return (
                  <li key={log.id} className={`telemetry-log-item log-${log.direction.toLowerCase()}`}>
                    <div className="log-item-header">
                      <div className="log-direction-tag">
                        {isOutgoing && (
                          <span className="tag-out">
                            <ArrowUpRight size={12} aria-hidden="true" />
                            <span>WS DISPATCH (SENT)</span>
                          </span>
                        )}
                        {isIncoming && (
                          <span className="tag-in">
                            <ArrowDownLeft size={12} aria-hidden="true" />
                            <span>WS BROADCAST (RECV)</span>
                          </span>
                        )}
                        {isAnalytics && (
                          <span className="tag-analytics">
                            <Activity size={12} aria-hidden="true" />
                            <span>TELEMETRY PING</span>
                          </span>
                        )}
                      </div>

                      <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>

                      <button
                        type="button"
                        onClick={() => handleCopyPayload(log)}
                        className="btn-copy-payload"
                        aria-label="Copy JSON payload to clipboard"
                        title="Copy JSON payload"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check size={11} className="copied-icon" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="log-summary-text">{log.summary}</p>

                    <pre className="log-json-block" tabIndex={0}>
                      <code>{JSON.stringify(log.payload, null, 2)}</code>
                    </pre>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
