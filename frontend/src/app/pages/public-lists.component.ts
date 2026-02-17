import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LinkService } from '../services/link.service';
import { LinkList } from '../models';

@Component({
  selector: 'app-public-lists',
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
       <div class="mt-8">
        <a routerLink="/my-lists" class="text-blue-600 underline">Back to My Lists</a>
      </div>
    </div>
  `
})
export class PublicListsComponent implements OnInit {
  private readonly linkService = inject(LinkService);
  readonly lists = signal<LinkList[]>([]);

  ngOnInit() {
    this.linkService.getPublishedLists().subscribe(data => {
      this.lists.set(data);
    });
  }
}
