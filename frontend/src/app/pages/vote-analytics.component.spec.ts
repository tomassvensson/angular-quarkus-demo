import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoteAnalyticsComponent } from './vote-analytics.component';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('VoteAnalyticsComponent', () => {
  let component: VoteAnalyticsComponent;
  let fixture: ComponentFixture<VoteAnalyticsComponent>;
  let linkServiceMock: Record<string, ReturnType<typeof vi.fn>>;
  let socialServiceMock: Record<string, ReturnType<typeof vi.fn>>;

  const mockLists = [
    { id: '1', name: 'List A', owner: 'alice', published: true, createdAt: new Date().toISOString(), linkIds: ['l1'] },
    { id: '2', name: 'List B', owner: 'bob', published: true, createdAt: new Date().toISOString(), linkIds: [] }
  ];

  const mockPage = { items: mockLists, page: 0, size: 100, total: 2 };

  const mockAnalytics = {
    averageRating: 4.2,
    voteCount: 5,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 2 },
      { rating: 5, count: 2 }
    ],
    userRating: 4
  };

  const emptyAnalytics = {
    averageRating: 0,
    voteCount: 0,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 }
    ],
    userRating: null
  };

  beforeEach(async () => {
    linkServiceMock = {
      getPublishedLists: vi.fn().mockReturnValue(of(mockPage))
    };

    socialServiceMock = {
      getVoteAnalytics: vi.fn()
        .mockReturnValueOnce(of(mockAnalytics))
        .mockReturnValueOnce(of(emptyAnalytics))
    };

    await TestBed.configureTestingModule({
      imports: [VoteAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: linkServiceMock },
        { provide: SocialService, useValue: socialServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VoteAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load analytics on init', () => {
    expect(linkServiceMock['getPublishedLists']).toHaveBeenCalledWith(0, 100);
    expect(socialServiceMock['getVoteAnalytics']).toHaveBeenCalledTimes(2);
  });

  it('should compute total votes', () => {
    expect(component.totalVotes()).toBe(5);
  });

  it('should compute rated lists count', () => {
    expect(component.ratedListsCount()).toBe(1);
  });

  it('should compute overall average', () => {
    expect(component.overallAverage()).toBeGreaterThan(0);
  });

  it('should render summary cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('5');
    expect(compiled.textContent).toContain('List A');
  });

  it('should handle empty state', async () => {
    const emptyLinkService = {
      getPublishedLists: vi.fn().mockReturnValue(of({ items: [], page: 0, size: 100, total: 0 }))
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [VoteAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: emptyLinkService },
        { provide: SocialService, useValue: socialServiceMock }
      ]
    }).compileComponents();

    const emptyFixture = TestBed.createComponent(VoteAnalyticsComponent);
    emptyFixture.detectChanges();

    const compiled = emptyFixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No published lists found');
  });

  it('should handle error in loading', async () => {
    const errorLinkService = {
      getPublishedLists: vi.fn().mockReturnValue(throwError(() => new Error('fail')))
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [VoteAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: errorLinkService },
        { provide: SocialService, useValue: socialServiceMock }
      ]
    }).compileComponents();

    const errorFixture = TestBed.createComponent(VoteAnalyticsComponent);
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.loading()).toBe(false);
  });

  it('should return correct distribution percentage', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.getDistributionPercent(mockAnalytics, 5)).toBe(40);
    expect(c.getDistributionPercent(mockAnalytics, 4)).toBe(40);
    expect(c.getDistributionPercent(mockAnalytics, 3)).toBe(20);
    expect(c.getDistributionPercent(mockAnalytics, 1)).toBe(0);
  });

  it('should return bar colors for each star', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.getBarColor(5)).toBe('#22c55e');
    expect(c.getBarColor(1)).toBe('#ef4444');
  });

  it('should handle zero votes gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.getDistributionPercent(emptyAnalytics, 5)).toBe(0);
  });

  it('should return fallback bar color for unknown star', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    expect(c.getBarColor(0)).toBe('#6b7280');
    expect(c.getBarColor(6)).toBe('#6b7280');
  });

  it('should handle previousPage correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    // page is 0 initially; previousPage should keep it at 0
    c.previousPage();
    expect(component.page()).toBe(0);
    // Manually set page to 1 and test
    component.page.set(1);
    c.previousPage();
    expect(component.page()).toBe(0);
  });

  it('should handle nextPage correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    // Only 2 items, pageSize=10, so totalPages=1 and isLastPage=true
    c.nextPage();
    expect(component.page()).toBe(0);
  });

  it('should report isLastPage correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    // With 2 items and pageSize 10, we are on the last page
    expect(c.isLastPage()).toBe(true);
  });

  it('should compute totalPages correctly', () => {
    expect(component.totalPages()).toBe(1);
  });

  it('should compute sortedAnalytics', () => {
    const sorted = component.sortedAnalytics();
    expect(sorted.length).toBe(2);
    // Sorted by voteCount desc: first should have 5 votes
    expect(sorted[0].analytics.voteCount).toBe(5);
    expect(sorted[1].analytics.voteCount).toBe(0);
  });

  it('should handle individual vote analytics errors gracefully', async () => {
    const errorSocialService = {
      getVoteAnalytics: vi.fn()
        .mockReturnValueOnce(of(mockAnalytics))
        .mockReturnValueOnce(throwError(() => new Error('vote analytics error')))
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [VoteAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: { getPublishedLists: vi.fn().mockReturnValue(of(mockPage)) } },
        { provide: SocialService, useValue: errorSocialService }
      ]
    }).compileComponents();

    const errorFixture = TestBed.createComponent(VoteAnalyticsComponent);
    errorFixture.detectChanges();

    // Should still load the one that succeeded
    expect(errorFixture.componentInstance.analyticsData().length).toBe(1);
    expect(errorFixture.componentInstance.loading()).toBe(false);
  });

  it('should compute overallAverage as 0 when no rated lists', async () => {
    const zeroSocialService = {
      getVoteAnalytics: vi.fn().mockReturnValue(of(emptyAnalytics))
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [VoteAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: LinkService, useValue: { getPublishedLists: vi.fn().mockReturnValue(of(mockPage)) } },
        { provide: SocialService, useValue: zeroSocialService }
      ]
    }).compileComponents();

    const zeroFixture = TestBed.createComponent(VoteAnalyticsComponent);
    zeroFixture.detectChanges();

    expect(zeroFixture.componentInstance.overallAverage()).toBe(0);
  });

  it('should return 0 for getDistributionCount with missing ratingDistribution', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = component as any;
    const missingDist = { averageRating: 0, voteCount: 0, ratingDistribution: null, userRating: null };
    expect(c.getDistributionCount(missingDist, 5)).toBe(0);
  });

  it('should render rating bars with aria attributes', () => {
    const bars = fixture.nativeElement.querySelectorAll('[role="progressbar"]');
    expect(bars.length).toBeGreaterThan(0);
    const firstBar = bars[0];
    expect(firstBar.getAttribute('aria-valuemin')).toBe('0');
    expect(firstBar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('should render back to public lists link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backLink = compiled.querySelector('a[href="/public-lists"]');
    expect(backLink).toBeTruthy();
  });
});
