import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListDetailComponent } from './list-detail.component';
import { LinkService } from '../services/link.service';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('ListDetailComponent', () => {
  let component: ListDetailComponent;
  let fixture: ComponentFixture<ListDetailComponent>;
  let linkServiceMock: any;

  beforeEach(async () => {
    const mockList = { id: '1', name: 'Test List', owner: 'me', published: false, linkIds: ['l1'] };
    const mockLinks = [{ id: 'l1', owner: 'me', url: 'http://e.com', title: 'Example' }];
    
    linkServiceMock = {
        getListDetails: () => of({ list: mockList, links: mockLinks }),
        updateList: () => of(mockList),
        addLinkToList: () => of(mockList)
    };

    await TestBed.configureTestingModule({
      imports: [ListDetailComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: linkServiceMock },
        { 
            provide: ActivatedRoute, 
            useValue: { 
                paramMap: of(new Map([['id', '1']])),
                snapshot: { paramMap: { get: () => '1' } }
            } 
        }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ListDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load list details', () => {
    expect(component.list()?.name).toBe('Test List');
    expect(component.links().length).toBe(1);
  });
});
