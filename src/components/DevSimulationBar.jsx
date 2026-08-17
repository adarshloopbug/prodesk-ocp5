import React from 'react';
import {
  Sparkles,
  WifiOff,
  UserCheck,
  Send,
  Gauge,
} from 'lucide-react';

/**
 * DevSimulationBar Component
 * Facilitates manual QA and evaluation of Acceptance Criteria (AC1-AC4, Unhappy Path)
 */
export default function DevSimulationBar({
  onSimulateRemotePeerUpdate,
  onSimulateRemoteNewTicket,
  onTriggerSocketDrop,
  isSocketOpen,
  isSimulatingPeer,
  isSlowNetwork,
  onToggleSlowNetwork,
}) {
  return (
    <aside className="dev-simulation-bar" aria-label="Developer & QA Testing Toolbar">
      <div className="dev-bar-title-section">
        <Sparkles size={14} className="dev-sparkle" aria-hidden="true" />
        <span className="dev-bar-title">QA & Evaluation Simulation Controls:</span>
      </div>

      <div className="dev-bar-actions" role="group" aria-label="Simulation triggers">
        {/* Simulate remote peer mutation */}
        <button
          type="button"
          onClick={onSimulateRemotePeerUpdate}
          disabled={!isSocketOpen || isSimulatingPeer}
          className="btn-sim-action"
          title="Simulates an external user approving or reviewing a ticket via WebSocket"
          aria-label="Simulate peer user status update over WebSocket (AC4 test)"
        >
          <UserCheck size={13} aria-hidden="true" />
          <span>Simulate Peer User Update (AC4)</span>
        </button>

        {/* Simulate remote ticket arrival */}
        <button
          type="button"
          onClick={onSimulateRemoteNewTicket}
          disabled={!isSocketOpen}
          className="btn-sim-action"
          title="Simulates automated stream ingesting a new compliance ticket"
          aria-label="Simulate remote ticket ingestion"
        >
          <Send size={13} aria-hidden="true" />
          <span>Simulate Incoming Ticket</span>
        </button>

        {/* Toggle Slow 3G Simulation */}
        <button
          type="button"
          onClick={onToggleSlowNetwork}
          className={`btn-sim-action ${isSlowNetwork ? 'btn-sim-active' : ''}`}
          title="Toggle simulated slow network latency"
          aria-label="Toggle Slow 3G latency simulation"
        >
          <Gauge size={13} aria-hidden="true" />
          <span>{isSlowNetwork ? 'Slow 3G Mode (ON)' : 'Simulate Slow 3G'}</span>
        </button>

        {/* Kill socket to test backoff & offline lockdown */}
        <button
          type="button"
          onClick={onTriggerSocketDrop}
          className="btn-sim-action btn-sim-danger"
          title="Disconnect socket to test disabled button state and exponential backoff retry"
          aria-label="Kill socket to test Phase 3 Unhappy Path"
        >
          <WifiOff size={13} aria-hidden="true" />
          <span>Test Unhappy Path (Kill Socket)</span>
        </button>
      </div>
    </aside>
  );
}
