/**
 * Local Dedicated Operations Room WebSocket Broadcast Server
 * Port: 8080 (ws://localhost:8080)
 *
 * Implements real multi-client WebSocket broadcasting for the Operations Room
 */
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.WS_PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`[WS Server] Operations Room Broadcast Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS Server] New operator connected from ${clientIp}. Total peers: ${wss.clients.size}`);

  // Send initial welcome & handshake confirmation
  ws.send(
    JSON.stringify({
      type: 'SERVER_HELLO',
      message: 'Connected to Local Dedicated Operations Room WS Server',
      peersCount: wss.clients.size,
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());

      // Ping check
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PING', timestamp: parsed.timestamp }));
        return;
      }

      console.log(`[WS Server] Received and broadcasting event: ${parsed.type}`, parsed);

      // Broadcast to ALL connected clients (including sender for echo parity)
      const broadcastPayload = JSON.stringify(parsed);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastPayload);
        }
      }
    } catch {
      // Non-JSON plain text echo
      const text = message.toString();
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(text);
        }
      }
    }
  });

  ws.on('close', () => {
    console.log(`[WS Server] Operator disconnected. Active peers: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS Server Error]', err);
  });
});
