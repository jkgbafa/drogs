import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SCOPES } from '../supabase/functions/drogs-api/handler.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const index = value.indexOf('=');
  if (!value.startsWith('--') || index < 0) throw new Error('Use --name=value arguments');
  return [value.slice(2, index), value.slice(index + 1)];
}));
const list = value => value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
const scopes = list(args.scopes || 'directory:read');
const roles = list(args.roles), organizations = list(args.organizations);
if (!scopes.length || scopes.some(scope => !SCOPES.includes(scope))) throw new Error('Unknown or empty scope');
if (roles.some(role => !['bishop','pastor'].includes(role))) throw new Error('Invalid role');
if (organizations.some(org => !['UD-OLGC','UO-FLC190'].includes(org))) throw new Error('Invalid organization');
const days = Number(args.days || 90);
if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Expiry must be 1–365 days');
const label = args.label || 'External directory reader';
const token = 'drg_' + randomBytes(32).toString('base64url');
const record = { id: randomUUID(), label, key_hash: createHash('sha256').update(token).digest('hex'), scopes, roles, organizations, expires_at: new Date(Date.now() + days * 86400000).toISOString() };
const directory = resolve('.private');
await mkdir(directory, { recursive: true, mode: 0o700 });
const stem = resolve(directory, args.output || 'directory-key');
if (!stem.startsWith(directory + '/')) throw new Error('Key output must remain inside .private');
await writeFile(stem + '.json', JSON.stringify({ status: 'Prepared; activate by importing the key record into the hosted API database.', token, record }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
await writeFile(stem + '-record.json', JSON.stringify(record, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ id: record.id, scopes, expiresAt: record.expires_at, secretFile: stem + '.json', activationRecord: stem + '-record.json' }));
