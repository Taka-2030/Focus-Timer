const DEBUG_SESSION_KEY = 'focus-production-debug';

export function getProductionDebugMode() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get('debug');

  if (debugParam === 'true') {
    writeDebugSession(true);
    return true;
  }

  if (debugParam === 'false') {
    writeDebugSession(false);
    return false;
  }

  return readDebugSession();
}

function readDebugSession() {
  try {
    return window.sessionStorage?.getItem(DEBUG_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeDebugSession(enabled) {
  try {
    if (enabled) {
      window.sessionStorage?.setItem(DEBUG_SESSION_KEY, 'true');
    } else {
      window.sessionStorage?.removeItem(DEBUG_SESSION_KEY);
    }
  } catch {
    // Debug mode must never break the app if sessionStorage is unavailable.
  }
}
