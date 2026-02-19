import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LinkService } from '../services/link.service';
import { LinkList, Link } from '../models';

@Component({
  selector: 'app-list-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4">
      @if (list(); as l) {
        <div class="mb-6 border-b pb-4">
          <div class="flex justify-between items-center mb-2">
            @if (isOwner(l) && editingName) {
                <div class="flex gap-2">
                    <input [(ngModel)]="editNameValue" class="border p-1 rounded" />
                    <button (click)="saveName()" class="bg-blue-500 text-white px-2 rounded cursor-pointer">Save</button>
                    <button (click)="cancelEditName()" class="text-gray-500 px-2 cursor-pointer">Cancel</button>
                </div>
            } @else {
                <h1 class="text-2xl font-bold flex items-center gap-2">
                    {{ l.name }}
                    @if (isOwner(l)) {
                        <button (click)="startEditName(l)" class="text-sm text-blue-500 font-normal border px-1 rounded hover:bg-gray-100 cursor-pointer">
                            Edit Name
                        </button>
                    }
                </h1>
            }
             <div class="flex gap-2">
                 @if (isOwner(l)) {
                    @if (l.published) {
                        <button (click)="togglePublish(l)" class="bg-yellow-500 text-white px-3 py-1 rounded cursor-pointer">Unpublish</button>
                    } @else {
                        <button (click)="togglePublish(l)" class="bg-green-500 text-white px-3 py-1 rounded cursor-pointer">Publish</button>
                    }
                 }
                 <a routerLink="/my-lists" class="text-gray-600 underline self-center ml-4 cursor-pointer">My Lists</a>
             </div>
          </div>
          
          <div class="text-sm text-gray-600">
            Owner: {{ l.owner }} | 
            Created: {{ l.createdAt | date:'medium' }} | 
            Last Edited: {{ l.updatedAt | date:'medium' }} |
            Count: {{ links().length }}
          </div>
        </div>

        @if (isOwner(l)) {
          <div class="mb-4 bg-gray-50 p-4 rounded border">
            <h3 class="font-bold mb-2">Add New Link</h3>
            <div class="flex gap-2 flex-wrap">
              <input [(ngModel)]="newLinkUrl" placeholder="URL (https://...)" class="border p-2 rounded flex-1" />
              <input [(ngModel)]="newLinkTitle" placeholder="Title" class="border p-2 rounded flex-1" />
              <button (click)="addLink()" class="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">Add Link</button>
            </div>
          </div>
        }

        <div class="grid gap-2">
          @for (link of links(); track link.id) {
            <div class="border p-3 rounded hover:bg-gray-50 flex justify-between items-center bg-white">
              <div>
                <a [href]="link.url" target="_blank" class="text-blue-600 font-medium hover:underline text-lg cursor-pointer">
                  {{ link.title }}
                </a>
                <div class="text-xs text-gray-400">
                    {{ link.url }} <span class="mx-1">•</span> Added: {{ link.createdAt | date:'short' }}
                </div>
              </div>
              @if (isOwner(l)) {
                <button (click)="removeLink(link)" class="text-red-500 hover:text-red-700 cursor-pointer">
                  Remove
                </button>
              }
            </div>
          } @empty {
            <p class="text-gray-500">No links in this list yet.</p>
          }
        </div>

      } @else {
        <p>Loading...</p>
      }
    </div>
  `
})
export class ListDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly linkService = inject(LinkService);

  readonly currentUser = signal<string>('');

  readonly list = signal<LinkList | null>(null);
  readonly links = signal<Link[]>([]);
  
  newLinkUrl = '';
  newLinkTitle = '';
  
  editingName = false;
  editNameValue = '';

  ngOnInit() {
    this.linkService.getMe().subscribe(user => {
      this.currentUser.set(user.username);
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
    // Strip HTML tags first, then any remaining angle brackets
    return input.replaceAll(/<[^>]*>/g, '').replaceAll(/[<>]/g, '').trim();
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
    const conf = globalThis.confirm(`Are you sure you want to ${action} the list "${l.name}"?`);
    if (!conf) return;
    
    this.linkService.updateList(l.id, { published: !l.published }).subscribe(updated => {
        this.list.update(curr => curr ? ({ ...curr, published: updated.published, updatedAt: updated.updatedAt }) : null);
    });
  }

  addLink() {
    const l = this.list();
    const cleanTitle = this.sanitize(this.newLinkTitle);
    const cleanUrl = this.newLinkUrl.trim();
    
    if (!l || !cleanUrl || !cleanTitle) return;

    // Basic URL validation
    try {
        new URL(cleanUrl);
    } catch {
        globalThis.alert('Please enter a valid URL (e.g. https://example.com)');
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
}
