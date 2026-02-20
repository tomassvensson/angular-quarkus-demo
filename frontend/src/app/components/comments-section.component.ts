import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService } from '../services/social.service';
import { Comment } from '../models';

@Component({
  selector: 'app-comments-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="comments-section">
      <h3 class="comments-title">Comments</h3>

      @if (!hasUserComment() && currentUser()) {
        <div class="add-comment">
          <textarea
            [(ngModel)]="newCommentText"
            placeholder="Write your comment..."
            class="comment-input"
            rows="3"
            [attr.aria-label]="'Write a comment'"></textarea>
          <button (click)="submitComment()" class="comment-submit-btn" [disabled]="!newCommentText.trim()">
            Post Comment
          </button>
        </div>
      }

      @for (comment of comments(); track comment.id) {
        <div class="comment-card">
          <div class="comment-header">
            <strong>{{ comment.userId }}</strong>
            <span class="comment-date">{{ comment.createdAt | date:'medium' }}</span>
            @if (canDelete(comment)) {
              <button (click)="onDeleteComment(comment)" class="delete-btn" aria-label="Delete comment">
                &#10005;
              </button>
            }
          </div>
          <div class="comment-body">{{ comment.content }}</div>

          @if (comment.replies.length) {
            <div class="replies">
              @for (reply of comment.replies; track reply.id) {
                <div class="reply-card">
                  <div class="comment-header">
                    <strong>{{ reply.userId }}</strong>
                    <span class="comment-date">{{ reply.createdAt | date:'medium' }}</span>
                    @if (canDelete(reply)) {
                      <button (click)="onDeleteComment(reply)" class="delete-btn" aria-label="Delete reply">
                        &#10005;
                      </button>
                    }
                  </div>
                  <div class="comment-body">{{ reply.content }}</div>
                </div>
              }
            </div>
          }

          @if (canReply(comment)) {
            @if (replyingTo() === comment.id) {
              <div class="reply-form">
                <textarea
                  [(ngModel)]="replyText"
                  placeholder="Write a reply..."
                  class="comment-input reply-input"
                  rows="2"
                  [attr.aria-label]="'Reply to comment by ' + comment.userId"></textarea>
                <div class="reply-actions">
                  <button (click)="submitReply(comment.id)" class="comment-submit-btn" [disabled]="!replyText.trim()">
                    Reply
                  </button>
                  <button (click)="cancelReply()" class="cancel-btn">Cancel</button>
                </div>
              </div>
            } @else {
              <button (click)="startReply(comment.id)" class="reply-trigger-btn">Reply</button>
            }
          }
        </div>
      } @empty {
        <p class="no-comments">No comments yet. Be the first to comment!</p>
      }
    </div>
  `,
  styles: [`
    .comments-section { margin-top: 1.5rem; }
    .comments-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 0.75rem;
      border-bottom: 2px solid #dbeafe;
      padding-bottom: 0.5rem;
    }
    .add-comment { margin-bottom: 1rem; }
    .comment-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      font-family: inherit;
      resize: vertical;
    }
    .reply-input { font-size: 0.9rem; }
    .comment-submit-btn {
      margin-top: 0.5rem;
      padding: 0.4rem 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.4rem;
      cursor: pointer;
      font-weight: 600;
    }
    .comment-submit-btn:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }
    .comment-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      background: #f8fafc;
    }
    .comment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
      font-size: 0.85rem;
    }
    .comment-date { color: #6b7280; font-size: 0.8rem; }
    .comment-body { color: #374151; line-height: 1.5; }
    .delete-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 0.3rem;
    }
    .delete-btn:hover { color: #b91c1c; }
    .replies {
      margin-left: 1.5rem;
      margin-top: 0.5rem;
      border-left: 2px solid #dbeafe;
      padding-left: 0.75rem;
    }
    .reply-card {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: #eff6ff;
      border-radius: 0.4rem;
    }
    .reply-form { margin-top: 0.5rem; }
    .reply-actions { display: flex; gap: 0.5rem; margin-top: 0.35rem; }
    .cancel-btn {
      padding: 0.4rem 0.75rem;
      background: #e5e7eb;
      border: none;
      border-radius: 0.4rem;
      cursor: pointer;
    }
    .reply-trigger-btn {
      margin-top: 0.4rem;
      background: none;
      border: none;
      color: #2563eb;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0;
    }
    .reply-trigger-btn:hover { text-decoration: underline; }
    .no-comments { color: #6b7280; font-style: italic; }
  `]
})
export class CommentsSectionComponent implements OnInit {
  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();
  readonly currentUser = input<string>('');
  readonly entityOwner = input<string>('');
  readonly isAdmin = input(false);
  readonly commentChanged = output<void>();

  private readonly socialService = inject(SocialService);

  readonly comments = signal<Comment[]>([]);
  readonly replyingTo = signal<string | null>(null);
  newCommentText = '';
  replyText = '';

  ngOnInit() {
    this.loadComments();
  }

  protected hasUserComment(): boolean {
    const user = this.currentUser();
    return this.comments().some(c => c.userId === user && !c.parentId);
  }

  protected canReply(comment: Comment): boolean {
    const user = this.currentUser();
    if (!user) return false;
    // Only entity owner or original poster can reply
    return user === this.entityOwner() || user === comment.userId || this.isAdmin();
  }

  protected canDelete(comment: Comment): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return comment.userId === user || this.isAdmin();
  }

  protected submitComment(): void {
    const content = this.newCommentText.trim();
    if (!content) return;

    this.socialService.addComment(this.entityType(), this.entityId(), content).subscribe({
      next: () => {
        this.newCommentText = '';
        this.loadComments();
        this.commentChanged.emit();
      },
      error: (err: Error) => console.error('Failed to add comment:', err.message)
    });
  }

  protected startReply(commentId: string): void {
    this.replyingTo.set(commentId);
    this.replyText = '';
  }

  protected cancelReply(): void {
    this.replyingTo.set(null);
    this.replyText = '';
  }

  protected submitReply(commentId: string): void {
    const content = this.replyText.trim();
    if (!content) return;

    this.socialService.addReply(commentId, content).subscribe({
      next: () => {
        this.replyText = '';
        this.replyingTo.set(null);
        this.loadComments();
        this.commentChanged.emit();
      },
      error: (err: Error) => console.error('Failed to add reply:', err.message)
    });
  }

  protected onDeleteComment(comment: Comment): void {
    if (!globalThis.confirm('Are you sure you want to delete this comment?')) return;

    this.socialService.deleteComment(comment.id).subscribe({
      next: () => {
        this.loadComments();
        this.commentChanged.emit();
      },
      error: (err: Error) => console.error('Failed to delete comment:', err.message)
    });
  }

  private loadComments(): void {
    this.socialService.getComments(this.entityType(), this.entityId()).subscribe({
      next: (comments) => this.comments.set(comments),
      error: (err: Error) => console.error('Failed to load comments:', err.message)
    });
  }
}
