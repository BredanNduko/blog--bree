import { getDb } from '../../../lib/database';

export default async function handler(req, res) {
  await getDb();
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}