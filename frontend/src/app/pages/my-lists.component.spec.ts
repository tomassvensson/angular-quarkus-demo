import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyListsComponent } from './my-lists.component';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';
import { vi } from 'vitest';

describe('MyListsComponent', () => {
  let component: MyListsComponent;
  let fixture: ComponentFixture<MyListsComponent>;
  let linkServiceMock: any;
  let socialServiceMock: any;

  const mockLists = [
    { id: '1', name: 'List 1', owner: 'me', published: false, createdAt: new Date().toISOString(), linkIds: [] },
    { id: '2', name: 'List 2', owner: 'me', published: true, createdAt: new Date().toISOString(), linkIds: ['l1'] }
  ];
  const mockVoteStats = { averageRating: 0, voteCount: 0, userRating: null };

  beforeEach(async () => {
    linkServiceMock = {
      getMyLists: vi.fn().mockReturnValue(of(mockLists)),
      createList: vi.fn().mockReturnValue(of({ id: '3', name: 'New List', owner: 'me', published: false, createdAt: new Date().toISOString(), linkIds: [] })),
      updateList: vi.fn().mockReturnValue(of({ id: '1', name: 'List 1', owner: 'me', published: true, createdAt: new Date().toISOString(), linkIds: [] })),
      deleteList: vi.fn().mockReturnValue(of(void 0))
    };

    socialServiceMock = {
      getVoteStats: vi.fn().mockReturnValue(of(mockVoteStats))
    };

    await TestBed.configureTestingModule({
      imports: [MyListsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: linkServiceMock },
        { provide: SocialService, useValue: socialServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        DatePipe
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(MyListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load lists', () => {
    expect(component).toBeTruthy();
    expect(linkServiceMock.getMyLists).toHaveBeenCalled();
    expect(component.lists().length).toBe(2);
  });

  it('should create a new list', () => {
    component.newListName = 'New List';
    component.createList();
    expect(linkServiceMock.createList).toHaveBeenCalledWith('New List');
    expect(component.lists().length).toBe(3);
    expect(component.newListName).toBe('');
  });

  it('should not create a list with empty name', () => {
    component.newListName = '   ';
    component.createList();
    expect(linkServiceMock.createList).not.toHaveBeenCalled();
  });

  it('should sanitize list name', () => {
    // Tests that tags are stripped. Content inside tags might remain but without tags it's just text.
    component.newListName = '<b>Bold</b> Name';
    component.createList();
    expect(linkServiceMock.createList).toHaveBeenCalledWith('Bold Name');
  });

  it('should toggle publish status', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const listToToggle = mockLists[0];
    component.togglePublish(listToToggle);
    expect(linkServiceMock.updateList).toHaveBeenCalledWith('1', { published: true });
  });

  it('should delete a list', () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const listToDelete = mockLists[0];
    component.deleteList(listToDelete);
    expect(linkServiceMock.deleteList).toHaveBeenCalledWith('1');
    expect(component.lists().length).toBe(1);
    expect(component.lists()[0].id).toBe('2');
  });
});
