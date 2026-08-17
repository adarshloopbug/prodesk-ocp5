import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
  Server,
} from 'lucide-react';

/**
 * ConnectionStatusBar Component
 * Displays live WebSocket connectivity, readyState, backoff retry counters, endpoint selector, and controls
 */
export default function ConnectionStatusBar({
  connectionState, // 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'
  endpoint,
  onChangeEndpoint,
  retryAttempt,
  nextRetrySeconds,
  latencyMs,
  onReconnect,
  onDisconnect,
  isSlowConnection = false,
}) {
  const isOpen = connectionState === 'OPEN';
  const isConnecting = connectionState === 'CONNECTING';

  const getStatusBadge = () => {
    switch (connectionState) {
      case 'OPEN':
        return (
          <div className="conn-status-badge conn-status-open" role="status" aria-live="polite">
            <span className="live-pulse-dot" aria-hidden="true" />
            <Wifi size={14} aria-hidden="true" />
            <span className="conn-status-label">Live Socket Stream Active</span>
          </div>
        );
      case 'CONNECTING':
        return (
          <div className="conn-status-badge conn-status-connecting" role="status" aria-live="polite">
            <RefreshCw size={14} className="icon-spin" aria-hidden="true" />
            <span className="conn-status-label">
              {isSlowConnection ? 'Connecting (Slow Network Handshake)...' : 'Establishing Secure WSS Handshake...'}
            </span>
          </div>
        );
      case 'CLOSED':
      case 'CLOSING':
      default:
        return (
          <div className="conn-status-badge conn-status-closed" role="status" aria-live="polite">
            <WifiOff size={14} aria-hidden="true" />
            <span className="conn-status-label">
              {retryAttempt > 0
                ? `Disconnected - Reconnecting in ${nextRetrySeconds}s (Backoff Attempt #${retryAttempt})`
                : 'Disconnected from Stream'}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="connection-bar-container" role="region" aria-label="WebSocket Stream Connection Status">
      <div className="connection-bar-left">
        {/* Connection status badge */}
        {getStatusBadge()}

        {/* Server Endpoint Dropdown Selector */}
        <div className="conn-endpoint-selector-wrapper" title="Switch WebSocket Endpoint">
          <Server size={12} className="endpoint-icon" aria-hidden="true" />
          <select
            value={endpoint}
            onChange={(e) => onChangeEndpoint(e.target.value)}
            className="conn-endpoint-select"
            aria-label="Select WebSocket server endpoint"
          >
            <option value="ws://localhost:8080">ws://localhost:8080 (Local Broadcast Server)</option>
            <option value="wss://echo.websocket.events">wss://echo.websocket.events (Public Echo Cluster)</option>
          </select>
        </div>

        {/* Latency Meter if open */}
        {isOpen && latencyMs !== null && (
          <div className="conn-meta-item latency-badge" title="WebSocket ping-pong latency">
            <Activity size={12} aria-hidden="true" />
            <span>{latencyMs}ms RTT</span>
          </div>
        )}
      </div>

      {/* Connection Action Controls */}
      <div className="connection-bar-right">
        {isOpen ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="btn-conn-control btn-conn-disconnect"
            aria-label="Simulate network disconnection to test Unhappy Path"
            title="Close socket to verify offline handling and exponential backoff"
          >
            <WifiOff size={13} aria-hidden="true" />
            <span>Simulate Disconnect</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onReconnect}
            className="btn-conn-control btn-conn-reconnect"
            aria-label="Manually re-establish WebSocket connection immediately"
          >
            <RefreshCw size={13} className={isConnecting ? 'icon-spin' : ''} aria-hidden="true" />
            <span>Reconnect Now</span>
          </button>
        )}
      </div>
    </div>
  );
}
