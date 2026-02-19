import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicListsComponent } from './public-lists.component';
import { LinkService } from '../services/link.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('PublicListsComponent', () => {
  let component: PublicListsComponent;
  let fixture: ComponentFixture<PublicListsComponent>;
  let linkServiceMock: Record<string, ReturnType<typeof vi.fn>>;

  const mockLists = [
    { id: '1', name: 'Public List 1', owner: 'alice', published: true, createdAt: new Date().toISOString(), linkIds: ['l1'] },
    { id: '2', name: 'Public List 2', owner: 'bob', published: true, createdAt: new Date().toISOString(), linkIds: [] }
  ];

  const mockPage = { items: mockLists, page: 0, size: 10, total: 2 };

  beforeEach(async () => {
    linkServiceMock = {
      getPublishedLists: vi.fn().mockReturnValue(of(mockPage))
    };

    await TestBed.configureTestingModule({
      imports: [PublicListsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: linkServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load published lists on init', () => {
    expect(linkServiceMock['getPublishedLists']).toHaveBeenCalled();
    expect(component.lists().length).toBe(2);
  });

  it('should display list names', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Public List 1');
    expect(compiled.textContent).toContain('Public List 2');
  });

  it('should show empty state when no lists', () => {
    linkServiceMock['getPublishedLists'].mockReturnValue(of({ items: [], page: 0, size: 10, total: 0 }));
    component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No public lists found');
  });
});
