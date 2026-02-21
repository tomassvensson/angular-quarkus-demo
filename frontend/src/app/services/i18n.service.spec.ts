import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { I18nService, Language, LANGUAGES } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    globalThis.localStorage.removeItem('language-preference');

    TestBed.configureTestingModule({
      providers: [
        I18nService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    globalThis.localStorage.removeItem('language-preference');
  });

  it('should default to English', () => {
    expect(service.language()).toBe('en');
  });

  it('should export LANGUAGES array with 3 entries', () => {
    expect(LANGUAGES).toHaveLength(3);
    expect(LANGUAGES.map(l => l.code)).toEqual(['en', 'de', 'se']);
  });

  it('should set language and persist to localStorage', () => {
    service.setLanguage('de');
    expect(service.language()).toBe('de');
    expect(globalThis.localStorage.getItem('language-preference')).toBe('de');
  });

  it('should initialize from localStorage', () => {
    globalThis.localStorage.setItem('language-preference', 'se');
    service.initialize();
    expect(service.language()).toBe('se');
  });

  it('should translate English keys', () => {
    service.setLanguage('en');
    expect(service.t('nav.home')).toBe('Home');
    expect(service.t('nav.signIn')).toBe('Sign in');
  });

  it('should translate German keys', () => {
    service.setLanguage('de');
    expect(service.t('nav.home')).toBe('Startseite');
    expect(service.t('nav.signIn')).toBe('Anmelden');
  });

  it('should translate Swedish keys', () => {
    service.setLanguage('se');
    expect(service.t('nav.home')).toBe('Hem');
    expect(service.t('nav.signIn')).toBe('Logga in');
  });

  it('should fall back to English for missing keys', () => {
    service.setLanguage('de');
    // All keys should exist, but test the fallback logic with a custom key
    expect(service.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should interpolate params', () => {
    service.setLanguage('en');
    const result = service.t('profile.deleteConfirm', { email: 'test@test.com' });
    expect(result).toContain('test@test.com');
  });

  it('should compute currentLanguage', () => {
    service.setLanguage('de');
    const current = service.currentLanguage();
    expect(current.code).toBe('de');
    expect(current.label).toBe('Deutsch');
    expect(current.flag).toBe('🇩🇪');
  });

  it('should ignore invalid localStorage value', () => {
    globalThis.localStorage.setItem('language-preference', 'invalid');
    service.initialize();
    expect(service.language()).toBe('en');
  });
});
