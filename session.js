// Inactivity is measured from wall-clock time, including a suspended iPad tab.
// This browser session gate is separate from server authentication.
window.createDrogsSession = (key, onSignOut) => {
  const activityKey = `${key}:activity`, timeout = 30 * 60 * 1000;
  let timer;
  const clear = () => {
    clearTimeout(timer);
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(activityKey);
  };
  const active = () => {
    if (sessionStorage.getItem(key) !== 'yes') return false;
    const last = Number(sessionStorage.getItem(activityKey));
    if (!last || Date.now() - last >= timeout) { clear(); return false; }
    return true;
  };
  const signOut = () => { clear(); onSignOut(); };
  const check = () => {
    const wasSignedIn = sessionStorage.getItem(key) === 'yes';
    if (!active()) { if (wasSignedIn) onSignOut(); return; }
    clearTimeout(timer);
    timer = setTimeout(check, Math.max(1, timeout - (Date.now() - Number(sessionStorage.getItem(activityKey)))));
  };
  const touch = () => {
    const wasSignedIn = sessionStorage.getItem(key) === 'yes';
    if (!active()) { if (wasSignedIn) onSignOut(); return; }
    sessionStorage.setItem(activityKey, String(Date.now()));
    check();
  };
  const start = () => {
    sessionStorage.setItem(key, 'yes');
    sessionStorage.setItem(activityKey, String(Date.now()));
    check();
  };
  ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'].forEach(type =>
    document.addEventListener(type, touch, {passive: true, capture: true}));
  // Restoring/focusing a tab is not activity: check expiry before accepting input.
  ['pageshow', 'focus'].forEach(type => window.addEventListener(type, check));
  document.addEventListener('visibilitychange', check);
  check();
  return {active, start, signOut};
};
