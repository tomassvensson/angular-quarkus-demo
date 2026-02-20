import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicListsComponent } from './public-lists.component';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('PublicListsComponent', () => {
  let component: PublicListsComponent;
  let fixture: ComponentFixture<PublicListsComponent>;
  let linkServiceMock: Record<string, ReturnType<typeof vi.fn>>;
  let socialServiceMock: Record<string, ReturnType<typeof vi.fn>>;

  const mockLists = [
    { id: '1', name: 'Public List 1', owner: 'alice', published: true, createdAt: new Date().toISOString(), linkIds: ['l1'] },
    { id: '2', name: 'Public List 2', owner: 'bob', published: true, createdAt: new Date().toISOString(), linkIds: [] }
  ];

  const mockPage = { items: mockLists, page: 0, size: 10, total: 2 };
  const mockVoteStats = { averageRating: 0, voteCount: 0, userRating: null };

  beforeEach(async () => {
    linkServiceMock = {
      getPublishedLists: vi.fn().mockReturnValue(of(mockPage))
    };

    socialServiceMock = {
      getVoteStats: vi.fn().mockReturnValue(of(mockVoteStats))
    };

    await TestBed.configureTestingModule({
      imports: [PublicListsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: linkServiceMock },
        { provide: SocialService, useValue: socialServiceMock }
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

  it('should navigate to previous page', () => {
    // Set up multi-page scenario
    linkServiceMock['getPublishedLists'].mockReturnValue(of({ items: mockLists, page: 1, size: 10, total: 25 }));
    component.ngOnInit();
    fixture.detectChanges();

    // page should be 0 initially; set it to 1 to test previous
    (component as any).page.set(1);
    (component as any).total.set(25);
    fixture.detectChanges();

    (component as any).previousPage();
    expect(component.page()).toBe(0);
    expect(linkServiceMock['getPublishedLists']).toHaveBeenCalled();
  });

  it('should not go to previous page when on first page', () => {
    (component as any).previousPage();
    // Should not trigger new load since already on page 0
    expect(component.page()).toBe(0);
  });

  it('should navigate to next page', () => {
    linkServiceMock['getPublishedLists'].mockReturnValue(of({ items: mockLists, page: 0, size: 10, total: 25 }));
    component.ngOnInit();
    fixture.detectChanges();

    (component as any).nextPage();
    expect(component.page()).toBe(1);
  });

  it('should not go to next page when on last page', () => {
    // total=2, pageSize=10 → only 1 page
    expect((component as any).isLastPage()).toBe(true);
    const currentPage = component.page();
    (component as any).nextPage();
    expect(component.page()).toBe(currentPage);
  });

  it('should show pagination controls when multiple pages', () => {
    linkServiceMock['getPublishedLists'].mockReturnValue(of({ items: mockLists, page: 0, size: 10, total: 25 }));
    component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Page 1 of 3');
    expect(compiled.textContent).toContain('25 total lists');
  });
});
