import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LinkService } from '../services/link.service';
import { LinkList } from '../models';

@Component({
  selector: 'app-public-lists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Public Lists</h1>
      
      <div class="grid gap-4">
        @for (list of lists(); track list.id) {
          <div class="border p-4 rounded shadow bg-white">
             <h2 class="text-xl font-semibold">
                <a [routerLink]="['/lists', list.id]" class="text-blue-600 hover:underline">
                    {{ list.name }}
                </a>
            </h2>
            <div class="text-sm text-gray-500">
              Owner: {{ list.owner }} | 
              Created: {{ list.createdAt | date:'short' }} |
              Links: {{ list.linkIds.length || 0 }}
            </div>
          </div>
        } @empty {
          <p class="text-gray-500">No public lists found.</p>
        }
      </div>

      @if (totalPages() > 1) {
        <nav class="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
          <button
            (click)="previousPage()"
            [disabled]="page() === 0"
            class="px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer">
            Previous
          </button>
          <span class="text-sm text-gray-600">
            Page {{ page() + 1 }} of {{ totalPages() }}
            <span class="mx-2">|</span>
            {{ total() }} total lists
          </span>
          <button
            (click)="nextPage()"
            [disabled]="isLastPage()"
            class="px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer">
            Next
          </button>
        </nav>
      }

       <div class="mt-8">
        <a routerLink="/my-lists" class="text-blue-600 underline">Back to My Lists</a>
      </div>
    </div>
  `
})
export class PublicListsComponent implements OnInit {
  private readonly linkService = inject(LinkService);

  readonly lists = signal<LinkList[]>([]);
  readonly page = signal(0);
  readonly total = signal(0);
  private readonly pageSize = 10;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  ngOnInit() {
    this.loadPage();
  }

  protected previousPage(): void {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.loadPage();
    }
  }

  protected nextPage(): void {
    if (!this.isLastPage()) {
      this.page.set(this.page() + 1);
      this.loadPage();
    }
  }

  protected isLastPage(): boolean {
    return this.page() >= this.totalPages() - 1;
  }

  private loadPage(): void {
    this.linkService.getPublishedLists(this.page(), this.pageSize).subscribe(data => {
      this.lists.set(data.items);
      this.total.set(data.total);
    });
  }
}
