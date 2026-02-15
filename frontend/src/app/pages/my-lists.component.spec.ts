import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyListsComponent } from './my-lists.component';
import { LinkService } from '../services/link.service';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('MyListsComponent', () => {
  let component: MyListsComponent;
  let fixture: ComponentFixture<MyListsComponent>;
  let linkServiceMock: any;

  beforeEach(async () => {
    linkServiceMock = {
      getMyLists: () => of([]),
      createList: (owner: string, name: string) => of({ id: '1', owner, name, published: false, linkIds: [] }),
      updateList: () => of({}),
      deleteList: () => of(void 0)
    };

    await TestBed.configureTestingModule({
      imports: [MyListsComponent],
      providers: [
        { provide: LinkService, useValue: linkServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(MyListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
