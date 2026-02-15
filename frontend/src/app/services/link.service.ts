import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Link, LinkList, ListDetails } from '../models';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private http = inject(HttpClient);
  // GraphQL endpoint
  private apiUrl = 'http://localhost:8080/graphql';

  private query<T>(query: string, variables: any = {}): Observable<T> {
    return this.http.post<{ data: any, errors: any }>(this.apiUrl, { query, variables })
      .pipe(map(result => {
        if (result.errors) {
            console.error(result.errors);
            throw new Error(result.errors[0].message);
        }
        return result.data;
      }));
  }

  getPublishedLists(): Observable<LinkList[]> {
    const q = `query { publishedLists { id name owner published createdAt linkIds } }`;
    return this.query<{ publishedLists: LinkList[] }>(q).pipe(map(d => d.publishedLists));
  }

  getMyLists(owner: string): Observable<LinkList[]> {
    const q = `query getMyLists($owner: String) { myLists(owner: $owner) { id name owner published createdAt linkIds } }`;
    return this.query<{ myLists: LinkList[] }>(q, { owner }).pipe(map(d => d.myLists));
  }

  getList(id: string): Observable<LinkList> {
    const q = `query getList($id: String) { list(id: $id) { id name owner published createdAt linkIds } }`;
    return this.query<{ list: LinkList }>(q, { id }).pipe(map(d => d.list));
  }
  
  getListDetails(id: string): Observable<ListDetails> {
    const q = `query getListDetails($id: String) { 
        listDetails(id: $id) { 
            list { id name owner published createdAt linkIds updatedAt } 
            links { id url title createdAt } 
        } 
    }`;
    return this.query<{ listDetails: ListDetails }>(q, { id }).pipe(map(d => d.listDetails));
  }

  createList(owner: string, name: string): Observable<LinkList> {
    const m = `mutation createList($owner: String, $name: String) { createList(owner: $owner, name: $name) { id name owner published } }`;
    return this.query<{ createList: LinkList }>(m, { owner, name }).pipe(map(d => d.createList));
  }

  updateList(id: string, updates: Partial<LinkList>): Observable<LinkList> {
    // Construct input object dynamically or use specific input type
    const input: any = {};
    if (updates.name !== undefined) input.name = updates.name;
    if (updates.published !== undefined) input.published = updates.published;
    if (updates.linkIds !== undefined) input.linkIds = updates.linkIds;

    const m = `mutation updateList($id: String, $input: UpdateListInput) { updateList(id: $id, input: $input) { id name owner published updatedAt linkIds } }`;
    return this.query<{ updateList: LinkList }>(m, { id, input }).pipe(map(d => d.updateList));
  }

  deleteList(id: string): Observable<void> {
    const m = `mutation deleteList($id: String) { deleteList(id: $id) }`;
    return this.query<{ deleteList: boolean }>(m, { id }).pipe(map(() => void 0));
  }

  addLinkToList(listId: string, owner: string, url: string, title: string): Observable<LinkList> {
    const m = `mutation addLinkToList($listId: String, $owner: String, $url: String, $title: String) { 
        addLinkToList(listId: $listId, owner: $owner, url: $url, title: $title) { id linkIds } 
    }`;
    return this.query<{ addLinkToList: LinkList }>(m, { listId, owner, url, title }).pipe(map(d => d.addLinkToList));
  }
}

