import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListDetailComponent } from './list-detail.component';
import { LinkService } from '../services/link.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DatePipe } from '@angular/common';
import { vi } from 'vitest';

describe('ListDetailComponent', () => {
  let component: ListDetailComponent;
  let fixture: ComponentFixture<ListDetailComponent>;
  let linkServiceMock: any;
  let router: Router;

  const mockList = { id: '1', name: 'Test List', owner: 'me', published: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), linkIds: ['l1'] };
  const mockLinks = [{ id: 'l1', owner: 'me', url: 'http://example.com', title: 'Example', createdAt: new Date().toISOString() }];

  beforeEach(async () => {
    linkServiceMock = {
        getListDetails: vi.fn().mockReturnValue(of({ list: mockList, links: mockLinks })),
        updateList: vi.fn().mockReturnValue(of({ ...mockList, name: 'Updated Name' })),
        addLinkToList: vi.fn().mockReturnValue(of(mockList))
    };

    await TestBed.configureTestingModule({
      imports: [ListDetailComponent, RouterTestingModule],
      providers: [
        { provide: LinkService, useValue: linkServiceMock },
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
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.newLinkUrl = 'invalid-url';
    component.newLinkTitle = 'Title';
    component.addLink();
    expect(linkServiceMock.addLinkToList).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should add a link', () => {
    component.newLinkUrl = 'http://new.com';
    component.newLinkTitle = 'New Link';
    component.addLink();
    
    expect(linkServiceMock.addLinkToList).toHaveBeenCalledWith('1', 'me', 'http://new.com', 'New Link');
    expect(linkServiceMock.getListDetails).toHaveBeenCalledTimes(2); 
  });

  it('should remove a link', () => {
    linkServiceMock.updateList.mockReturnValue(of({ ...mockList, linkIds: [] }));
    const linkToRemove = mockLinks[0];
    component.removeLink(linkToRemove);
    expect(linkServiceMock.updateList).toHaveBeenCalledWith('1', { linkIds: [] });
  });
});
