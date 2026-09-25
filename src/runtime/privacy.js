import { createEventScope } from './events';
export function installPrivacyControls(){
  const events=createEventScope();
  document.body.classList.remove('privacy-hidden');
  ['contextmenu','dragstart','copy','cut'].forEach(type=>events.listen(document,type,event=>event.preventDefault(),true));
  events.listen(document,'keydown',event=>{
    const key=event.key.toLowerCase();
    const captureShortcut=(event.metaKey&&event.shiftKey&&['3','4','5'].includes(key))||key==='printscreen';
    const printShortcut=(event.metaKey||event.ctrlKey)&&key==='p';
    if(captureShortcut||printShortcut){event.preventDefault();event.stopImmediatePropagation()}
  },true);
  // These browser gestures are deterrents, not OS screenshot protection.
  document.documentElement.dataset.captureProtection='limited';
  return ()=>{events.dispose();delete document.documentElement.dataset.captureProtection};
}
