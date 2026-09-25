(()=>{
  const shield=document.createElement('div');
  shield.className='privacy-shield';
  shield.innerHTML='<img src="'+(location.pathname.includes('/admin/')?'../':'')+'assets/mitre-transparent.png" alt=""><strong>D.R.O.G.S</strong><span>Private D.R.O.G.S record</span>';
  document.body.appendChild(shield);
  const hide=()=>document.body.classList.add('privacy-hidden');
  const show=()=>document.body.classList.remove('privacy-hidden');
  document.addEventListener('visibilitychange',()=>document.hidden?hide():show());
  window.addEventListener('blur',hide);
  window.addEventListener('focus',()=>setTimeout(show,250));
  window.addEventListener('pagehide',hide);
  window.addEventListener('pageshow',show);
  ['contextmenu','dragstart','copy','cut'].forEach(type=>document.addEventListener(type,event=>event.preventDefault(),true));
  document.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    const captureShortcut=(event.metaKey&&event.shiftKey&&['3','4','5'].includes(key))||key==='printscreen';
    const printShortcut=(event.metaKey||event.ctrlKey)&&key==='p';
    if(captureShortcut||printShortcut){event.preventDefault();event.stopImmediatePropagation();hide();setTimeout(show,900)}
  },true);
  document.documentElement.dataset.captureProtection='active';
})();
