export function paymentUnlocked(record = {}) {
  return record.status === 'submitted' && record.review === 'Approved' && record.responses?.intention !== 'I wish to resign';
}
