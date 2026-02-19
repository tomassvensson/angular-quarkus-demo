import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserEditPageComponent } from './user-edit-page.component';
import { GraphqlApiService } from '../services/graphql-api.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('UserEditPageComponent', () => {
  let component: UserEditPageComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- access protected members in tests
  let instance: any;
  let fixture: ComponentFixture<UserEditPageComponent>;
  let apiSpy: Record<string, ReturnType<typeof vi.fn>>;

  const mockUser = {
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
    groups: ['RegularUser']
  };

  beforeEach(async () => {
    apiSpy = {
      user: vi.fn().mockReturnValue(of(mockUser)),
      groups: vi.fn().mockReturnValue(of(['RegularUser', 'AdminUser'])),
      updateUser: vi.fn().mockReturnValue(of({ ...mockUser, email: 'updated@example.com' }))
    };

    await TestBed.configureTestingModule({
      imports: [UserEditPageComponent],
      providers: [
        { provide: GraphqlApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'username' ? 'bob' : null) } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserEditPageComponent);
    component = fixture.componentInstance;
    instance = component;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user on init', () => {
    expect(apiSpy['user']).toHaveBeenCalledWith('bob');
    expect(instance.username()).toBe('bob');
    expect(instance.email).toBe('bob@example.com');
  });

  it('should load available groups', () => {
    expect(apiSpy['groups']).toHaveBeenCalled();
    expect(instance.availableGroups()).toEqual(['RegularUser', 'AdminUser']);
  });

  it('should toggle group selection', () => {
    instance.selectedGroups = ['RegularUser'];
    instance.toggleGroup('AdminUser', true);
    expect(instance.selectedGroups).toContain('AdminUser');

    instance.toggleGroup('RegularUser', false);
    expect(instance.selectedGroups).not.toContain('RegularUser');
  });

  it('should save user changes', () => {
    instance.email = 'updated@example.com';
    instance.save();
    expect(apiSpy['updateUser']).toHaveBeenCalledWith({
      username: 'bob',
      email: 'updated@example.com',
      enabled: true,
      groups: ['RegularUser']
    });
  });

  it('should check if group is selected', () => {
    instance.selectedGroups = ['RegularUser'];
    expect(instance.isGroupSelected('RegularUser')).toBe(true);
    expect(instance.isGroupSelected('AdminUser')).toBe(false);
  });
});
