import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentsSectionComponent } from './comments-section.component';
import { SocialService } from '../services/social.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('CommentsSectionComponent', () => {
  let component: CommentsSectionComponent;
  let fixture: ComponentFixture<CommentsSectionComponent>;
  let socialServiceMock: any;

  const mockComments = [
    {
      id: 'c1',
      entityType: 'LIST',
      entityId: 'list1',
      userId: 'user1',
      content: 'Great list!',
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [
        {
          id: 'r1',
          entityType: 'LIST',
          entityId: 'list1',
          userId: 'owner1',
          content: 'Thanks!',
          parentId: 'c1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replies: []
        }
      ]
    }
  ];

  beforeEach(async () => {
    socialServiceMock = {
      getComments: vi.fn().mockReturnValue(of(mockComments)),
      addComment: vi.fn().mockReturnValue(of({ id: 'c2', userId: 'user2', content: 'New comment' })),
      addReply: vi.fn().mockReturnValue(of({ id: 'r2', userId: 'owner1', content: 'Reply' })),
      deleteComment: vi.fn().mockReturnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [CommentsSectionComponent],
      providers: [
        { provide: SocialService, useValue: socialServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entityType', 'LIST');
    fixture.componentRef.setInput('entityId', 'list1');
    fixture.componentRef.setInput('currentUser', 'owner1');
    fixture.componentRef.setInput('entityOwner', 'owner1');
    fixture.componentRef.setInput('isAdmin', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comments on init', () => {
    expect(socialServiceMock.getComments).toHaveBeenCalledWith('LIST', 'list1');
    expect(component.comments().length).toBe(1);
  });

  it('should display comment content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Great list!');
  });

  it('should display reply content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Thanks!');
  });

  it('should detect user has already commented', () => {
    fixture.componentRef.setInput('currentUser', 'user1');
    fixture.detectChanges();
    expect(component['hasUserComment']()).toBe(true);
  });

  it('should allow entity owner to reply', () => {
    const comment = mockComments[0];
    expect(component['canReply'](comment as any)).toBe(true);
  });

  it('should allow comment author to reply', () => {
    fixture.componentRef.setInput('currentUser', 'user1');
    fixture.detectChanges();
    const comment = mockComments[0];
    expect(component['canReply'](comment as any)).toBe(true);
  });

  it('should not allow unauthorized user to reply', () => {
    fixture.componentRef.setInput('currentUser', 'randomUser');
    fixture.componentRef.setInput('entityOwner', 'owner1');
    fixture.componentRef.setInput('isAdmin', false);
    fixture.detectChanges();
    const comment = mockComments[0];
    expect(component['canReply'](comment as any)).toBe(false);
  });

  it('should allow admin to reply', () => {
    fixture.componentRef.setInput('currentUser', 'adminUser');
    fixture.componentRef.setInput('isAdmin', true);
    fixture.detectChanges();
    const comment = mockComments[0];
    expect(component['canReply'](comment as any)).toBe(true);
  });

  it('should allow poster to delete own comment', () => {
    fixture.componentRef.setInput('currentUser', 'user1');
    fixture.detectChanges();
    const comment = mockComments[0];
    expect(component['canDelete'](comment as any)).toBe(true);
  });

  it('should allow admin to delete any comment', () => {
    fixture.componentRef.setInput('currentUser', 'adminUser');
    fixture.componentRef.setInput('isAdmin', true);
    fixture.detectChanges();
    const comment = mockComments[0];
    expect(component['canDelete'](comment as any)).toBe(true);
  });

  it('should not allow random user to delete', () => {
    fixture.componentRef.setInput('currentUser', 'randomUser');
    fixture.componentRef.setInput('isAdmin', false);
    fixture.detectChanges();
    const comment = mockComments[0];
    expect(component['canDelete'](comment as any)).toBe(false);
  });

  it('should delete comment on confirmation', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    component['onDeleteComment'](mockComments[0] as any);
    expect(socialServiceMock.deleteComment).toHaveBeenCalledWith('c1');
  });

  it('should not delete comment if confirm declined', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    component['onDeleteComment'](mockComments[0] as any);
    expect(socialServiceMock.deleteComment).not.toHaveBeenCalled();
  });
});
