/**
 * Security utilities: Sanitization and payload validation
 * Protects against XSS injection and malformed WebSocket messages
 */

const ALLOWED_STATUSES = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED'];
const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Strips HTML tags and potential script injections from user or stream input.
 * React escapes text by default, but this adds an extra defense-in-depth layer.
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, (tag) => ({ '<': '&lt;', '>': '&gt;' }[tag] || ''))
    .trim();
}

/**
 * Validates incoming WebSocket payload structure
 */
export function validateSocketPayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Payload must be a valid JSON object' };
  }

  if (!data.type || typeof data.type !== 'string') {
    return { valid: false, reason: 'Missing or invalid "type" field' };
  }

  if (data.type === 'STATUS_UPDATE') {
    if (data.taskId === undefined || data.taskId === null) {
      return { valid: false, reason: 'Missing taskId in STATUS_UPDATE payload' };
    }
    if (!ALLOWED_STATUSES.includes(data.newStatus)) {
      return {
        valid: false,
        reason: `Invalid status: "${data.newStatus}". Allowed: ${ALLOWED_STATUSES.join(', ')}`,
      };
    }
  }

  if (data.type === 'NEW_TICKET') {
    if (!data.ticket || !data.ticket.title) {
      return { valid: false, reason: 'Missing ticket object or title in NEW_TICKET' };
    }
  }

  return { valid: true };
}

/**
 * Clean and normalize ticket object
 */
export function sanitizeTicket(ticket) {
  return {
    ...ticket,
    id: typeof ticket.id === 'number' ? ticket.id : Date.now(),
    ticketNumber: sanitizeString(ticket.ticketNumber || `TCK-${Math.floor(1000 + Math.random() * 9000)}`),
    title: sanitizeString(ticket.title || 'Untitled Ticket'),
    description: sanitizeString(ticket.description || ''),
    category: sanitizeString(ticket.category || 'General Operations'),
    priority: ALLOWED_PRIORITIES.includes(ticket.priority) ? ticket.priority : 'MEDIUM',
    status: ALLOWED_STATUSES.includes(ticket.status) ? ticket.status : 'PENDING',
    assignee: sanitizeString(ticket.assignee || 'Unassigned'),
    riskScore: sanitizeString(ticket.riskScore || '0.00 - Standard'),
    submittedAt: sanitizeString(ticket.submittedAt || 'Just now'),
    updatedAt: ticket.updatedAt || new Date().toISOString(),
    history: Array.isArray(ticket.history) ? ticket.history : [],
  };
}
