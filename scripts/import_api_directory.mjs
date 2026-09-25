import { readFile } from 'node:fs/promises';

const url = process.env.DROGS_SUPABASE_URL;
const secret = process.env.DROGS_SUPABASE_SERVER_KEY;
if (!url || !secret) throw new Error('Set server credentials locally before importing. Never add them to the website.');
const headers = { apikey: secret, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' };
if (!secret.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + secret;
async function upload(table, rows) {
  const response = await fetch(url.replace(/\/$/, '') + '/rest/v1/' + table, { method: 'POST', headers, body: JSON.stringify(rows) });
  if (!response.ok) throw new Error(`Import into ${table} failed (${response.status}). No credentials logged.`);
}
for (const [collection, role, prefix] of [['bishops','bishop','B'],['pastors','pastor','P']]) {
  const text = await readFile(new URL('../data/' + collection + '.js', import.meta.url), 'utf8');
  const people = JSON.parse(text.slice(text.indexOf('=') + 1).trim().replace(/;$/, ''));
  for (let i = 0; i < people.length; i += 200) {
    await upload('drogs_people', people.slice(i, i + 200).map(data => ({ id: prefix + data.code, role, data })));
  }
  console.log(`Imported ${people.length} ${collection}`);
}
if (process.env.DROGS_KEY_RECORD_FILE) {
  const record = JSON.parse(await readFile(process.env.DROGS_KEY_RECORD_FILE, 'utf8'));
  if ('token' in record || !/^[a-f0-9]{64}$/.test(record.key_hash || '')) throw new Error('Use the hashed activation record, not the secret key file.');
  await upload('drogs_api_keys', [record]);
  console.log('Scoped API key activated.');
}
