import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService, ThemeMode } from '../services/theme.service';
import { signal } from '@angular/core';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let mockThemeService: { mode: ReturnType<typeof signal<ThemeMode>>; setMode: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockThemeService = {
      mode: signal<ThemeMode>('system'),
      setMode: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
      ],
    });

    const fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 options: light, system, dark', () => {
    expect(component.options().length).toBe(3);
    expect(component.options().map(o => o.mode)).toEqual(['light', 'system', 'dark']);
  });

  it('should reflect the current mode from ThemeService', () => {
    expect(component.currentMode()).toBe('system');

    mockThemeService.mode.set('dark');
    expect(component.currentMode()).toBe('dark');

    mockThemeService.mode.set('light');
    expect(component.currentMode()).toBe('light');
  });

  it('should call ThemeService.setMode when selecting a mode', () => {
    component.selectMode('dark');
    expect(mockThemeService.setMode).toHaveBeenCalledWith('dark');

    component.selectMode('light');
    expect(mockThemeService.setMode).toHaveBeenCalledWith('light');
  });

  it('should render a button for each theme option', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.theme-btn');
    expect(buttons.length).toBe(3);
  });

  it('should mark the active mode button', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.theme-btn');
    // 'system' is index 1
    expect(buttons[1].classList.contains('active')).toBe(true);
  });

  it('should have proper ARIA attributes', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const radiogroup = fixture.nativeElement.querySelector('[role="radiogroup"]');
    expect(radiogroup).toBeTruthy();
    expect(radiogroup.getAttribute('aria-label')).toBe('Theme preference');

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.theme-btn');
    buttons.forEach((btn: HTMLButtonElement) => {
      expect(btn.hasAttribute('aria-pressed')).toBe(true);
      expect(btn.hasAttribute('aria-label')).toBe(true);
    });
  });

  it('should display icons for each option', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('.theme-icon');
    expect(icons.length).toBe(3);
    expect(icons[0].textContent.trim()).toBe('☀️');
    expect(icons[1].textContent.trim()).toBe('💻');
    expect(icons[2].textContent.trim()).toBe('🌙');
  });
});
