import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { LinkList, VoteStats } from '../models';
import { StarRatingComponent } from '../components/star-rating.component';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-my-lists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, StarRatingComponent],
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">{{ i18n.t('myLists.title') }}</h1>
      
      <div class="mb-6 flex gap-2">
        <input 
          [(ngModel)]="newListName" 
          [placeholder]="i18n.t('myLists.newListPlaceholder')" 
          class="border p-2 rounded"
          (keyup.enter)="createList()"
        />
        <button (click)="createList()" class="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
          {{ i18n.t('myLists.createList') }}
        </button>
      </div>

      <div class="grid gap-4">
        @for (list of lists(); track list.id) {
          <div class="border p-4 rounded shadow cursor-pointer transition-colors"
             [style.background]="'var(--color-card-bg)'"
             (click)="goToList(list.id)">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-semibold" style="color: var(--color-link)">
                    {{ list.name }}
                </h2>
                <div class="text-sm" style="color: var(--color-text-muted)">
                  {{ i18n.t('myLists.created') }}: {{ list.createdAt | date:'short' }} |
                  {{ i18n.t('myLists.published') }}: {{ list.published ? i18n.t('common.yes') : i18n.t('common.no') }} |
                  {{ i18n.t('myLists.links') }}: {{ list.linkIds.length || 0 }}
                </div>
                @if (voteStatsMap()[list.id]; as vs) {
                  <div class="mt-1">
                    <app-star-rating
                      [averageRating]="vs.averageRating"
                      [voteCount]="vs.voteCount"
                      [userRating]="vs.userRating"
                      [interactive]="false" />
                  </div>
                }
              </div>
              <div class="flex gap-2" (click)="$event.stopPropagation()">
                @if (list.published) {
                  <button (click)="togglePublish(list)" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-yellow-600">
                    {{ i18n.t('myLists.unpublish') }}
                  </button>
                } @else {
                  <button (click)="togglePublish(list)" class="bg-green-500 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-green-600">
                    {{ i18n.t('myLists.publish') }}
                  </button>
                }
                <button (click)="deleteList(list)" class="bg-red-500 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-red-600">
                  {{ i18n.t('myLists.delete') }}
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <p style="color: var(--color-text-muted)">{{ i18n.t('myLists.noLists') }}</p>
        }
      </div>
      
       <div class="mt-8">
        <a routerLink="/public-lists" class="text-blue-600 underline">{{ i18n.t('myLists.viewPublic') }}</a>
      </div>
    </div>
  `
})
export class MyListsComponent implements OnInit {
  private readonly linkService = inject(LinkService);
  private readonly socialService = inject(SocialService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  
  readonly lists = signal<LinkList[]>([]);
  readonly voteStatsMap = signal<Record<string, VoteStats>>({});
  newListName = ''; // Template-driven form

  ngOnInit() {
    this.loadLists();
  }

  loadLists() {
    this.linkService.getMyLists().subscribe({
      next: (data) => {
        this.lists.set(data);
        for (const list of data) {
          this.socialService.getVoteStats('LIST', list.id).subscribe({
            next: (stats) => this.voteStatsMap.update(m => ({ ...m, [list.id]: stats })),
            error: (err: Error) => console.error('Failed to load vote stats:', err.message)
          });
        }
      },
      error: (err: Error) => console.error('Failed to load lists:', err.message)
    });
  }

  goToList(id: string) {
    this.router.navigate(['/lists', id]);
  }

  private sanitize(input: string): string {
    // Strip HTML tags using character iteration (avoids regex backtracking — S5852)
    let result = '';
    let inTag = false;
    for (const ch of input) {
      if (ch === '<') {
        inTag = true;
      } else if (ch === '>') {
        inTag = false;
      } else if (!inTag) {
        result += ch;
      }
    }
    return result.trim();
  }

  createList() {
    const cleanName = this.sanitize(this.newListName);
    if (!cleanName) return;
    
    this.linkService.createList(cleanName).subscribe(newList => {
      this.lists.update(lists => [...lists, newList]);
      this.newListName = '';
    });
  }

  togglePublish(list: LinkList) {
    const action = list.published ? 'unpublish' : 'publish';
    const confirmKey = list.published ? 'myLists.confirmUnpublish' : 'myLists.confirmPublish';
    const conf = globalThis.confirm(this.i18n.t(confirmKey, { name: list.name }));
    if (!conf) return;

    this.linkService.updateList(list.id, { published: !list.published }).subscribe(updated => {
      this.lists.update(lists => lists.map(l => l.id === updated.id ? updated : l));
    });
  }

  deleteList(list: LinkList) {
    const conf = globalThis.confirm(this.i18n.t('myLists.confirmDelete', { name: list.name }));
    if (!conf) return;

    this.linkService.deleteList(list.id).subscribe(() => {
      this.lists.update(lists => lists.filter(l => l.id !== list.id));
    });
  }
}
