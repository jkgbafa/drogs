import { findRecord } from './person-records.js';

export const submissionKey = person => `${person.type}:${person.code}`;
export function bulkApprovalBlock(record = {}) {
 if (record.status !== 'submitted') return 'Form not submitted';
 if (record.responses?.intention === 'I wish to resign') return 'Resignation request';
 if (record.review === 'Approved') return 'Already approved';
 if (!record.paid) return 'Commitment outstanding';
 if (record.responses?.intention === 'I need to discuss my position' || record.responses?.commitment === 'I need to discuss this before recommitting') return 'Individual review needed';
 if (!['Awaiting submission','Ready for review','In review',undefined,null,''].includes(record.review)) return 'Individual review needed';
 return '';
}

// Prepare the entire batch before the caller makes a single storage write.
export function prepareBulkApproval(records, people, { timestamp, batchId }) {
 if (!people.length) throw new Error('Select at least one submission.');
 const updates = {}, seen = new Set();
 for (const person of people) {
  const key = submissionKey(person);
  if (seen.has(key)) throw new Error('The selection contains a duplicate. Please select again.');
  seen.add(key);
  const fresh = findRecord(records, person, person.type);
  if (JSON.stringify(fresh) !== JSON.stringify(person.r) || bulkApprovalBlock(fresh)) {
   throw new Error('A selected submission has changed or needs individual review. Close this window and select the submissions again. No approvals were saved.');
  }
  updates[key] = { ...fresh, review: 'Approved', role: person.type, updatedAt: timestamp, reviewedAt: timestamp, reviewMethod: 'bulk', reviewBatchId: batchId,
   reviewHistory: [...(fresh.reviewHistory || []), { from: fresh.review || null, to: 'Approved', at: timestamp, method: 'bulk', batchId }] };
 }
 return { ...records, ...updates };
}
