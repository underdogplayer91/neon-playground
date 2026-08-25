const customerKey = (order) => {
  const phone = String(order.customer_phone || '').replace(/\D/g, '');
  if (phone) return `phone:${phone.startsWith('0') ? `6${phone}` : phone}`;
  const email = String(order.customer_email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  return `reference:${order.reference}`;
};

export function groupPendingFollowUps(orders) {
  const groups = new Map();
  for (const order of orders) {
    const key = customerKey(order);
    const existing = groups.get(key);
    if (existing) {
      existing.references.push(order.reference);
      continue;
    }
    groups.set(key, { order, references: [order.reference] });
  }
  return [...groups.values()];
}
