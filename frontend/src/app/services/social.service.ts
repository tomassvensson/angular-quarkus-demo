import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VoteStats, Comment, NotificationPage } from '../models';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/graphql'; // NOSONAR

  private query<T>(query: string, variables: Record<string, unknown> = {}): Observable<T> {
    return this.http.post<{ data: T; errors?: Array<{ message: string }> }>(
      this.apiUrl,
      { query, variables },
      { headers: { 'X-Requested-With': 'XMLHttpRequest' }, withCredentials: true }
    ).pipe(map(result => {
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      return result.data;
    }));
  }

  // ========== Voting ==========

  vote(entityType: string, entityId: string, rating: number): Observable<VoteStats> {
    const m = `mutation Vote($entityType: String!, $entityId: String!, $rating: Int!) {
      vote(entityType: $entityType, entityId: $entityId, rating: $rating) {
        averageRating voteCount userRating
      }
    }`;
    return this.query<{ vote: VoteStats }>(m, { entityType, entityId, rating })
      .pipe(map(d => d.vote));
  }

  getVoteStats(entityType: string, entityId: string): Observable<VoteStats> {
    const q = `query VoteStats($entityType: String!, $entityId: String!) {
      voteStats(entityType: $entityType, entityId: $entityId) {
        averageRating voteCount userRating
      }
    }`;
    return this.query<{ voteStats: VoteStats }>(q, { entityType, entityId })
      .pipe(map(d => d.voteStats));
  }

  // ========== Comments ==========

  getComments(entityType: string, entityId: string): Observable<Comment[]> {
    const q = `query Comments($entityType: String!, $entityId: String!) {
      comments(entityType: $entityType, entityId: $entityId) {
        id entityType entityId userId content parentId createdAt updatedAt
        replies { id entityType entityId userId content parentId createdAt updatedAt }
      }
    }`;
    return this.query<{ comments: Comment[] }>(q, { entityType, entityId })
      .pipe(map(d => d.comments));
  }

  addComment(entityType: string, entityId: string, content: string): Observable<Comment> {
    const m = `mutation AddComment($entityType: String!, $entityId: String!, $content: String!) {
      addComment(entityType: $entityType, entityId: $entityId, content: $content) {
        id entityType entityId userId content parentId createdAt updatedAt
      }
    }`;
    return this.query<{ addComment: Comment }>(m, { entityType, entityId, content })
      .pipe(map(d => d.addComment));
  }

  addReply(commentId: string, content: string): Observable<Comment> {
    const m = `mutation AddReply($commentId: String!, $content: String!) {
      addReply(commentId: $commentId, content: $content) {
        id entityType entityId userId content parentId createdAt updatedAt
      }
    }`;
    return this.query<{ addReply: Comment }>(m, { commentId, content })
      .pipe(map(d => d.addReply));
  }

  deleteComment(commentId: string): Observable<boolean> {
    const m = `mutation DeleteComment($commentId: String!) {
      deleteComment(commentId: $commentId)
    }`;
    return this.query<{ deleteComment: boolean }>(m, { commentId })
      .pipe(map(d => d.deleteComment));
  }

  editComment(commentId: string, content: string): Observable<Comment> {
    const m = `mutation EditComment($commentId: String!, $content: String!) {
      editComment(commentId: $commentId, content: $content) {
        id entityType entityId userId content parentId createdAt updatedAt
      }
    }`;
    return this.query<{ editComment: Comment }>(m, { commentId, content })
      .pipe(map(d => d.editComment));
  }

  // ========== Notifications ==========

  getNotifications(page = 0, size = 20): Observable<NotificationPage> {
    const q = `query Notifications($page: Int, $size: Int) {
      notifications(page: $page, size: $size) {
        items {
          id userId type entityType entityId actorUsername preview read targetId createdAt
        }
        total unreadCount
      }
    }`;
    return this.query<{ notifications: NotificationPage }>(q, { page, size })
      .pipe(map(d => d.notifications));
  }

  getUnreadCount(): Observable<number> {
    const q = `query { unreadNotificationCount }`;
    return this.query<{ unreadNotificationCount: number }>(q)
      .pipe(map(d => d.unreadNotificationCount));
  }

  markNotificationRead(id: string): Observable<boolean> {
    const m = `mutation MarkRead($id: String!) {
      markNotificationRead(id: $id)
    }`;
    return this.query<{ markNotificationRead: boolean }>(m, { id })
      .pipe(map(d => d.markNotificationRead));
  }

  markAllNotificationsRead(): Observable<boolean> {
    const m = `mutation { markAllNotificationsRead }`;
    return this.query<{ markAllNotificationsRead: boolean }>(m)
      .pipe(map(d => d.markAllNotificationsRead));
  }

  // ========== README ==========

  getReadme(): Observable<string> {
    return this.http.get('http://localhost:8080/api/v1/readme', { // NOSONAR
      responseType: 'text',
      withCredentials: true
    });
  }
}
