(()=>{
  document.body.classList.remove('privacy-hidden');
  ['contextmenu','dragstart','copy','cut'].forEach(type=>document.addEventListener(type,event=>event.preventDefault(),true));
  document.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    const captureShortcut=(event.metaKey&&event.shiftKey&&['3','4','5'].includes(key))||key==='printscreen';
    const printShortcut=(event.metaKey||event.ctrlKey)&&key==='p';
    if(captureShortcut||printShortcut){event.preventDefault();event.stopImmediatePropagation()}
  },true);
  document.documentElement.dataset.captureProtection='active';
})();
