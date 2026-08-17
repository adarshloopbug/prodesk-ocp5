import React, { useState, useEffect, useRef, useCallback } from 'react';
import KanbanBoard from './KanbanBoard';
import ConnectionStatusBar from './ConnectionStatusBar';
import TelemetryFeed from './TelemetryFeed';
import DevSimulationBar from './DevSimulationBar';
import CreateTicketModal from './CreateTicketModal';
import { INITIAL_TASKS } from '../data/initialTasks';
import { validateSocketPayload, sanitizeTicket } from '../utils/security';
import { PlusCircle, Filter, Search, RotateCcw } from 'lucide-react';

const DEFAULT_WS_ENDPOINT = 'ws://localhost:8080';
const MAX_BACKOFF_SECONDS = 32;

/**
 * WorkflowEngine Component
 * Core stateful React engine interfacing with live WebSocket stream
 */
export default function WorkflowEngine() {
  // Task state: initialized with array of enterprise verification tasks
  const [tasks, setTasks] = useState(() => INITIAL_TASKS.map(sanitizeTicket));

  // Endpoint state: supports local broadcast server or public echo cluster
  const [endpoint, setEndpoint] = useState(DEFAULT_WS_ENDPOINT);

  // Connection & socket states
  const [connectionState, setConnectionState] = useState('CONNECTING'); // 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [nextRetrySeconds, setNextRetrySeconds] = useState(0);
  const [latencyMs, setLatencyMs] = useState(null);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isSimulatingPeer, setIsSimulatingPeer] = useState(false);

  // UI Filter & Modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Telemetry logs
  const [telemetryLogs, setTelemetryLogs] = useState([
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      direction: 'ANALYTICS',
      summary: 'WorkflowEngine initialized. Mounting WebSocket listener.',
      payload: { client: 'WorkflowEngine.jsx', version: '1.0.0-enterprise' },
    },
  ]);

  // Refs for socket instance, cleanup, backoff timers, and ping intervals
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const pingTimestampRef = useRef(null);
  const isIntentionalCloseRef = useRef(false);
  const retryCountRef = useRef(0);
  const initiateSocketConnectionRef = useRef(null);

  // Helper to record telemetry
  const recordTelemetry = useCallback((direction, summary, payload) => {
    const newLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      direction,
      summary,
      payload,
    };
    setTelemetryLogs((prev) => [newLog, ...prev.slice(0, 49)]); // keep latest 50
  }, []);

  /**
   * Exponential backoff reconnection algorithm
   * Schedule retry with delay: 1s, 2s, 4s, 8s, 16s, max 32s
   */
  const scheduleReconnect = useCallback(() => {
    if (isIntentionalCloseRef.current) return;

    // Clear existing timers
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const attempt = retryCountRef.current + 1;
    retryCountRef.current = attempt;
    setRetryAttempt(attempt);

    // Calculate delay: 2^(attempt - 1) seconds, capped
    const delaySeconds = Math.min(Math.pow(2, attempt - 1), MAX_BACKOFF_SECONDS);
    let remaining = delaySeconds;
    setNextRetrySeconds(remaining);

    // Update countdown timer every second
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setNextRetrySeconds(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 1000);

    recordTelemetry('ANALYTICS', `Scheduled reconnection in ${delaySeconds}s (Attempt #${attempt})`, {
      attempt,
      delaySeconds,
      strategy: 'EXPONENTIAL_BACKOFF',
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      if (initiateSocketConnectionRef.current) {
        initiateSocketConnectionRef.current();
      }
    }, delaySeconds * 1000);
  }, [recordTelemetry]);

  /**
   * Main WebSocket connection initiator
   */
  const initiateSocketConnection = useCallback(() => {
    // Clean up existing instance if any
    if (socketRef.current) {
      try {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      } catch {
        // silent cleanup
      }
      socketRef.current = null;
    }

    setConnectionState('CONNECTING');
    isIntentionalCloseRef.current = false;

    recordTelemetry('OUT', `Connecting to WebSocket endpoint: ${endpoint}`, {
      endpoint,
      readyState: 0,
      protocol: 'ws/wss',
    });

    try {
      const ws = new WebSocket(endpoint);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionState('OPEN');
        setRetryAttempt(0);
        retryCountRef.current = 0;
        setNextRetrySeconds(0);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        recordTelemetry('IN', 'WebSocket connection established successfully. Joined active operations room.', {
          status: 'CONNECTED',
          endpoint,
          protocol: ws.protocol || 'wss/ws',
        });

        // Ping for initial latency check
        pingTimestampRef.current = Date.now();
        const pingPayload = JSON.stringify({ type: 'PING', timestamp: pingTimestampRef.current });
        ws.send(pingPayload);
      };

      ws.onmessage = (event) => {
        try {
          // Handle string or object data
          let data;
          if (typeof event.data === 'string') {
            // Check if it's the welcome message from echo server
            if (event.data.includes('echo.websocket.events') || event.data.startsWith('Echo')) {
              recordTelemetry('IN', 'Handshake response from echo cluster', { raw: event.data });
              return;
            }
            data = JSON.parse(event.data);
          } else {
            data = event.data;
          }

          // Handle PING/PONG latency calculation
          if (data && data.type === 'PING') {
            if (pingTimestampRef.current) {
              const rtt = Date.now() - pingTimestampRef.current;
              setLatencyMs(rtt);
            }
            return;
          }

          // Security validation: ensure valid schema
          const validation = validateSocketPayload(data);
          if (!validation.valid) {
            console.warn('[Security / Parser] Dropped invalid WebSocket frame:', validation.reason, data);
            return;
          }

          // AC4 & Phase 2 Event Listener: Update local React state upon receiving broadcast
          if (data.type === 'STATUS_UPDATE') {
            // Telemetry Simulation per NFR:
            // "Log a specific message to the console (e.g., [Analytics] Task status mutated via WebSocket)"
            console.log('[Analytics] Task status mutated via WebSocket', {
              taskId: data.taskId,
              newStatus: data.newStatus,
              timestamp: data.timestamp || new Date().toISOString(),
              user: data.user || 'Remote Operator',
            });

            recordTelemetry(
              'IN',
              `Broadcast received: Task #${data.taskId} -> ${data.newStatus} (by ${data.user || 'Peer User'})`,
              data
            );

            // Critical Constraint: Use functional state update pattern to prevent stale closures
            setTasks((prevTasks) =>
              prevTasks.map((task) => {
                if (task.id === Number(data.taskId) || task.id === data.taskId) {
                  const updatedHistory = [
                    ...(task.history || []),
                    {
                      status: data.newStatus,
                      timestamp: data.timestamp || new Date().toISOString(),
                      user: data.user || 'Remote WebSocket Broadcast',
                    },
                  ];

                  return {
                    ...task,
                    status: data.newStatus,
                    updatedAt: data.timestamp || new Date().toISOString(),
                    history: updatedHistory,
                  };
                }
                return task;
              })
            );
          } else if (data.type === 'NEW_TICKET') {
            const sanitizedNewTicket = sanitizeTicket(data.ticket);
            recordTelemetry('IN', `New verification ticket ingested: ${sanitizedNewTicket.ticketNumber}`, sanitizedNewTicket);

            setTasks((prevTasks) => {
              if (prevTasks.some((t) => t.id === sanitizedNewTicket.id)) {
                return prevTasks;
              }
              return [sanitizedNewTicket, ...prevTasks];
            });
          }
        } catch {
          // If message is raw plain text from echo server, log as information
          recordTelemetry('IN', 'Received non-JSON stream text', { text: event.data });
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket Error]', error);
        recordTelemetry('ANALYTICS', 'WebSocket encountered connection error', {
          error: 'Connection dropped or network unreachable',
        });
      };

      ws.onclose = (event) => {
        setConnectionState('CLOSED');
        recordTelemetry('ANALYTICS', `WebSocket closed (Code: ${event.code || 'Normal'})`, {
          code: event.code,
          reason: event.reason || 'Connection terminated',
          wasClean: event.wasClean,
        });

        // Trigger exponential backoff reconnect if not intentionally closed by user unmount
        if (!isIntentionalCloseRef.current) {
          scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket instance:', err);
      setConnectionState('CLOSED');
      scheduleReconnect();
    }
  }, [endpoint, recordTelemetry, scheduleReconnect]);

  useEffect(() => {
    initiateSocketConnectionRef.current = initiateSocketConnection;
  }, [initiateSocketConnection]);

  /**
   * Phase 1: Instantiate WebSocket connection inside useEffect
   * Cleanup on unmount by calling ws.close() to prevent memory leaks
   */
  useEffect(() => {
    initiateSocketConnection();

    // Memory leak prevention: Cleanup function MUST close WebSocket and clear all active timers
    return () => {
      isIntentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [initiateSocketConnection]);

  /**
   * AC3 & Phase 2: Action Dispatcher
   * When Approve or Reject is clicked, send JSON payload via ws.send()
   * and optimistically handle or wait for echo/broadcast
   */
  const handleStatusChange = useCallback(
    (taskId, newStatus) => {
      const ws = socketRef.current;

      // Phase 3 Unhappy Path check: Guard against clicking when offline
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('Action blocked: WebSocket is offline or reconnecting.');
        return;
      }

      setIsMutating(true);
      setTimeout(() => setIsMutating(false), 300);

      const payload = {
        type: 'STATUS_UPDATE',
        taskId,
        newStatus,
        timestamp: new Date().toISOString(),
        user: 'Current Operator (Local Session)',
      };

      // Construct and dispatch JSON payload over socket
      const serializedPayload = JSON.stringify(payload);
      ws.send(serializedPayload);

      recordTelemetry('OUT', `Dispatched STATUS_UPDATE for Task #${taskId} -> ${newStatus}`, payload);

      // In case of high latency or to provide snappy feedback if using an echo server with latency,
      // the ws.onmessage handles the definitive state update upon receiving the echoed broadcast!
    },
    [recordTelemetry]
  );

  /**
   * Manual dispatch of new ticket
   */
  const handleCreateTicket = useCallback(
    (newTicket) => {
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const payload = {
        type: 'NEW_TICKET',
        ticket: newTicket,
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(payload));
      recordTelemetry('OUT', `Broadcasted new ticket ${newTicket.ticketNumber} to stream`, payload);
    },
    [recordTelemetry]
  );

  /**
   * Dev & QA Evaluation Triggers
   */
  const handleSimulateRemotePeerUpdate = useCallback(() => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    setIsSimulatingPeer(true);

    // Pick a pending or in-progress task to mutate
    const eligibleTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    const targetTask = eligibleTasks.length > 0 ? eligibleTasks[0] : tasks[0];

    if (!targetTask) {
      setIsSimulatingPeer(false);
      return;
    }

    const nextStatus = targetTask.status === 'PENDING' ? 'APPROVED' : 'REJECTED';

    const simulatedPeerPayload = {
      type: 'STATUS_UPDATE',
      taskId: targetTask.id,
      newStatus: nextStatus,
      timestamp: new Date().toISOString(),
      user: 'Compliance Lead (Remote Peer #842)',
    };

    // Broadcast over WebSocket so ws.onmessage will receive it and mutate React state (AC4)
    ws.send(JSON.stringify(simulatedPeerPayload));

    recordTelemetry(
      'OUT',
      `Simulated peer broadcast: Remote Lead approved Task #${targetTask.id}`,
      simulatedPeerPayload
    );

    setTimeout(() => setIsSimulatingPeer(false), 600);
  }, [tasks, recordTelemetry]);

  const handleSimulateRemoteNewTicket = useCallback(() => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const sampleCategories = ['Identity Compliance', 'Sanctions / AML', 'Treasury Ops', 'SecOps Audit'];
    const samplePriorities = ['HIGH', 'CRITICAL', 'MEDIUM'];
    const randomCategory = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
    const randomPriority = samplePriorities[Math.floor(Math.random() * samplePriorities.length)];
    const randomId = Date.now();

    const remoteTicket = {
      id: randomId,
      ticketNumber: `TCK-${Math.floor(2000 + Math.random() * 8000)}`,
      title: `Automated Rule Trigger: ${randomCategory} Ingestion Match`,
      description: 'Incoming live webhook alert flagged by operational rules engine. Streamed directly to operations room.',
      category: randomCategory,
      priority: randomPriority,
      status: 'PENDING',
      assignee: 'Automated Ingest Worker',
      riskScore: `${(Math.random() * 0.9).toFixed(2)} - Monitored`,
      submittedAt: 'Just now',
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          user: 'Ingestion Pipeline (Remote Stream)',
        },
      ],
    };

    const payload = {
      type: 'NEW_TICKET',
      ticket: remoteTicket,
      timestamp: new Date().toISOString(),
    };

    ws.send(JSON.stringify(payload));
  }, []);

  const handleTriggerSocketDrop = useCallback(() => {
    isIntentionalCloseRef.current = false;
    if (socketRef.current) {
      socketRef.current.close(4000, 'Simulated network failure for Unhappy Path evaluation');
    }
  }, []);

  const handleManualDisconnect = useCallback(() => {
    isIntentionalCloseRef.current = true;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (socketRef.current) {
      socketRef.current.close(1000, 'User initiated disconnect');
    }
    setConnectionState('CLOSED');
  }, []);

  const handleManualReconnect = useCallback(() => {
    retryCountRef.current = 0;
    setRetryAttempt(0);
    setNextRetrySeconds(0);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    initiateSocketConnection();
  }, [initiateSocketConnection]);

  const handleResetTasks = useCallback(() => {
    setTasks(INITIAL_TASKS.map(sanitizeTicket));
    recordTelemetry('ANALYTICS', 'Reset verification ticket queue to initial seed state', {});
  }, [recordTelemetry]);

  // Filter tasks based on search and category
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isSocketOpen = connectionState === 'OPEN';

  return (
    <main className="workflow-engine-main" role="main">
      {/* Dev Simulation & QA Toolbar */}
      <DevSimulationBar
        onSimulateRemotePeerUpdate={handleSimulateRemotePeerUpdate}
        onSimulateRemoteNewTicket={handleSimulateRemoteNewTicket}
        onTriggerSocketDrop={handleTriggerSocketDrop}
        isSocketOpen={isSocketOpen}
        isSimulatingPeer={isSimulatingPeer}
        isSlowNetwork={isSlowNetwork}
        onToggleSlowNetwork={() => setIsSlowNetwork(!isSlowNetwork)}
      />

      {/* Real-time Connection Status & Latency Bar */}
      <ConnectionStatusBar
        connectionState={connectionState}
        endpoint={endpoint}
        onChangeEndpoint={(newEp) => {
          setEndpoint(newEp);
          setRetryAttempt(0);
          setNextRetrySeconds(0);
        }}
        retryAttempt={retryAttempt}
        nextRetrySeconds={nextRetrySeconds}
        latencyMs={latencyMs}
        onReconnect={handleManualReconnect}
        onDisconnect={handleManualDisconnect}
        isSlowConnection={isSlowNetwork}
      />

      {/* Control Bar: Search, Category Filter, Create Ticket, Reset */}
      <section className="engine-controls-bar" aria-label="Workflow Filtering and Quick Actions">
        <div className="controls-left">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, title, analyst..."
              className="search-input"
              aria-label="Filter verification tickets by search keywords"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                aria-label="Clear search input"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" aria-hidden="true" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter tickets by operational category"
            >
              <option value="ALL">All Categories ({tasks.length})</option>
              <option value="Identity Compliance">Identity Compliance</option>
              <option value="Sanctions / AML">Sanctions / AML</option>
              <option value="Treasury Ops">Treasury Ops</option>
              <option value="SecOps Audit">SecOps Audit</option>
              <option value="Fraud Prevention">Fraud Prevention</option>
            </select>
          </div>
        </div>

        <div className="controls-right">
          <button
            type="button"
            onClick={handleResetTasks}
            className="btn-control-secondary"
            aria-label="Reset queue to demo seed data"
            title="Reload initial ticket dataset"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!isSocketOpen}
            className="btn-control-primary"
            aria-label="Create and broadcast new verification ticket"
          >
            <PlusCircle size={15} aria-hidden="true" />
            <span>Queue New Ticket</span>
          </button>
        </div>
      </section>

      {/* Main Kanban Board Display */}
      <KanbanBoard
        tasks={filteredTasks}
        onStatusChange={handleStatusChange}
        isSocketOpen={isSocketOpen}
        isMutating={isMutating}
        onResetTasks={handleResetTasks}
      />

      {/* Real-time WebSocket Telemetry & Frames Drawer */}
      <TelemetryFeed logs={telemetryLogs} onClearLogs={() => setTelemetryLogs([])} />

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
        isSocketOpen={isSocketOpen}
      />
    </main>
  );
}
