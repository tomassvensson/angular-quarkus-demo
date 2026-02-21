import { TestBed } from '@angular/core/testing';
import { LanguageSelectorComponent } from './language-selector.component';
import { I18nService, Language, LANGUAGES } from '../services/i18n.service';
import { signal } from '@angular/core';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let mockI18n: { language: ReturnType<typeof signal<Language>>; setLanguage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockI18n = {
      language: signal<Language>('en'),
      setLanguage: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: I18nService, useValue: mockI18n },
      ],
    });

    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose LANGUAGES array', () => {
    expect(component.languages).toBe(LANGUAGES);
    expect(component.languages.length).toBe(3);
  });

  it('should reflect the current language from I18nService', () => {
    expect(component.currentLang()).toBe('en');

    mockI18n.language.set('de');
    expect(component.currentLang()).toBe('de');

    mockI18n.language.set('se');
    expect(component.currentLang()).toBe('se');
  });

  it('should call I18nService.setLanguage when selecting a language', () => {
    component.selectLanguage('de');
    expect(mockI18n.setLanguage).toHaveBeenCalledWith('de');

    component.selectLanguage('se');
    expect(mockI18n.setLanguage).toHaveBeenCalledWith('se');
  });

  it('should render a button for each language', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.lang-btn');
    expect(buttons.length).toBe(3);
  });

  it('should mark the active language button with active class', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.lang-btn');
    // 'en' is index 0 in LANGUAGES
    const enIndex = LANGUAGES.findIndex(l => l.code === 'en');
    expect(buttons[enIndex].classList.contains('active')).toBe(true);
  });

  it('should have proper ARIA attributes', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.detectChanges();
    const radiogroup = fixture.nativeElement.querySelector('[role="radiogroup"]');
    expect(radiogroup).toBeTruthy();
    expect(radiogroup.getAttribute('aria-label')).toBe('Language selection');

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.lang-btn');
    buttons.forEach((btn: HTMLButtonElement) => {
      expect(btn.hasAttribute('aria-pressed')).toBe(true);
      expect(btn.hasAttribute('aria-label')).toBe(true);
    });
  });
});
