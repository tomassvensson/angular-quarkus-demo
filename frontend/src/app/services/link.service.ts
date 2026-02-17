import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LinkList, ListDetails } from '../models';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private readonly http = inject(HttpClient);
  // GraphQL endpoint
  private readonly apiUrl = 'http://localhost:8080/api/v1/graphql'; // NOSONAR

  private query<T>(query: string, variables: any = {}): Observable<T> {
    return this.http.post<{ data: any, errors: any }>(this.apiUrl, { query, variables }, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      withCredentials: true
    })
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

  getMyLists(): Observable<LinkList[]> {
    const q = `query getMyLists { myLists { id name owner published createdAt linkIds } }`;
    return this.query<{ myLists: LinkList[] }>(q).pipe(map(d => d.myLists));
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

  createList(name: string): Observable<LinkList> {
    const m = `mutation createList($name: String) { createList(name: $name) { id name owner published linkIds } }`;
    return this.query<{ createList: LinkList }>(m, { name }).pipe(map(d => d.createList));
  }

  updateList(id: string, updates: Partial<LinkList>): Observable<LinkList> {
    const m = `mutation updateList($id: String, $name: String, $published: Boolean, $linkIds: [String]) { 
      updateList(id: $id, name: $name, published: $published, linkIds: $linkIds) { 
        id name owner published updatedAt linkIds 
      } 
    }`;
    return this.query<{ updateList: LinkList }>(m, { 
      id, 
      name: updates.name, 
      published: updates.published, 
      linkIds: updates.linkIds 
    }).pipe(map(d => d.updateList));
  }

  deleteList(id: string): Observable<void> {
    const m = `mutation deleteList($id: String) { deleteList(id: $id) }`;
    return this.query<{ deleteList: boolean }>(m, { id }).pipe(map(() => void 0));
  }

  addLinkToList(listId: string, url: string, title: string): Observable<LinkList> {
    const m = `mutation addLinkToList($listId: String, $url: String, $title: String) { 
        addLinkToList(listId: $listId, url: $url, title: $title) { id linkIds } 
    }`;
    return this.query<{ addLinkToList: LinkList }>(m, { listId, url, title }).pipe(map(d => d.addLinkToList));
  }

  getMe(): Observable<{ username: string }> {
    const q = `query { me { username } }`;
    return this.query<{ me: { username: string } }>(q).pipe(map(d => d.me));
  }
}

