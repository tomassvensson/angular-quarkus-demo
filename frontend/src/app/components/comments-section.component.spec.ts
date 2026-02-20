import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentsSectionComponent } from './comments-section.component';
import { SocialService } from '../services/social.service';
import { of, throwError } from 'rxjs';
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

  it('should submit a new comment', () => {
    const emitSpy = vi.spyOn(component.commentChanged, 'emit');
    component.newCommentText = 'A new comment';
    component['submitComment']();
    expect(socialServiceMock.addComment).toHaveBeenCalledWith('LIST', 'list1', 'A new comment');
    expect(component.newCommentText).toBe('');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not submit empty comment', () => {
    component.newCommentText = '   ';
    component['submitComment']();
    expect(socialServiceMock.addComment).not.toHaveBeenCalled();
  });

  it('should handle submitComment error', () => {
    socialServiceMock.addComment.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.newCommentText = 'test';
    component['submitComment']();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should start reply to a comment', () => {
    component['startReply']('c1');
    expect(component.replyingTo()).toBe('c1');
    expect(component.replyText).toBe('');
  });

  it('should cancel reply', () => {
    component['startReply']('c1');
    component.replyText = 'draft';
    component['cancelReply']();
    expect(component.replyingTo()).toBeNull();
    expect(component.replyText).toBe('');
  });

  it('should submit a reply', () => {
    const emitSpy = vi.spyOn(component.commentChanged, 'emit');
    component['startReply']('c1');
    component.replyText = 'My reply';
    component['submitReply']('c1');
    expect(socialServiceMock.addReply).toHaveBeenCalledWith('c1', 'My reply');
    expect(component.replyText).toBe('');
    expect(component.replyingTo()).toBeNull();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not submit empty reply', () => {
    component.replyText = '  ';
    component['submitReply']('c1');
    expect(socialServiceMock.addReply).not.toHaveBeenCalled();
  });

  it('should handle submitReply error', () => {
    socialServiceMock.addReply.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.replyText = 'test reply';
    component['submitReply']('c1');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should reload comments after successful delete', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const emitSpy = vi.spyOn(component.commentChanged, 'emit');
    component['onDeleteComment'](mockComments[0] as any);
    expect(socialServiceMock.deleteComment).toHaveBeenCalledWith('c1');
    // After subscribe completes, loadComments should be called again
    expect(socialServiceMock.getComments).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should handle onDeleteComment error', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    socialServiceMock.deleteComment.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component['onDeleteComment'](mockComments[0] as any);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle loadComments error', () => {
    socialServiceMock.getComments.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component['loadComments']();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return false for canReply when currentUser is empty', () => {
    fixture.componentRef.setInput('currentUser', '');
    fixture.detectChanges();
    expect(component['canReply'](mockComments[0] as any)).toBe(false);
  });

  it('should return false for canDelete when currentUser is empty', () => {
    fixture.componentRef.setInput('currentUser', '');
    fixture.detectChanges();
    expect(component['canDelete'](mockComments[0] as any)).toBe(false);
  });

  it('should show empty state when no comments', () => {
    socialServiceMock.getComments.mockReturnValue(of([]));
    component['loadComments']();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No comments yet');
  });

  it('should show comment form when user has not commented', () => {
    fixture.componentRef.setInput('currentUser', 'newUser');
    socialServiceMock.getComments.mockReturnValue(of([]));
    component['loadComments']();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea');
    expect(textarea).toBeTruthy();
  });

  it('should hide comment form when user already commented', () => {
    // owner1 is currently set as currentUser but hasn't commented. Set to user1 who has.
    fixture.componentRef.setInput('currentUser', 'user1');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const textareas = compiled.querySelectorAll('textarea');
    // Should not show the "add a comment" textarea (only reply form uses textarea)
    expect(textareas.length).toBe(0);
  });
});
