'use client';

/**
 * DETERMINISTIC DEVICE FINGERPRINTING
 * Analyzes immutable hardware traits to generate a consistent ID
 * that persists across Incognito and browser restarts.
 */

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';

  // 1. Collect hardware/software signals
  const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const cpu = navigator.hardwareConcurrency || 'unknown';
  const lang = navigator.language || 'en-US';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // 2. Build a raw signature string
  const rawSignal = `${screenRes}|${cpu}|${lang}|${tz}`;
  
  // 3. Simple Hash Protocol (to produce a consistent short token)
  let hash = 0;
  for (let i = 0; i < rawSignal.length; i++) {
    const char = rawSignal.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const absHash = Math.abs(hash).toString(36).toUpperCase();
  const deviceId = `DEV-${absHash.substring(0, 4)}-${absHash.substring(4, 8)}`;
  
  return deviceId;
}

export function isAttackPatternDetected(): boolean {
    const attempts = parseInt(sessionStorage.getItem('ams_malicious_attempts') || '0');
    return attempts >= 5;
}

export function recordMaliciousAttempt() {
    const attempts = parseInt(sessionStorage.getItem('ams_malicious_attempts') || '0');
    sessionStorage.setItem('ams_malicious_attempts', (attempts + 1).toString());
}
