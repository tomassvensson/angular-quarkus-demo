import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SocialService } from './social.service';

describe('SocialService', () => {
  let service: SocialService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/v1/graphql'; // NOSONAR
  const readmeUrl = 'http://localhost:8080/api/v1/readme'; // NOSONAR

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SocialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Voting ---

  it('should vote on an entity', () => {
    const mockResult = { averageRating: 4.5, voteCount: 2, userRating: 5 };

    service.vote('LIST', 'list1', 5).subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.query).toContain('vote');
    req.flush({ data: { vote: mockResult } });
  });

  it('should get vote stats', () => {
    const mockResult = { averageRating: 3.7, voteCount: 10, userRating: 4 };

    service.getVoteStats('LIST', 'list1').subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('voteStats');
    req.flush({ data: { voteStats: mockResult } });
  });

  // --- Comments ---

  it('should get comments', () => {
    const mockComments = [{ id: 'c1', userId: 'user1', content: 'Test', replies: [] }];

    service.getComments('LIST', 'list1').subscribe((result) => {
      expect(result).toEqual(mockComments);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('comments');
    req.flush({ data: { comments: mockComments } });
  });

  it('should add a comment', () => {
    const mockComment = { id: 'c1', userId: 'user1', content: 'New comment' };

    service.addComment('LIST', 'list1', 'New comment').subscribe((result) => {
      expect(result.id).toBe('c1');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('addComment');
    req.flush({ data: { addComment: mockComment } });
  });

  it('should add a reply', () => {
    const mockReply = { id: 'r1', userId: 'user2', content: 'Reply', parentId: 'c1' };

    service.addReply('c1', 'Reply').subscribe((result) => {
      expect(result.id).toBe('r1');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('addReply');
    req.flush({ data: { addReply: mockReply } });
  });

  it('should delete a comment', () => {
    service.deleteComment('c1').subscribe((result) => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('deleteComment');
    req.flush({ data: { deleteComment: true } });
  });

  // --- Notifications ---

  it('should get notifications', () => {
    const mockPage = { items: [{ id: 'n1' }], total: 1, unreadCount: 1 };

    service.getNotifications(0, 20).subscribe((result) => {
      expect(result.total).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('notifications');
    req.flush({ data: { notifications: mockPage } });
  });

  it('should get unread count', () => {
    service.getUnreadCount().subscribe((result) => {
      expect(result).toBe(3);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('unreadNotificationCount');
    req.flush({ data: { unreadNotificationCount: 3 } });
  });

  it('should mark notification as read', () => {
    service.markNotificationRead('n1').subscribe((result) => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('markNotificationRead');
    req.flush({ data: { markNotificationRead: true } });
  });

  it('should mark all notifications as read', () => {
    service.markAllNotificationsRead().subscribe((result) => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('markAllNotificationsRead');
    req.flush({ data: { markAllNotificationsRead: true } });
  });

  // --- README ---

  it('should get readme content', () => {
    service.getReadme().subscribe((result) => {
      expect(result).toContain('# README');
    });

    const req = httpMock.expectOne(readmeUrl);
    expect(req.request.method).toBe('GET');
    req.flush('# README\nContent here');
  });

  // --- Error handling ---

  it('should throw on GraphQL errors', () => {
    service.getVoteStats('LIST', 'list1').subscribe({
      error: (err: Error) => {
        expect(err.message).toContain('Something went wrong');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush({ errors: [{ message: 'Something went wrong' }] });
  });
});
