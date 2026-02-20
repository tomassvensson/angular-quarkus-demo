import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="star-rating-container" role="group" [attr.aria-label]="ariaLabel()">
      <div class="stars-interactive">
        @for (star of stars; track star) {
          <button
            class="star-btn"
            type="button"
            [attr.aria-label]="'Rate ' + star + ' star' + (star > 1 ? 's' : '')"
            [class.interactive]="interactive()"
            (click)="onStarClick(star)"
            (mouseenter)="onHover(star)"
            (mouseleave)="onHoverEnd()">
            <span class="star-wrapper">
              <span class="star-bg" aria-hidden="true">&#9733;</span>
              <span class="star-fg" [style.width.%]="getStarFillPercent(star)" aria-hidden="true">&#9733;</span>
            </span>
          </button>
        }
      </div>
      @if (showStats()) {
        <span class="vote-stats">
          <span class="avg-number">{{ displayAverage() }}</span>
          <span class="vote-count">({{ voteCount() }} vote{{ voteCount() === 1 ? '' : 's' }})</span>
        </span>
      }
    </div>
  `,
  styles: [`
    .star-rating-container {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stars-interactive {
      display: inline-flex;
      gap: 0;
    }
    .star-btn {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      cursor: default;
      font-size: 1.4rem;
      line-height: 1;
    }
    .star-btn.interactive {
      cursor: pointer;
    }
    .star-btn.interactive:hover {
      transform: scale(1.15);
    }
    .star-wrapper {
      position: relative;
      display: inline-block;
    }
    .star-bg {
      color: #d1d5db;
    }
    .star-fg {
      position: absolute;
      left: 0;
      top: 0;
      overflow: hidden;
      color: #facc15;
      white-space: nowrap;
    }
    .vote-stats {
      font-size: 0.85rem;
      color: #4b5563;
    }
    .avg-number {
      font-weight: 600;
    }
    .vote-count {
      color: #6b7280;
    }
  `]
})
export class StarRatingComponent {
  readonly averageRating = input(0);
  readonly voteCount = input(0);
  readonly userRating = input<number | null>(null);
  readonly interactive = input(false);
  readonly showStats = input(true);
  readonly rated = output<number>();

  readonly stars = [1, 2, 3, 4, 5];
  protected hoverRating = 0;

  protected readonly displayAverage = computed(() => {
    const avg = this.averageRating();
    return avg > 0 ? avg.toFixed(1) : '0.0';
  });

  protected readonly ariaLabel = computed(() => {
    const avg = this.averageRating();
    const count = this.voteCount();
    return `Rating: ${avg.toFixed(1)} out of 5 stars from ${count} vote${count === 1 ? '' : 's'}`;
  });

  protected getStarFillPercent(star: number): number {
    const rating = this.hoverRating || this.userRating() || this.averageRating();
    if (rating >= star) return 100;
    if (rating >= star - 1) return Math.round((rating - (star - 1)) * 100);
    return 0;
  }

  protected onStarClick(star: number): void {
    if (this.interactive()) {
      this.rated.emit(star);
    }
  }

  protected onHover(star: number): void {
    if (this.interactive()) {
      this.hoverRating = star;
    }
  }

  protected onHoverEnd(): void {
    this.hoverRating = 0;
  }
}
