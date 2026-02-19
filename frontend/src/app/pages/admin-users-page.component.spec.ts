import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { GraphqlApiService, CognitoUserPage } from '../services/graphql-api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';

describe('AdminUsersPageComponent', () => {
  let component: AdminUsersPageComponent;
  let fixture: ComponentFixture<AdminUsersPageComponent>;
  let apiSpy: any;
  let routerSpy: any;

  const mockPageData: CognitoUserPage = {
    items: [
      {
        username: 'bob',
        email: 'bob@example.com',
        emailVerified: true,
        confirmationStatus: 'CONFIRMED',
        status: 'enabled',
        enabled: true,
        created: '2023-01-01',
        lastUpdatedTime: '2023-01-01',
        modified: '2023-01-01',
        mfaSetting: 'OFF',
        groups: ['user']
      }
    ],
    page: 0,
    size: 10,
    total: 1
  };

  beforeEach(async () => {
    apiSpy = {
      users: vi.fn(),
      deleteUser: vi.fn()
    };
    routerSpy = {
      navigate: vi.fn()
    };

    apiSpy.users.mockReturnValue(of(mockPageData));
    apiSpy.deleteUser.mockReturnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent, DatePipe],
      providers: [
        { provide: GraphqlApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(apiSpy.users).toHaveBeenCalled();
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(1);
    expect(rows[0].nativeElement.textContent).toContain('bob');
  });

  it('should call deleteUser logic when delete button clicked', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    
    fixture.detectChanges();
    
    const deleteBtn = fixture.debugElement.query(By.css('.btn-danger'));
    deleteBtn.nativeElement.click();

    expect(apiSpy.deleteUser).toHaveBeenCalledWith('bob');
  });

  it('should not delete if confirmation declined', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    
    fixture.detectChanges();
    
    const deleteBtn = fixture.debugElement.query(By.css('.btn-danger'));
    deleteBtn.nativeElement.click();

    expect(apiSpy.deleteUser).not.toHaveBeenCalled();
  });

  it('should sort by column and toggle direction', () => {
    (component as any).sort('email');
    expect((component as any).sortBy()).toBe('email');
    expect((component as any).direction()).toBe('asc');

    (component as any).sort('email');
    expect((component as any).direction()).toBe('desc');
  });

  it('should show sort indicator for active column', () => {
    (component as any).sortBy.set('username');
    (component as any).direction.set('asc');
    expect((component as any).sortIndicator('username')).toBe('↑');
    expect((component as any).sortIndicator('email')).toBe('');

    (component as any).direction.set('desc');
    expect((component as any).sortIndicator('username')).toBe('↓');
  });

  it('should navigate pages', () => {
    // With 1 user on page 0, total 1 → last page
    expect((component as any).isLastPage()).toBe(true);
    expect((component as any).totalPages()).toBe(1);

    // Set up multi-page scenario
    apiSpy.users.mockReturnValue(of({
      ...mockPageData,
      total: 25
    }));
    (component as any).page.set(0);
    (component as any).load();
    fixture.detectChanges();

    expect((component as any).totalPages()).toBe(3);
    expect((component as any).isLastPage()).toBe(false);

    (component as any).nextPage();
    expect((component as any).page()).toBe(1);

    (component as any).previousPage();
    expect((component as any).page()).toBe(0);
  });

  it('should not go to previous page when on first page', () => {
    (component as any).previousPage();
    expect((component as any).page()).toBe(0);
  });

  it('should handle load errors and redirect on AUTH_REQUIRED', () => {
    vi.useFakeTimers();
    apiSpy.users.mockReturnValue(throwError(() => new Error('AUTH_REQUIRED')));
    (component as any).load();
    // Wait for min overlay time
    vi.advanceTimersByTime(300);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    vi.useRealTimers();
  });

  it('should navigate to user detail on row click', () => {
    (component as any).openUser('bob');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users', 'bob']);
  });
});
