export const SCOPES = Object.freeze([
  'directory:read', 'profiles:read', 'contacts:read', 'applications:read',
  'application-answers:read', 'payments:read', 'payment-proofs:read',
  'reviews:read', 'review-notes:read',
]);

export async function hashKey(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

const fields = (value, names) => Object.fromEntries(names.filter(name => value?.[name] !== undefined).map(name => [name, value[name]]));
const basic = person => ({ id: person.id, role: person.role, ...fields(person.data, ['code', 'name', 'title', 'organization', 'denomination', 'firstLoveGroup', 'region', 'image', 'denominationLogo']) });
const has = (key, scope) => key.scopes.includes(scope);
const permits = (key, person) => (!key.roles.length || key.roles.includes(person.role)) && (!key.organizations.length || key.organizations.includes(person.data.organization));
class ApiError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
const requireScope = (key, scope) => { if (!has(key, scope)) throw new ApiError(403, 'insufficient_scope'); };

export function createHandler(store, { allowedOrigin = 'https://jkgbafa.github.io', now = () => Date.now() } = {}) {
  return async request => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Request-Id': requestId, 'Vary': 'Origin' };
    if (origin === allowedOrigin) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (status, payload) => new Response(JSON.stringify(payload), { status, headers });
    let key;
    let path = '';
    let responseStatus = 500;
    try {
      if (origin && origin !== allowedOrigin) throw new ApiError(403, 'origin_not_allowed');
      if (request.method === 'OPTIONS') {
        headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
        return new Response(null, { status: 204, headers });
      }
      const auth = request.headers.get('authorization') || '';
      if (!/^Bearer drg_[A-Za-z0-9_-]{43}$/.test(auth)) throw new ApiError(401, 'invalid_api_key');
      key = await store.findKey(await hashKey(auth.slice(7)));
      if (!key || key.revoked_at || !Array.isArray(key.scopes) || !Array.isArray(key.roles) || !Array.isArray(key.organizations)
        || !key.expires_at || Date.parse(key.expires_at) <= now() || !Number.isFinite(Date.parse(key.expires_at))) {
        key = undefined;
        throw new ApiError(401, 'invalid_api_key');
      }
      if (!await store.consumeQuota(key.id)) throw new ApiError(429, 'rate_limit_exceeded');
      if (request.method !== 'GET') throw new ApiError(405, 'read_only_api');
      const url = new URL(request.url);
      path = url.pathname.replace(/^\/functions\/v1\/drogs-api/, '').replace(/\/$/, '');
      if (path === '/v1/scopes') {
        responseStatus = 200;
        return reply(200, { scopes: key.scopes, roles: key.roles, organizations: key.organizations, expiresAt: key.expires_at });
      }
      if (path === '/v1/people') {
        requireScope(key, 'directory:read');
        const allowed = new Set(['role', 'organization', 'denomination', 'country', 'q', 'limit', 'offset']);
        if ([...url.searchParams.keys()].some(name => !allowed.has(name))) throw new ApiError(400, 'invalid_query');
        const limit = Number(url.searchParams.get('limit') || 50), offset = Number(url.searchParams.get('offset') || 0);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 100000) throw new ApiError(400, 'invalid_pagination');
        const filters = Object.fromEntries(['role', 'organization', 'denomination', 'country', 'q'].map(name => [name, url.searchParams.get(name)]));
        if (Object.values(filters).some(value => value && (value.length > 150 || /[\r\n]/.test(value)))) throw new ApiError(400, 'invalid_filter');
        if (filters.role && !['bishop', 'pastor'].includes(filters.role)) throw new ApiError(400, 'invalid_role');
        if (filters.organization && !['UD-OLGC', 'UO-FLC190'].includes(filters.organization)) throw new ApiError(400, 'invalid_organization');
        // The store enforces key restrictions before pagination. Projection is
        // repeated here so private columns can never escape via directory reads.
        const people = await store.listPeople(filters, key, limit, offset);
        if (people.some(person => !permits(key, person))) throw new ApiError(500, 'scope_boundary_error');
        responseStatus = 200;
        return reply(200, { data: people.map(basic), limit, offset, nextOffset: people.length === limit ? offset + limit : null });
      }
      const match = path.match(/^\/v1\/people\/([BP][1-9]\d*)(?:\/(profile|contacts|application|payment|payment-proof|review))?$/);
      if (!match) throw new ApiError(404, 'not_found');
      const [, id, resource = 'directory'] = match;
      const scope = { directory: 'directory:read', profile: 'profiles:read', contacts: 'contacts:read', application: 'applications:read', payment: 'payments:read', 'payment-proof': 'payment-proofs:read', review: 'reviews:read' }[resource];
      requireScope(key, scope);
      const person = await store.getPerson(id);
      if (!person || !permits(key, person)) throw new ApiError(404, 'not_found');
      let data;
      if (resource === 'directory') data = basic(person);
      else if (resource === 'profile') data = { id, ...fields(person.data, ['name', 'title', 'age', 'gender', 'profession', 'occupation', 'qualification', 'maritalStatus', 'region', 'organization', 'denomination', 'firstLoveGroup', 'yearAppointed', 'yearConsecrated', 'yearOrdained']) };
      else if (resource === 'contacts') data = { id, ...fields(person.data, ['mobile', 'whatsapp', 'email', 'address']) };
      else {
        const record = await store.getRecord(id);
        if (!record) throw new ApiError(404, 'record_not_submitted');
        if (resource === 'application') {
          data = { id, ...fields(record, ['status', 'submittedAt', 'updatedAt']) };
          if (has(key, 'application-answers:read')) data.responses = record.responses || {};
        } else if (resource === 'payment') data = { id, ...fields(record, ['paid', 'amount', 'currency', 'paymentMethod', 'paidAt', 'receipt']) };
        else if (resource === 'review') {
          data = { id, ...fields(record, ['review', 'updatedAt']) };
          if (has(key, 'review-notes:read')) data.reviewNote = record.reviewNote || '';
        } else {
          if (!record.paymentProofPath) throw new ApiError(404, 'payment_proof_not_available');
          data = { id, url: await store.signProof(record.paymentProofPath, 60), expiresIn: 60 };
        }
      }
      responseStatus = 200;
      return reply(200, { data });
    } catch (error) {
      responseStatus = error instanceof ApiError ? error.status : 500;
      return reply(responseStatus, { error: error instanceof ApiError ? error.code : 'internal_error', requestId });
    } finally {
      // Audit paths and status only: never tokens, answers, proof contents, or PII.
      if (key) { try { await store.audit({ key_id: key.id, request_id: requestId, method: request.method, path, status: responseStatus }); } catch { /* Never log request secrets. */ } }
    }
  };
}
