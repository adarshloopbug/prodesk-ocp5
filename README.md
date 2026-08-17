# Enterprise WebSocket-Driven Workflow Engine

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![WebSocket](https://img.shields.io/badge/WebSocket-Live_Stream-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)

An enterprise-grade, stateful React 18 operations dashboard interfacing directly with a live WebSocket broadcast stream to manage verification workflows, live queues, and operational matrices in real time.

---

## 🏛️ Architectural Overview & The "Happy Path"

- **Persistent WSS Operations Stream**: On dashboard load, the client instantly establishes a persistent connection to the active operations stream (`ws://localhost:8080` or `wss://echo.websocket.events`).
- **Live Verification Matrix**: Renders a 3-column corporate Kanban board (*Pending Verification*, *Under Review / In Progress*, *Completed & Resolved*).
- **Instant Action Dispatch**: Clicking **Approve**, **Reject**, or **Review** constructs a typed JSON payload (`{ type: 'STATUS_UPDATE', taskId, newStatus, ... }`) and transmits it across the active WebSocket via `ws.send()`.
- **Reactive State Updates (Zero Page Refresh)**: The attached `ws.onmessage` event listener parses incoming broadcasts and mutates the local React state via functional updates (`setTasks(prev => prev.map(...))`), safely eliminating stale closures.

---

## 🛡️ The Unhappy Path & Network Resilience

- **Optimistic UI Lockdown**: If the WebSocket disconnects (`ws.readyState !== WebSocket.OPEN`), all mutation buttons are safely disabled with an accessible tooltip (*"Offline - Reconnecting..."*) and an offline warning card banner.
- **Exponential Backoff Reconnection**: Helper automatically re-establishes dropped connections using an exponential backoff strategy (1s, 2s, 4s, 8s, 16s, 32s) with an active countdown display.
- **Celebratory Empty States**: When all pending items in a column/queue are processed, renders a celebratory illustration (*"All caught up!"*).
- **Handshake & Latency Loading**: Visual loading indicator and live RTT latency meter.

---

## 🔒 Non-Functional Requirements (NFRs)

- **Accessibility (a11y)**: Semantic HTML (`<article>`, `<header>`, `<main>`, `<section>`, `<ul>`, `<li>`), strict ARIA labels (`role="region"`, `role="status"`, `aria-live="polite"`), and high-contrast WCAG AAA compliance.
- **Telemetry Simulation**: Emits `[Analytics] Task status mutated via WebSocket` to `console.log` upon receiving/processing payloads and feeds an interactive real-time frame inspector drawer.
- **Security & XSS Defense**: Strict schema validation (`validateSocketPayload`) and string sanitization (`sanitizeString`) on all stream data.
- **Monochromatic Corporate Aesthetics**: Dark/light theme support, crisp typography (Inter & JetBrains Mono), badges, and consistent padding.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run WebSocket Server & Client
In terminal 1 (WebSocket Broadcast Server):
```bash
npm run server
```

In terminal 2 (Vite React Client):
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### 3. Build & Lint
```bash
npm run lint
npm run build
```

---

## 🧪 Built-in Evaluation & Simulation Toolbar

The top toolbar provides one-click triggers to verify all Acceptance Criteria:
- **Simulate Peer User Update (AC4)**: Dispatches a remote peer mutation over WebSocket.
- **Simulate Incoming Ticket**: Ingests an incoming compliance alert.
- **Simulate Slow 3G**: Toggles simulated network latency.
- **Test Unhappy Path (Kill Socket)**: Disconnects the socket to evaluate button lockdown and exponential backoff retry.
- **Endpoint Switcher**: Switch between `ws://localhost:8080` (local broadcast) and `wss://echo.websocket.events` (public echo).
