export function createSupabaseStore(url, serverKey, fetcher = fetch) {
  if (!url || !serverKey) throw new Error('Server configuration missing');
  const base = url.replace(/\/$/, '');
  const headers = { apikey: serverKey, 'Content-Type': 'application/json' };
  // Legacy service-role JWTs need Authorization too. New sb_secret keys are
  // gateway credentials and must not be passed as JWT bearer tokens.
  if (!serverKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${serverKey}`;
  async function rest(path, options = {}) {
    const response = await fetcher(`${base}/rest/v1/${path}`, { ...options, headers: { ...headers, ...options.headers } });
    if (!response.ok) throw new Error('Database request failed');
    return response.status === 204 ? null : response.json();
  }
  const keyBounds = (params, key) => {
    if (key.roles.length) params.append('role', `in.(${key.roles.map(x => '"' + x + '"').join(',')})`);
    if (key.organizations.length) params.append('data->>organization', `in.(${key.organizations.map(x => '"' + x + '"').join(',')})`);
  };
  return {
    async findKey(hash) { return (await rest('drogs_api_keys?' + new URLSearchParams({ key_hash: `eq.${hash}`, select: 'id,scopes,roles,organizations,expires_at,revoked_at', limit: '1' })))[0]; },
    async consumeQuota(id) { return await rest('rpc/drogs_consume_api_quota', { method: 'POST', body: JSON.stringify({ target_key: id }) }); },
    async listPeople(filters, key, limit, offset) {
      const params = new URLSearchParams({ select: 'id,role,data', limit: String(limit), offset: String(offset), order: 'id.asc' });
      keyBounds(params, key);
      for (const [name, column] of [['role', 'role'], ['organization', 'data->>organization'], ['denomination', 'data->>denomination'], ['country', 'data->>region']]) {
        if (filters[name]) params.append(column, `eq.${filters[name]}`);
      }
      if (filters.q) params.append('data->>name', `ilike.*${filters.q.replace(/[%*_\\]/g, '')}*`);
      return rest('drogs_people?' + params);
    },
    async getPerson(id) { return (await rest('drogs_people?' + new URLSearchParams({ id: `eq.${id}`, select: 'id,role,data', limit: '1' })))[0]; },
    async getRecord(id) { return (await rest('drogs_records?' + new URLSearchParams({ person_id: `eq.${id}`, select: 'data', limit: '1' })))[0]?.data; },
    async signProof(path, expiresIn) {
      const response = await fetcher(`${base}/storage/v1/object/sign/payment-proofs/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers, body: JSON.stringify({ expiresIn }) });
      if (!response.ok) throw new Error('Proof unavailable');
      const { signedURL } = await response.json();
      if (!signedURL?.startsWith('/object/sign/')) throw new Error('Invalid signed URL');
      return `${base}/storage/v1${signedURL}`;
    },
    async audit(entry) { await rest('drogs_api_audit', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(entry) }); },
  };
}
