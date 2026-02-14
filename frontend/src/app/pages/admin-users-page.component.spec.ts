import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { GraphqlApiService, CognitoUserPage } from '../services/graphql-api.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    fixture.detectChanges();
    
    const deleteBtn = fixture.debugElement.query(By.css('.btn-danger'));
    deleteBtn.nativeElement.click();

    expect(apiSpy.deleteUser).toHaveBeenCalledWith('bob');
  });
});
