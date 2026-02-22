import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService } from '../services/social.service';
import { Comment } from '../models';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-comments-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="comments-section">
      <h3 class="comments-title">{{ i18n.t('comments.title') }}</h3>

      @if (!hasUserComment() && currentUser()) {
        <div class="add-comment">
          <textarea
            [(ngModel)]="newCommentText"
            [placeholder]="i18n.t('comments.writePlaceholder')"
            class="comment-input"
            rows="3"
            [attr.aria-label]="i18n.t('a11y.writeComment')"></textarea>
          <button (click)="submitComment()" class="comment-submit-btn" [disabled]="!newCommentText.trim()">
            {{ i18n.t('comments.postComment') }}
          </button>
        </div>
      }

      @for (comment of comments(); track comment.id) {
        <div class="comment-card">
          <div class="comment-header">
            <strong>{{ comment.userId }}</strong>
            <span class="comment-date">{{ comment.createdAt | date:'medium' }}</span>
            @if (isEdited(comment)) {
              <span class="edited-badge">{{ i18n.t('comments.edited') }}</span>
            }
            @if (canEdit(comment)) {
              <button (click)="startEdit(comment)" class="edit-btn" [attr.aria-label]="i18n.t('comments.title')">&#9998;</button>
            }
            @if (canDelete(comment)) {
              <button (click)="onDeleteComment(comment)" class="delete-btn" [attr.aria-label]="i18n.t('common.delete')">
                &#10005;
              </button>
            }
          </div>
          @if (editingId() === comment.id) {
            <div class="edit-form">
              <textarea
                [(ngModel)]="editText"
                class="comment-input"
                rows="3"
                [attr.aria-label]="i18n.t('a11y.editComment')"></textarea>
              <div class="reply-actions">
                <button (click)="saveEdit(comment.id)" class="comment-submit-btn" [disabled]="!editText.trim()">{{ i18n.t('listDetail.save') }}</button>
                <button (click)="cancelEdit()" class="cancel-btn">{{ i18n.t('listDetail.cancel') }}</button>
              </div>
            </div>
          } @else {
            <div class="comment-body">{{ comment.content }}</div>
          }

          @if (comment.replies.length) {
            <div class="replies">
              @for (reply of comment.replies; track reply.id) {
                <div class="reply-card">
                  <div class="comment-header">
                    <strong>{{ reply.userId }}</strong>
                    <span class="comment-date">{{ reply.createdAt | date:'medium' }}</span>
                    @if (isEdited(reply)) {
                      <span class="edited-badge">{{ i18n.t('comments.edited') }}</span>
                    }
                    @if (canEdit(reply)) {
                      <button (click)="startEdit(reply)" class="edit-btn" [attr.aria-label]="i18n.t('comments.title')">&#9998;</button>
                    }
                    @if (canDelete(reply)) {
                      <button (click)="onDeleteComment(reply)" class="delete-btn" [attr.aria-label]="i18n.t('common.delete')">
                        &#10005;
                      </button>
                    }
                  </div>
                  @if (editingId() === reply.id) {
                    <div class="edit-form">
                      <textarea
                        [(ngModel)]="editText"
                        class="comment-input reply-input"
                        rows="2"
                        [attr.aria-label]="i18n.t('a11y.editReply')"></textarea>
                      <div class="reply-actions">
                        <button (click)="saveEdit(reply.id)" class="comment-submit-btn" [disabled]="!editText.trim()">{{ i18n.t('listDetail.save') }}</button>
                        <button (click)="cancelEdit()" class="cancel-btn">{{ i18n.t('listDetail.cancel') }}</button>
                      </div>
                    </div>
                  } @else {
                    <div class="comment-body">{{ reply.content }}</div>
                  }
                </div>
              }
            </div>
          }

          @if (canReply(comment)) {
            @if (replyingTo() === comment.id) {
              <div class="reply-form">
                <textarea
                  [(ngModel)]="replyText"
                  [placeholder]="i18n.t('comments.replyPlaceholder')"
                  class="comment-input reply-input"
                  rows="2"
                  [attr.aria-label]="i18n.t('a11y.replyTo', { user: comment.userId })"></textarea>
                <div class="reply-actions">
                  <button (click)="submitReply(comment.id)" class="comment-submit-btn" [disabled]="!replyText.trim()">
                    {{ i18n.t('comments.reply') }}
                  </button>
                  <button (click)="cancelReply()" class="cancel-btn">{{ i18n.t('comments.cancel') }}</button>
                </div>
              </div>
            } @else {
              <button (click)="startReply(comment.id)" class="reply-trigger-btn">{{ i18n.t('comments.reply') }}</button>
            }
          }
        </div>
      } @empty {
        <p class="no-comments">{{ i18n.t('comments.noComments') }}</p>
      }
    </div>
  `,
  styles: [`
    .comments-section { margin-top: 1.5rem; }
    .comments-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-btn-text);
      margin-bottom: 0.75rem;
      border-bottom: 2px solid var(--color-panel-border);
      padding-bottom: 0.5rem;
    }
    .add-comment { margin-bottom: 1rem; }
    .comment-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--color-input-border);
      border-radius: 0.4rem;
      font-family: inherit;
      resize: vertical;
      background: var(--color-input-bg);
      color: var(--color-text);
    }
    .reply-input { font-size: 0.9rem; }
    .comment-submit-btn {
      margin-top: 0.5rem;
      padding: 0.4rem 1rem;
      background: var(--color-link);
      color: white;
      border: none;
      border-radius: 0.4rem;
      cursor: pointer;
      font-weight: 600;
    }
    .comment-submit-btn:disabled {
      background: var(--color-input-border);
      cursor: not-allowed;
    }
    .comment-card {
      border: 1px solid var(--color-card-border);
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      background: var(--color-card-bg);
    }
    .comment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
      font-size: 0.85rem;
    }
    .comment-date { color: var(--color-text-muted); font-size: 0.8rem; }
    .comment-body { color: var(--color-text); line-height: 1.5; }
    .delete-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--color-error);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 0.3rem;
    }
    .delete-btn:hover { color: var(--color-error); }
    .replies {
      margin-left: 1.5rem;
      margin-top: 0.5rem;
      border-left: 2px solid var(--color-panel-border);
      padding-left: 0.75rem;
    }
    .reply-card {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: var(--color-row-even);
      border-radius: 0.4rem;
    }
    .reply-form { margin-top: 0.5rem; }
    .reply-actions { display: flex; gap: 0.5rem; margin-top: 0.35rem; }
    .cancel-btn {
      padding: 0.4rem 0.75rem;
      background: var(--color-card-border);
      border: none;
      border-radius: 0.4rem;
      cursor: pointer;
      color: var(--color-text);
    }
    .reply-trigger-btn {
      margin-top: 0.4rem;
      background: none;
      border: none;
      color: var(--color-link);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0;
    }
    .reply-trigger-btn:hover { text-decoration: underline; }
    .no-comments { color: var(--color-text-muted); font-style: italic; }
    .edit-btn {
      background: none;
      border: none;
      color: var(--color-link);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 0.3rem;
    }
    .edit-btn:hover { color: var(--color-link); }
    .edited-badge {
      color: var(--color-text-muted);
      font-size: 0.75rem;
      font-style: italic;
    }
    .edit-form { margin-top: 0.35rem; }
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
  protected readonly i18n = inject(I18nService);

  readonly comments = signal<Comment[]>([]);
  readonly replyingTo = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  newCommentText = '';
  replyText = '';
  editText = '';

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

  protected canEdit(comment: Comment): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return comment.userId === user;
  }

  protected isEdited(comment: Comment): boolean {
    return comment.updatedAt !== comment.createdAt;
  }

  protected startEdit(comment: Comment): void {
    this.editingId.set(comment.id);
    this.editText = comment.content;
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editText = '';
  }

  protected saveEdit(commentId: string): void {
    const content = this.editText.trim();
    if (!content) return;

    this.socialService.editComment(commentId, content).subscribe({
      next: () => {
        this.editingId.set(null);
        this.editText = '';
        this.loadComments();
        this.commentChanged.emit();
      },
      error: (err: Error) => console.error('Failed to edit comment:', err.message)
    });
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
    if (!globalThis.confirm(this.i18n.t('comments.deleteConfirm'))) return;

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
