import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LinkService } from '../services/link.service';
import { SocialService } from '../services/social.service';
import { LinkList, Link, VoteStats } from '../models';
import { StarRatingComponent } from '../components/star-rating.component';
import { CommentsSectionComponent } from '../components/comments-section.component';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-list-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, StarRatingComponent, CommentsSectionComponent],
  template: `
    <div class="p-4">
      @if (list(); as l) {
        <div class="mb-6 border-b pb-4">
          <div class="flex justify-between items-center mb-2">
            @if (isOwner(l) && editingName) {
                <div class="flex gap-2">
                    <input [(ngModel)]="editNameValue" class="border p-1 rounded" />
                    <button (click)="saveName()" class="bg-blue-500 text-white px-2 rounded cursor-pointer">{{ i18n.t('listDetail.save') }}</button>
                    <button (click)="cancelEditName()" class="text-gray-500 px-2 cursor-pointer">{{ i18n.t('listDetail.cancel') }}</button>
                </div>
            } @else {
                <h1 class="text-2xl font-bold flex items-center gap-2">
                    {{ l.name }}
                    @if (isOwner(l)) {
                        <button (click)="startEditName(l)" class="text-sm text-blue-500 font-normal border px-1 rounded hover:bg-gray-100 cursor-pointer">
                            {{ i18n.t('listDetail.editName') }}
                        </button>
                    }
                </h1>
            }
             <div class="flex gap-2">
                 @if (isOwner(l)) {
                    @if (l.published) {
                        <button (click)="togglePublish(l)" class="bg-yellow-500 text-white px-3 py-1 rounded cursor-pointer">{{ i18n.t('myLists.unpublish') }}</button>
                    } @else {
                        <button (click)="togglePublish(l)" class="bg-green-500 text-white px-3 py-1 rounded cursor-pointer">{{ i18n.t('myLists.publish') }}</button>
                    }
                 }
                 <a routerLink="/my-lists" class="underline self-center ml-4 cursor-pointer" style="color: var(--color-text-muted)">{{ i18n.t('listDetail.myLists') }}</a>
             </div>
          </div>
          
          <div class="text-sm" style="color: var(--color-text-muted)">
            {{ i18n.t('listDetail.owner') }}: {{ l.owner }} | 
            {{ i18n.t('listDetail.created') }}: {{ l.createdAt | date:'medium' }} | 
            {{ i18n.t('listDetail.lastEdited') }}: {{ l.updatedAt | date:'medium' }} |
            {{ i18n.t('listDetail.count') }}: {{ links().length }}
          </div>
          @if (listVoteStats(); as vs) {
            <div class="mt-2">
              <app-star-rating
                [averageRating]="vs.averageRating"
                [voteCount]="vs.voteCount"
                [userRating]="vs.userRating"
                [interactive]="!!currentUser()"
                (rated)="onVoteList($event)" />
            </div>
          }
        </div>

        @if (isOwner(l)) {
          <div class="mb-4 p-4 rounded border" [style.background]="'var(--color-row-even)'">
            <h3 class="font-bold mb-2">{{ i18n.t('listDetail.addNewLink') }}</h3>
            <div class="flex gap-2 flex-wrap">
              <input [(ngModel)]="newLinkUrl" [placeholder]="i18n.t('listDetail.urlPlaceholder')" class="border p-2 rounded flex-1" />
              <input [(ngModel)]="newLinkTitle" [placeholder]="i18n.t('listDetail.titlePlaceholder')" class="border p-2 rounded flex-1" />
              <button (click)="addLink()" class="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">{{ i18n.t('listDetail.addLink') }}</button>
            </div>
          </div>
        }

        <div class="grid gap-2">
          @for (link of links(); track link.id) {
            <div class="border p-3 rounded flex justify-between items-center" [style.background]="'var(--color-card-bg)'">
              <div class="flex-1">
                <a [href]="link.url" target="_blank" class="font-medium hover:underline text-lg cursor-pointer" style="color: var(--color-link)">
                  {{ link.title }}
                </a>
                <div class="text-xs" style="color: var(--color-text-muted)">
                    {{ link.url }} <span class="mx-1">•</span> Added: {{ link.createdAt | date:'short' }}
                </div>
                @if (linkVoteStats()[link.id]; as lvs) {
                  <div class="mt-1">
                    <app-star-rating
                      [averageRating]="lvs.averageRating"
                      [voteCount]="lvs.voteCount"
                      [userRating]="lvs.userRating"
                      [interactive]="!!currentUser()"
                      (rated)="onVoteLink(link.id, $event)" />
                  </div>
                }
              </div>
              @if (isOwner(l)) {
                <button (click)="removeLink(link)" class="text-red-500 hover:text-red-700 cursor-pointer">
                  {{ i18n.t('listDetail.remove') }}
                </button>
              }
            </div>
          } @empty {
            <p style="color: var(--color-text-muted)">{{ i18n.t('listDetail.noLinks') }}</p>
          }
        </div>

        <app-comments-section
          entityType="LIST"
          [entityId]="l.id"
          [currentUser]="currentUser()"
          [entityOwner]="l.owner"
          [isAdmin]="isAdmin()" />

      } @else {
        <p>{{ i18n.t('listDetail.loading') }}</p>
      }
    </div>
  `
})
export class ListDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly linkService = inject(LinkService);
  private readonly socialService = inject(SocialService);
  protected readonly i18n = inject(I18nService);

  readonly currentUser = signal<string>('');
  readonly isAdmin = signal(false);

  readonly list = signal<LinkList | null>(null);
  readonly links = signal<Link[]>([]);
  readonly listVoteStats = signal<VoteStats | null>(null);
  readonly linkVoteStats = signal<Record<string, VoteStats>>({});
  
  newLinkUrl = '';
  newLinkTitle = '';
  
  editingName = false;
  editNameValue = '';

  ngOnInit() {
    this.linkService.getMe().subscribe({
      next: (user) => {
        this.currentUser.set(user.username);
        this.isAdmin.set(user.roles?.includes('admin') || user.roles?.includes('AdminUser') || false);
      },
      error: (err: Error) => console.error('Failed to get current user:', err.message)
    });
    this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) this.loadList(id);
    });
  }

  loadList(id: string) {
    this.linkService.getListDetails(id).subscribe({
        next: (data) => {
            this.list.set(data.list);
            this.links.set(data.links);
            this.loadListVoteStats(data.list.id);
            for (const link of data.links) {
              this.loadLinkVoteStats(link.id);
            }
        },
        error: () => {
            this.router.navigate(['/my-lists']);
        }
    });
  }

  isOwner(l: LinkList): boolean {
    return l.owner === this.currentUser();
  }

  startEditName(l: LinkList) {
    this.editingName = true;
    this.editNameValue = l.name;
  }
  
  cancelEditName() {
    this.editingName = false;
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

  saveName() {
    const l = this.list();
    const cleanName = this.sanitize(this.editNameValue);
    
    if (!l || !cleanName) return;

    // Requirement 2e: Confirm on update? Prompt says "actions on lists... Publish, Unpublish, Delete".
    // 2g says "The owner can edit the list including its name".
    // It says "For these three actions (Publish, Unpublish, Delete)... confirm".
    // Editing name doesn't require confirmation per spec, usually. 
    
    this.linkService.updateList(l.id, { name: cleanName }).subscribe(updated => {
        this.list.update(curr => curr ? ({ ...curr, name: updated.name, updatedAt: updated.updatedAt }) : null);
        this.editingName = false;
    });
  }

  togglePublish(l: LinkList) {
    const action = l.published ? 'unpublish' : 'publish';
    const confirmKey = l.published ? 'myLists.confirmUnpublish' : 'myLists.confirmPublish';
    const conf = globalThis.confirm(this.i18n.t(confirmKey, { name: l.name }));
    if (!conf) return;
    
    this.linkService.updateList(l.id, { published: !l.published }).subscribe(updated => {
        this.list.update(curr => curr ? ({ ...curr, published: updated.published, updatedAt: updated.updatedAt }) : null);
    });
  }

  addLink() {
    const l = this.list();
    const cleanTitle = this.sanitize(this.newLinkTitle);
    let cleanUrl = this.newLinkUrl.trim();
    
    if (!l || !cleanUrl || !cleanTitle) return;

    // Auto-prepend https:// if no protocol is given
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//u.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Validate the URL structure
    try {
        const parsed = new URL(cleanUrl);
        // Only allow http/https/ftp protocols
        const allowedProtocols = ['http:', 'https:', 'ftp:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
          globalThis.alert(this.i18n.t('validation.protocolNotAllowed'));
          return;
        }
        // Ensure the hostname has at least one dot (e.g. example.com) or is localhost
        if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
          globalThis.alert(this.i18n.t('validation.invalidDomain'));
          return;
        }
    } catch {
        globalThis.alert(this.i18n.t('validation.invalidUrl'));
        return;
    }

    this.linkService.addLinkToList(l.id, cleanUrl, cleanTitle).subscribe(updatedList => {
        // Refresh details or push link manually. API returns list.
        // We need the link object. For simplicity let's reload or assume API returns link?
        // My API addLinkToList currently returns LinkList.
        // I should reload details to get the Link objects
        this.loadList(l.id);
        this.newLinkUrl = '';
        this.newLinkTitle = '';
    });
  }

  removeLink(link: Link) {
    const l = this.list();
    if (!l) return;
    
    // We didn't explicitly specify list item removal API.
    // The requirement: "Owner can ... add or remove URLs".
    // I implemented add (via createLink+UpdateList or AddLinkToList).
    // UpdateList takes linkIds. So I can remove ID from list.
    
    // Spec says: "Confirmation question including the name of the list" for (Publish, Unpublish, Delete List).
    // Removing link probably doesn't strictly need it, but let's be safe or just do it.
    
    const newIds = l.linkIds.filter(id => id !== link.id);
    this.linkService.updateList(l.id, { linkIds: newIds }).subscribe(updated => {
        this.list.set(updated);
        this.links.update(current => current.filter(x => x.id !== link.id));
    });
  }

  onVoteList(rating: number) {
    const l = this.list();
    if (!l) return;
    this.socialService.vote('LIST', l.id, rating).subscribe({
      next: (stats) => this.listVoteStats.set(stats),
      error: (err: Error) => console.error('Failed to vote on list:', err.message)
    });
  }

  onVoteLink(linkId: string, rating: number) {
    this.socialService.vote('LINK', linkId, rating).subscribe({
      next: (stats) => this.linkVoteStats.update(current => ({ ...current, [linkId]: stats })),
      error: (err: Error) => console.error('Failed to vote on link:', err.message)
    });
  }

  private loadListVoteStats(listId: string): void {
    this.socialService.getVoteStats('LIST', listId).subscribe({
      next: (stats) => this.listVoteStats.set(stats),
      error: (err: Error) => console.error('Failed to load list vote stats:', err.message)
    });
  }

  private loadLinkVoteStats(linkId: string): void {
    this.socialService.getVoteStats('LINK', linkId).subscribe({
      next: (stats) => this.linkVoteStats.update(current => ({ ...current, [linkId]: stats })),
      error: (err: Error) => console.error('Failed to load link vote stats:', err.message)
    });
  }
}
