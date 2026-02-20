import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render 5 star buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const stars = compiled.querySelectorAll('.star-btn');
    expect(stars.length).toBe(5);
  });

  it('should display average rating with 1 decimal', () => {
    fixture.componentRef.setInput('averageRating', 4.7);
    fixture.componentRef.setInput('voteCount', 10);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.avg-number')?.textContent).toBe('4.7');
  });

  it('should display vote count', () => {
    fixture.componentRef.setInput('averageRating', 3.5);
    fixture.componentRef.setInput('voteCount', 42);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.vote-count')?.textContent).toContain('42 votes');
  });

  it('should show singular "vote" for single vote', () => {
    fixture.componentRef.setInput('averageRating', 5);
    fixture.componentRef.setInput('voteCount', 1);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.vote-count')?.textContent).toContain('1 vote');
    expect(compiled.querySelector('.vote-count')?.textContent).not.toContain('votes');
  });

  it('should emit rating when star is clicked and interactive', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    let emittedRating = 0;
    component.rated.subscribe((r: number) => emittedRating = r);

    const stars = fixture.nativeElement.querySelectorAll('.star-btn');
    stars[3].click(); // 4th star
    expect(emittedRating).toBe(4);
  });

  it('should not emit rating when not interactive', () => {
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();
    let emittedRating = 0;
    component.rated.subscribe((r: number) => emittedRating = r);

    const stars = fixture.nativeElement.querySelectorAll('.star-btn');
    stars[2].click();
    expect(emittedRating).toBe(0);
  });

  it('should compute correct star fill percentages', () => {
    fixture.componentRef.setInput('averageRating', 3.7);
    fixture.detectChanges();

    // Stars 1-3 should be 100% filled, star 4 should be 70%, star 5 should be 0%
    expect(component['getStarFillPercent'](1)).toBe(100);
    expect(component['getStarFillPercent'](2)).toBe(100);
    expect(component['getStarFillPercent'](3)).toBe(100);
    expect(component['getStarFillPercent'](4)).toBe(70);
    expect(component['getStarFillPercent'](5)).toBe(0);
  });

  it('should hide stats when showStats is false', () => {
    fixture.componentRef.setInput('showStats', false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.vote-stats')).toBeFalsy();
  });
});
