// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { createBrowserPlatform } from './browserPlatform';

describe('BrowserPlatform', () => {
  it('fails closed when a host exposes no browser capabilities', () => {
    const platform = createBrowserPlatform({
      window: null,
      document: null,
      storage: null,
      audioContextFactory: null,
      now: () => 42,
    });
    let deferred = 0;

    expect(platform.readStorage('missing')).toBeNull();
    expect(platform.writeStorage('missing', 'value')).toBe(false);
    expect(platform.mediaQuery('(prefers-reduced-motion: reduce)').matches).toBe(false);
    expect(platform.scheduleTimeout(() => { deferred += 1; }, 10)).toBeNull();
    expect(platform.defer(() => { deferred += 1; })).toBeNull();
    expect(deferred).toBe(1);
    expect(platform.documentHidden()).toBe(false);
    expect(platform.activeElement()).toBeNull();
    expect(platform.createAudioContext()).toBeNull();
    expect(platform.now()).toBe(42);
    expect(() => platform.listenWindow('keydown', () => {})()).not.toThrow();
    expect(() => platform.listenVisibility(() => {})()).not.toThrow();
  });

  it('owns storage, media, timer, and listener cleanup through an injected host', () => {
    const listeners = new EventTarget();
    const documentTarget = Object.assign(new EventTarget(), { hidden: true, activeElement: null }) as unknown as Document;
    const callbacks: {
      timer: (() => void) | null;
      frame: (() => void) | null;
      media: ((event: MediaQueryListEvent) => void) | null;
    } = { timer: null, frame: null, media: null };
    let cancelledTimer: number | null = null;
    let cancelledFrame: number | null = null;
    const storageValues = new Map<string, string>();
    const storage = {
      getItem: (key: string) => storageValues.get(key) ?? null,
      setItem: (key: string, value: string) => { storageValues.set(key, value); },
    } as unknown as Storage;
    const media = {
      matches: true,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => { callbacks.media = listener; },
      removeEventListener: () => { callbacks.media = null; },
    } as unknown as MediaQueryList;
    const windowTarget = Object.assign(listeners, {
      document: documentTarget,
      localStorage: storage,
      setTimeout: (callback: () => void) => { callbacks.timer = callback; return 17; },
      clearTimeout: (handle: number) => { cancelledTimer = handle; },
      requestAnimationFrame: (callback: () => void) => { callbacks.frame = callback; return 19; },
      cancelAnimationFrame: (handle: number) => { cancelledFrame = handle; },
      matchMedia: () => media,
    }) as unknown as Window;
    const platform = createBrowserPlatform({ window: windowTarget, document: documentTarget, storage });
    let windowEvents = 0;
    let visibilityEvents = 0;
    let mediaMatches = false;
    let timeoutRuns = 0;
    let frameRuns = 0;

    expect(platform.writeStorage('checkpoint', 'ready')).toBe(true);
    expect(platform.readStorage('checkpoint')).toBe('ready');
    expect(platform.documentHidden()).toBe(true);
    const removeWindow = platform.listenWindow('keydown', () => { windowEvents += 1; });
    const removeVisibility = platform.listenVisibility(() => { visibilityEvents += 1; });
    const removeMedia = platform.mediaQuery('(prefers-reduced-motion: reduce)').subscribe((matches) => { mediaMatches = matches; });
    const timeout = platform.scheduleTimeout(() => { timeoutRuns += 1; }, 10);
    const animationFrame = platform.defer(() => { frameRuns += 1; });

    listeners.dispatchEvent(new Event('keydown'));
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    callbacks.media?.({ matches: false } as MediaQueryListEvent);
    callbacks.timer?.();
    callbacks.frame?.();
    removeWindow();
    removeVisibility();
    removeMedia();
    platform.cancelTimeout(timeout);
    platform.cancelFrame(animationFrame);
    listeners.dispatchEvent(new Event('keydown'));
    documentTarget.dispatchEvent(new Event('visibilitychange'));

    expect({ windowEvents, visibilityEvents, mediaMatches, timeoutRuns, frameRuns, cancelledTimer, cancelledFrame }).toEqual({
      windowEvents: 1,
      visibilityEvents: 1,
      mediaMatches: false,
      timeoutRuns: 1,
      frameRuns: 1,
      cancelledTimer: 17,
      cancelledFrame: 19,
    });
  });
});
