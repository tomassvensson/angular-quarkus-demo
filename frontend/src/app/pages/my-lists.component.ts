import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LinkService } from '../services/link.service';
import { LinkList } from '../models';

@Component({
  selector: 'app-my-lists',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">My Lists</h1>
      
      <div class="mb-6 flex gap-2">
        <input 
          [(ngModel)]="newListName" 
          placeholder="New List Name" 
          class="border p-2 rounded"
          (keyup.enter)="createList()"
        />
        <button (click)="createList()" class="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
          Create List
        </button>
      </div>

      <div class="grid gap-4">
        @for (list of lists(); track list.id) {
          <div 
             class="border p-4 rounded shadow bg-white hover:bg-gray-50 cursor-pointer transition-colors"
             (click)="goToList(list.id)"
          >
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-semibold text-blue-600 hover:underline">
                    {{ list.name }}
                </h2>
                <div class="text-sm text-gray-500">
                  Created: {{ list.createdAt | date:'short' }} |
                  Published: {{ list.published ? 'Yes' : 'No' }} |
                  Links: {{ list.linkIds.length || 0 }}
                </div>
              </div>
              <div class="flex gap-2" (click)="$event.stopPropagation()">
                @if (list.published) {
                  <button (click)="togglePublish(list)" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-yellow-600">
                    Unpublish
                  </button>
                } @else {
                  <button (click)="togglePublish(list)" class="bg-green-500 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-green-600">
                    Publish
                  </button>
                }
                <button (click)="deleteList(list)" class="bg-red-500 text-white px-2 py-1 rounded text-sm cursor-pointer hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <p class="text-gray-500">No lists found. Create one above.</p>
        }
      </div>
      
       <div class="mt-8">
        <a routerLink="/public-lists" class="text-blue-600 underline">View Public Lists</a>
      </div>
    </div>
  `
})
export class MyListsComponent implements OnInit {
  private readonly linkService = inject(LinkService);
  private readonly router = inject(Router);
  
  readonly lists = signal<LinkList[]>([]);
  newListName = ''; // Template-driven form

  ngOnInit() {
    this.loadLists();
  }

  loadLists() {
    this.linkService.getMyLists().subscribe(data => {
      this.lists.set(data);
    });
  }

  goToList(id: string) {
    this.router.navigate(['/lists', id]);
  }

  private sanitize(input: string): string {
    // Remove angle brackets to prevent any HTML-like content; then trim whitespace.
    return input.replace(/[<>]/g, '').trim();
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
    const conf = globalThis.confirm(`Are you sure you want to ${action} the list "${list.name}"?`);
    if (!conf) return;

    this.linkService.updateList(list.id, { published: !list.published }).subscribe(updated => {
      this.lists.update(lists => lists.map(l => l.id === updated.id ? updated : l));
    });
  }

  deleteList(list: LinkList) {
    const conf = globalThis.confirm(`Are you sure you want to delete the list "${list.name}"?`);
    if (!conf) return;

    this.linkService.deleteList(list.id).subscribe(() => {
      this.lists.update(lists => lists.filter(l => l.id !== list.id));
    });
  }
}
