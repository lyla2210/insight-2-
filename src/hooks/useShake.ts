import { useCallback, useEffect, useRef, useState } from 'react';

export type MotionPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

interface UseShakeOptions {
  enabled: boolean;
  onShake: () => void;
  /** Magnitude delta threshold (m/s²). Higher = less sensitive. */
  threshold?: number;
  /** Quiet level after a shake before re-arming. */
  settleThreshold?: number;
  /** Hard minimum gap between accepted shakes (ms). */
  cooldownMs?: number;
}

function hasDeviceMotion(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

export function isInsecureMotionContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext === false;
}

export function needsIosMotionPermission(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  );
}

function needsIosOrientationPermission(): boolean {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  );
}

/**
 * Must be called from a direct user gesture (e.g. Connect Dice onClick).
 */
export async function requestDeviceMotionPermission(): Promise<MotionPermission> {
  if (!hasDeviceMotion()) return 'unsupported';
  if (!needsIosMotionPermission()) return 'granted';

  try {
    const motionResult = await (
      DeviceMotionEvent as unknown as {
        requestPermission: () => Promise<'granted' | 'denied'>;
      }
    ).requestPermission();

    if (needsIosOrientationPermission()) {
      try {
        await (
          DeviceOrientationEvent as unknown as {
            requestPermission: () => Promise<'granted' | 'denied'>;
          }
        ).requestPermission();
      } catch {
        // Orientation may fail while motion still works
      }
    }

    return motionResult === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

function readAcceleration(event: DeviceMotionEvent): { x: number; y: number; z: number } | null {
  const acc = event.acceleration;
  if (acc && acc.x != null && acc.y != null && acc.z != null) {
    return { x: acc.x, y: acc.y, z: acc.z };
  }

  const g = event.accelerationIncludingGravity;
  if (g && g.x != null && g.y != null && g.z != null) {
    return { x: g.x, y: g.y, z: g.z };
  }

  return null;
}

function magnitude({ x, y, z }: { x: number; y: number; z: number }) {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Peak-and-settle shake detector:
 * fire once when magnitude jumps above threshold, then stay locked until
 * motion settles below settleThreshold AND cooldown has elapsed.
 * Prevents one physical shake from counting as two.
 */
export function useShake({
  enabled,
  onShake,
  threshold = 7.5,
  settleThreshold = 2.2,
  cooldownMs = 2200,
}: UseShakeOptions) {
  const [permission, setPermission] = useState<MotionPermission>(() => {
    if (!hasDeviceMotion()) return 'unsupported';
    return needsIosMotionPermission() ? 'prompt' : 'granted';
  });
  const [receivingMotion, setReceivingMotion] = useState(false);

  const lastMag = useRef<number | null>(null);
  const lastShakeAt = useRef(0);
  const armed = useRef(true);
  const receivingRef = useRef(false);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestDeviceMotionPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  useEffect(() => {
    if (!enabled) {
      receivingRef.current = false;
      setReceivingMotion(false);
      lastMag.current = null;
      armed.current = true;
      return;
    }
    if (permission !== 'granted' || !hasDeviceMotion()) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const sample = readAcceleration(event);
      if (!sample) return;

      if (!receivingRef.current) {
        receivingRef.current = true;
        setReceivingMotion(true);
      }

      const mag = magnitude(sample);
      const prev = lastMag.current;
      lastMag.current = mag;
      if (prev == null) return;

      const delta = Math.abs(mag - prev);
      const now = Date.now();
      const sinceShake = now - lastShakeAt.current;

      // Re-arm only after cooldown AND motion has settled
      if (!armed.current) {
        if (sinceShake >= cooldownMs && delta < settleThreshold) {
          armed.current = true;
        }
        return;
      }

      if (delta < threshold) return;

      armed.current = false;
      lastShakeAt.current = now;
      onShakeRef.current();
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, permission, threshold, settleThreshold, cooldownMs]);

  return {
    isSupported: hasDeviceMotion(),
    needsPermission: needsIosMotionPermission(),
    insecureContext: isInsecureMotionContext(),
    permission,
    requestPermission,
    receivingMotion,
    isListening: enabled && permission === 'granted',
  };
}
