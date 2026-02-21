import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let originalMatchMedia: typeof globalThis.matchMedia;

  beforeEach(() => {
    originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

    globalThis.localStorage.removeItem('theme-preference');

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
    globalThis.localStorage.removeItem('theme-preference');
  });

  it('should default to system mode', () => {
    expect(service.mode()).toBe('system');
  });

  it('should set mode and persist to localStorage', () => {
    service.setMode('dark');
    expect(service.mode()).toBe('dark');
    expect(globalThis.localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('should initialize from localStorage', () => {
    globalThis.localStorage.setItem('theme-preference', 'light');
    service.initialize();
    expect(service.mode()).toBe('light');
  });

  it('should compute effectiveTheme for light mode', () => {
    service.setMode('light');
    expect(service.effectiveTheme()).toBe('light');
  });

  it('should compute effectiveTheme for dark mode', () => {
    service.setMode('dark');
    expect(service.effectiveTheme()).toBe('dark');
  });

  it('should compute effectiveTheme for system mode (light when no dark preference)', () => {
    service.setMode('system');
    expect(service.effectiveTheme()).toBe('light');
  });

  it('should apply theme to document element', () => {
    service.setMode('dark');
    service.applyTheme();
    expect(globalThis.document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should sync from profile', () => {
    service.syncFromProfile('dark');
    expect(service.mode()).toBe('dark');
    expect(globalThis.localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('should ignore invalid profile sync', () => {
    service.syncFromProfile(null);
    expect(service.mode()).toBe('system');
  });

  it('should get local preference', () => {
    service.setMode('light');
    expect(service.getLocalPreference()).toBe('light');
  });

  it('should ignore invalid localStorage value', () => {
    globalThis.localStorage.setItem('theme-preference', 'invalid');
    service.initialize();
    expect(service.mode()).toBe('system');
  });
});
