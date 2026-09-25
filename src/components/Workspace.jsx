"use client";
import { useEffect, useRef, useState } from 'react';

export default function Workspace({ kind }) {
  const host = useRef(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let dispose;
    let disposePrivacy;
    async function start() {
      try {
        const [{getDirectory}, runtime, {installPrivacyControls}] = await Promise.all([
          import('../runtime/directory'),
          kind === 'admin' ? import('../runtime/admin') : import('../runtime/portal'),
          import('../runtime/privacy'),
        ]);
        if (cancelled) return;
        disposePrivacy = installPrivacyControls();
        dispose = (kind === 'admin' ? runtime.mountAdmin : runtime.mountPortal)(host.current, getDirectory());
        setReady(true);
      } catch (error) {
        if (!cancelled) { console.error('Unable to open D.R.O.G.S', error); setError(true); }
      }
    }
    start();
    return () => { cancelled = true; dispose?.(); disposePrivacy?.(); };
  }, [kind]);
  return <>
    {!ready && <section className="workspace-loading" role="status">
      <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/mitre-transparent.png`} alt="" width="72" height="86" />
      <h1>D.R.O.G.S</h1>
      <p>{error ? 'This page could not be loaded. Please try again.' : 'Opening your workspace…'}</p>
      {error && <button onClick={() => window.location.reload()}>Try again</button>}
    </section>}
    <main id={kind === 'admin' ? 'admin-app' : 'app'} ref={host} />
  </>;
}
