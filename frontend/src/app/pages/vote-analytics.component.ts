import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { LinkList, VoteAnalytics } from '../models';
import { I18nService } from '../services/i18n.service';

interface ListAnalytics {
  list: LinkList;
  analytics: VoteAnalytics;
}

@Component({
  selector: 'app-vote-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-2">{{ i18n.t('analytics.title') }}</h1>
      <p class="mb-6" style="color: var(--color-text-muted)">
        {{ i18n.t('analytics.subtitle') }}
      </p>

      @if (loading()) {
        <p style="color: var(--color-text-muted)">{{ i18n.t('analytics.loading') }}</p>
      } @else if (analyticsData().length === 0) {
        <p style="color: var(--color-text-muted)">{{ i18n.t('analytics.noData') }}</p>
      } @else {
        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="border rounded-lg p-4 text-center" [style.background]="'var(--color-card-bg)'">
            <div class="text-3xl font-bold" style="color: var(--color-primary)">{{ totalVotes() }}</div>
            <div class="text-sm" style="color: var(--color-text-muted)">{{ i18n.t('analytics.totalVotes') }}</div>
          </div>
          <div class="border rounded-lg p-4 text-center" [style.background]="'var(--color-card-bg)'">
            <div class="text-3xl font-bold" style="color: var(--color-primary)">
              {{ overallAverage() | number:'1.1-1' }}
            </div>
            <div class="text-sm" style="color: var(--color-text-muted)">{{ i18n.t('analytics.overallAverage') }}</div>
          </div>
          <div class="border rounded-lg p-4 text-center" [style.background]="'var(--color-card-bg)'">
            <div class="text-3xl font-bold" style="color: var(--color-primary)">{{ ratedListsCount() }}</div>
            <div class="text-sm" style="color: var(--color-text-muted)">{{ i18n.t('analytics.ratedLists') }}</div>
          </div>
        </div>

        <!-- Per-list analytics -->
        @for (item of sortedAnalytics(); track item.list.id) {
          <div class="border rounded-lg p-4 mb-4" [style.background]="'var(--color-card-bg)'">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-semibold">
                <a [routerLink]="['/lists', item.list.id]"
                   class="hover:underline"
                   style="color: var(--color-link)">
                  {{ item.list.name }}
                </a>
              </h2>
              <div class="text-sm" style="color: var(--color-text-muted)">
                {{ i18n.t('analytics.votes') }}: {{ item.analytics.voteCount }}
                | {{ i18n.t('analytics.avg') }}: {{ item.analytics.averageRating | number:'1.1-1' }} ★
              </div>
            </div>
            <div class="text-xs mb-3" style="color: var(--color-text-muted)">
              {{ i18n.t('publicLists.owner') }}: {{ item.list.owner }}
              | {{ i18n.t('myLists.created') }}: {{ item.list.createdAt | date:'short' }}
            </div>

            <!-- Rating distribution bars -->
            <div class="space-y-1">
              @for (star of [5, 4, 3, 2, 1]; track star) {
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-8 text-right">{{ star }}★</span>
                  <div class="flex-1 bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden"
                       role="progressbar"
                       [attr.aria-valuenow]="getDistributionPercent(item.analytics, star)"
                       aria-valuemin="0"
                       aria-valuemax="100"
                       [attr.aria-label]="star + ' star: ' + getDistributionCount(item.analytics, star) + ' votes'">
                    <div class="h-4 rounded-full transition-all duration-300"
                         [style.width.%]="getDistributionPercent(item.analytics, star)"
                         [style.background]="getBarColor(star)">
                    </div>
                  </div>
                  <span class="w-12 text-right" style="color: var(--color-text-muted)">
                    {{ getDistributionCount(item.analytics, star) }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <nav class="mt-6 flex items-center justify-center gap-4" aria-label="Analytics pagination">
            <button
              (click)="previousPage()"
              [disabled]="page() === 0"
              class="px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer">
              {{ i18n.t('publicLists.previous') }}
            </button>
            <span class="text-sm" style="color: var(--color-text-muted)">
              {{ i18n.t('publicLists.page') }} {{ page() + 1 }} {{ i18n.t('publicLists.of') }} {{ totalPages() }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="isLastPage()"
              class="px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer">
              {{ i18n.t('publicLists.next') }}
            </button>
          </nav>
        }
      }

      <div class="mt-8">
        <a routerLink="/public-lists" class="underline" style="color: var(--color-link)">
          {{ i18n.t('analytics.backToPublicLists') }}
        </a>
      </div>
    </div>
  `
})
export class VoteAnalyticsComponent implements OnInit {
  private readonly linkService = inject(LinkService);
  private readonly socialService = inject(SocialService);
  protected readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly analyticsData = signal<ListAnalytics[]>([]);
  readonly page = signal(0);
  private readonly pageSize = 10;

  readonly ratedListsCount = computed(() =>
    this.analyticsData().filter(a => a.analytics.voteCount > 0).length
  );

  readonly totalVotes = computed(() =>
    this.analyticsData().reduce((sum, a) => sum + a.analytics.voteCount, 0)
  );

  readonly overallAverage = computed(() => {
    const rated = this.analyticsData().filter(a => a.analytics.voteCount > 0);
    if (rated.length === 0) return 0;
    const totalWeighted = rated.reduce((sum, a) => sum + a.analytics.averageRating * a.analytics.voteCount, 0);
    const totalCount = rated.reduce((sum, a) => sum + a.analytics.voteCount, 0);
    return totalCount > 0 ? Math.round((totalWeighted / totalCount) * 10) / 10 : 0;
  });

  readonly sortedAnalytics = computed(() => {
    const all = this.analyticsData();
    const start = this.page() * this.pageSize;
    return all
      .sort((a, b) => b.analytics.voteCount - a.analytics.voteCount || b.analytics.averageRating - a.analytics.averageRating)
      .slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.analyticsData().length / this.pageSize)));

  ngOnInit(): void {
    this.loadAnalytics();
  }

  protected getDistributionPercent(analytics: VoteAnalytics, star: number): number {
    if (analytics.voteCount === 0) return 0;
    const count = this.getDistributionCount(analytics, star);
    return Math.round((count / analytics.voteCount) * 100);
  }

  protected getDistributionCount(analytics: VoteAnalytics, star: number): number {
    const entry = analytics.ratingDistribution?.find(e => e.rating === star);
    return entry?.count ?? 0;
  }

  protected getBarColor(star: number): string {
    const colors: Record<number, string> = {
      5: '#22c55e',
      4: '#84cc16',
      3: '#eab308',
      2: '#f97316',
      1: '#ef4444'
    };
    return colors[star] ?? '#6b7280';
  }

  protected previousPage(): void {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
    }
  }

  protected nextPage(): void {
    if (!this.isLastPage()) {
      this.page.update(p => p + 1);
    }
  }

  protected isLastPage(): boolean {
    return this.page() >= this.totalPages() - 1;
  }

  private loadAnalytics(): void {
    this.loading.set(true);
    this.linkService.getPublishedLists(0, 100).subscribe({
      next: (data) => {
        const results: ListAnalytics[] = [];
        let pending = data.items.length;

        if (pending === 0) {
          this.analyticsData.set([]);
          this.loading.set(false);
          return;
        }

        for (const list of data.items) {
          this.socialService.getVoteAnalytics('LIST', list.id).subscribe({
            next: (analytics) => {
              results.push({ list, analytics });
              pending--;
              if (pending === 0) {
                this.analyticsData.set(results);
                this.loading.set(false);
              }
            },
            error: () => {
              pending--;
              if (pending === 0) {
                this.analyticsData.set(results);
                this.loading.set(false);
              }
            }
          });
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
