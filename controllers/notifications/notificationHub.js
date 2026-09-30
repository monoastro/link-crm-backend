// src/modules/notifications/notificationHub.js
const clients = new Map(); // role -> Set<res>

export function addClient(role, res) {
  if (!clients.has(role)) clients.set(role, new Set());
  clients.get(role).add(res);
}

export function removeClient(role, res) {
  clients.get(role)?.delete(res);
}

export function publishToRole(role, notification) {
  const set = clients.get(role);
  console.log(`Publishing to role ${role}, connected clients: ${set?.size ?? 0}`, [...clients.keys()]);
  const payload = `id: ${notification.id}\nevent: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const res of clients.get(role) ?? []) res.write(payload);
}
