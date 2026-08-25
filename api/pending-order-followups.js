import { sendOwnerPendingEmail } from '../server/email.js';
import { groupPendingFollowUps } from '../server/followup.js';
import { getOrder, getPendingFollowUpOrders, markFollowUpOrders } from '../server/supabase.js';

const FOLLOW_UP_DELAY_MS = 30 * 60 * 1000;

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ success: false });
  }

  const authHeader = request.headers?.authorization || '';
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ success: false });
  }

  const createdBefore = new Date(Date.now() - FOLLOW_UP_DELAY_MS).toISOString();
  let candidates;
  try {
    candidates = await getPendingFollowUpOrders(createdBefore);
  } catch (error) {
    console.error('Pending follow-up query failed', { message: error.message });
    return response.status(503).json({ success: false });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const groups = groupPendingFollowUps(candidates);
  for (const group of groups) {
    try {
      const order = await getOrder(group.order.reference);
      if (!order || !['unpaid', 'failed'].includes(order.payment_status) || order.followup_email_sent_at) {
        skipped += 1;
        continue;
      }
      await sendOwnerPendingEmail(order);
      await markFollowUpOrders(group.references);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('Pending order follow-up email failed', { reference: group.order.reference, message: error.message });
    }
  }

  response.setHeader('Cache-Control', 'no-store');
  return response.status(200).json({
    success: true,
    checked: candidates.length,
    customerGroups: groups.length,
    consolidated: candidates.length - groups.length,
    sent,
    skipped,
    failed,
  });
}
