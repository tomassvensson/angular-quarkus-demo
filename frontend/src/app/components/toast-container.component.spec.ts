import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should show no container when there are no toasts', () => {
    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container).toBeNull();
  });

  it('should show toasts', () => {
    toastService.show('Test toast', 'info');
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container).toBeTruthy();
    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Test toast');
  });

  it('should apply correct class for each type', () => {
    toastService.show('Error toast', 'error');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('toast-error')).toBe(true);
  });

  it('should dismiss toast when close button is clicked', () => {
    toastService.show('Dismissable', 'info');
    fixture.detectChanges();
    const closeButton = fixture.nativeElement.querySelector('.toast-close');
    closeButton.click();
    fixture.detectChanges();
    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(0);
  });

  it('should return correct icons', () => {
    expect(component.iconFor('info')).toBe('ℹ️');
    expect(component.iconFor('success')).toBe('✅');
    expect(component.iconFor('warning')).toBe('⚠️');
    expect(component.iconFor('error')).toBe('❌');
  });
});
