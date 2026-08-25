import { useCallback, useEffect, useRef, useState } from 'react';

export type MotionPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

interface UseShakeOptions {
  enabled: boolean;
  onShake: () => void;
  /** Magnitude delta threshold (m/s²). Lower = more sensitive. */
  threshold?: number;
  /** Minimum gap between shakes (ms). */
  cooldownMs?: number;
}

function hasDeviceMotion(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

export function isInsecureMotionContext(): boolean {
  if (typeof window === 'undefined') return false;
  // localhost / https are secure; bare LAN http often blocks or starves sensors
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
 * iOS shows the system “Motion & Orientation” dialog.
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
  // Prefer linear acceleration; fall back to gravity-inclusive (more widely available)
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

export function useShake({
  enabled,
  onShake,
  threshold = 2.8,
  cooldownMs = 900,
}: UseShakeOptions) {
  const [permission, setPermission] = useState<MotionPermission>(() => {
    if (!hasDeviceMotion()) return 'unsupported';
    return needsIosMotionPermission() ? 'prompt' : 'granted';
  });
  const [receivingMotion, setReceivingMotion] = useState(false);

  const lastMag = useRef<number | null>(null);
  const lastShakeAt = useRef(0);
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
      if (delta < threshold || now - lastShakeAt.current < cooldownMs) return;

      lastShakeAt.current = now;
      onShakeRef.current();
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, permission, threshold, cooldownMs]);

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
