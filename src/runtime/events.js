// Every mounted Next page owns its listeners, timers and session lifecycle.
export function createEventScope() {
  const listeners = [];
  return {
    listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      listeners.push(() => target.removeEventListener(type, handler, options));
    },
    dispose() { listeners.splice(0).forEach(remove => remove()); },
  };
}
