import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListDetailComponent } from './list-detail.component';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { vi } from 'vitest';

describe('ListDetailComponent', () => {
  let component: ListDetailComponent;
  let fixture: ComponentFixture<ListDetailComponent>;
  let linkServiceMock: any;
  let socialServiceMock: any;
  let router: Router;

  const mockList = { id: '1', name: 'Test List', owner: 'me', published: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), linkIds: ['l1'] };
  const mockLinks = [{ id: 'l1', owner: 'me', url: 'http://example.com', title: 'Example', createdAt: new Date().toISOString() }];
  const mockVoteStats = { averageRating: 0, voteCount: 0, userRating: null };

  beforeEach(async () => {
    linkServiceMock = {
        getMe: vi.fn().mockReturnValue(of({ username: 'me', roles: ['RegularUser'] })),
        getListDetails: vi.fn().mockReturnValue(of({ list: mockList, links: mockLinks })),
        updateList: vi.fn().mockReturnValue(of({ ...mockList, name: 'Updated Name' })),
        addLinkToList: vi.fn().mockReturnValue(of(mockList))
    };

    socialServiceMock = {
        getVoteStats: vi.fn().mockReturnValue(of(mockVoteStats)),
        vote: vi.fn().mockReturnValue(of(mockVoteStats)),
        getComments: vi.fn().mockReturnValue(of([])),
        addComment: vi.fn().mockReturnValue(of({})),
        addReply: vi.fn().mockReturnValue(of({})),
        deleteComment: vi.fn().mockReturnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [ListDetailComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: linkServiceMock },
        { provide: SocialService, useValue: socialServiceMock },
        { 
            provide: ActivatedRoute, 
            useValue: { 
                paramMap: of(new Map([['id', '1']]))
            } 
        },
        DatePipe
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ListDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    
    fixture.detectChanges();
  });

  it('should create and load list details', () => {
    expect(component).toBeTruthy();
    expect(linkServiceMock.getListDetails).toHaveBeenCalledWith('1');
    expect(component.list()?.name).toBe('Test List');
    expect(component.links().length).toBe(1);
  });

  it('should redirect if load fails', () => {
    linkServiceMock.getListDetails.mockReturnValue(throwError(() => new Error('Not found')));
    component.loadList('999');
    expect(router.navigate).toHaveBeenCalledWith(['/my-lists']);
  });

  it('should toggle publish', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    if (!component.list()) return;
    
    component.togglePublish(component.list()!);
    expect(linkServiceMock.updateList).toHaveBeenCalledWith('1', { published: true });
  });

  it('should start and cancel edit name', () => {
    const l = component.list()!;
    component.startEditName(l);
    expect(component.editingName).toBe(true);
    expect(component.editNameValue).toBe(l.name);
    
    component.cancelEditName();
    expect(component.editingName).toBe(false);
  });

  it('should save name', () => {
    const l = component.list()!;
    component.startEditName(l);
    component.editNameValue = 'Updated Name';
    component.saveName();
    
    expect(linkServiceMock.updateList).toHaveBeenCalledWith('1', { name: 'Updated Name' });
    expect(component.editingName).toBe(false);
    // In actual component code, update signal happens inside subscribe. 
    // Since mock returns immediately, it should reflect.
  });

  it('should sanitize name on save', () => {
    const l = component.list()!;
    component.startEditName(l);
    component.editNameValue = 'Safe Name<script>';
    component.saveName();
    expect(linkServiceMock.updateList).toHaveBeenCalledWith('1', { name: 'Safe Name' });
  });

  it('should not add link with invalid URL', () => {
    vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    component.newLinkUrl = 'invalid-url';
    component.newLinkTitle = 'Title';
    component.addLink();
    expect(linkServiceMock.addLinkToList).not.toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalled();
  });

  it('should add a link', () => {
    component.newLinkUrl = 'https://new.com';
    component.newLinkTitle = 'New Link';
    component.addLink();
    
    expect(linkServiceMock.addLinkToList).toHaveBeenCalledWith('1', 'https://new.com', 'New Link');
    expect(linkServiceMock.getListDetails).toHaveBeenCalledTimes(2); 
  });

  it('should remove a link', () => {
    linkServiceMock.updateList.mockReturnValue(of({ ...mockList, linkIds: [] }));
    const linkToRemove = mockLinks[0];
    component.removeLink(linkToRemove);
    expect(linkServiceMock.updateList).toHaveBeenCalledWith('1', { linkIds: [] });
  });

  it('should vote on a list', () => {
    const statsResult = { averageRating: 4.5, voteCount: 1, userRating: 5 };
    socialServiceMock.vote.mockReturnValue(of(statsResult));
    component.onVoteList(5);
    expect(socialServiceMock.vote).toHaveBeenCalledWith('LIST', '1', 5);
    expect(component.listVoteStats()).toEqual(statsResult);
  });

  it('should handle vote on list error', () => {
    socialServiceMock.vote.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.onVoteList(3);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should vote on a link', () => {
    const statsResult = { averageRating: 3.0, voteCount: 2, userRating: 3 };
    socialServiceMock.vote.mockReturnValue(of(statsResult));
    component.onVoteLink('l1', 3);
    expect(socialServiceMock.vote).toHaveBeenCalledWith('LINK', 'l1', 3);
    expect(component.linkVoteStats()['l1']).toEqual(statsResult);
  });

  it('should handle vote on link error', () => {
    socialServiceMock.vote.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.onVoteLink('l1', 2);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle getMe error', () => {
    linkServiceMock.getMe.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.ngOnInit();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle loadListVoteStats error', () => {
    socialServiceMock.getVoteStats.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component['loadListVoteStats']('1');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle loadLinkVoteStats error', () => {
    socialServiceMock.getVoteStats.mockReturnValue(throwError(() => new Error('fail')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component['loadLinkVoteStats']('l1');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should not add link with empty fields', () => {
    component.newLinkUrl = '';
    component.newLinkTitle = '';
    component.addLink();
    expect(linkServiceMock.addLinkToList).not.toHaveBeenCalled();
  });

  it('should not save name when list is null', () => {
    component.list.set(null);
    component.editNameValue = 'New Name';
    component.saveName();
    expect(linkServiceMock.updateList).not.toHaveBeenCalled();
  });

  it('should not save empty name', () => {
    component.startEditName(component.list()!);
    component.editNameValue = '<script>';
    component.saveName();
    // After sanitization, string is empty, so updateList should NOT be called
    expect(linkServiceMock.updateList).not.toHaveBeenCalledWith('1', { name: '' });
  });

  it('should set isAdmin for admin user', () => {
    linkServiceMock.getMe.mockReturnValue(of({ username: 'admin', roles: ['admin'] }));
    component.ngOnInit();
    expect(component.isAdmin()).toBe(true);
  });

  it('should not vote on list if list is null', () => {
    component.list.set(null);
    component.onVoteList(5);
    expect(socialServiceMock.vote).not.toHaveBeenCalled();
  });
});
