import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LinkService } from './link.service';

describe('LinkService', () => {
  let service: LinkService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/v1/graphql'; // NOSONAR

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LinkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch published lists page', () => {
    const mockItems = [{ id: '1', name: 'Public', owner: 'alice', published: true, linkIds: [], createdAt: '' }];
    const mockPage = { items: mockItems, page: 0, size: 10, total: 1 };

    service.getPublishedLists(0, 10).subscribe((page) => {
      expect(page).toEqual(mockPage);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.query).toContain('publishedLists');
    req.flush({ data: { publishedLists: mockPage } });
  });

  it('should fetch my lists', () => {
    const mockLists = [{ id: '2', name: 'Mine', owner: 'me', published: false, linkIds: ['l1'], createdAt: '' }];

    service.getMyLists().subscribe((lists) => {
      expect(lists).toEqual(mockLists);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('myLists');
    req.flush({ data: { myLists: mockLists } });
  });

  it('should fetch a single list', () => {
    const mockList = { id: '1', name: 'Test', owner: 'me', published: false, linkIds: [], createdAt: '' };

    service.getList('1').subscribe((list) => {
      expect(list.id).toBe('1');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.variables).toEqual({ id: '1' });
    req.flush({ data: { list: mockList } });
  });

  it('should fetch list details', () => {
    const mockDetails = {
      list: { id: '1', name: 'Test', owner: 'me', published: false, linkIds: ['l1'], createdAt: '', updatedAt: '' },
      links: [{ id: 'l1', url: 'http://example.com', title: 'Example', createdAt: '' }]
    };

    service.getListDetails('1').subscribe((details) => {
      expect(details.list.id).toBe('1');
      expect(details.links.length).toBe(1);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.variables).toEqual({ id: '1' });
    req.flush({ data: { listDetails: mockDetails } });
  });

  it('should create a list', () => {
    const newList = { id: '3', name: 'New', owner: 'me', published: false, linkIds: [] };

    service.createList('New').subscribe((list) => {
      expect(list.name).toBe('New');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.variables).toEqual({ name: 'New' });
    req.flush({ data: { createList: newList } });
  });

  it('should update a list', () => {
    const updated = { id: '1', name: 'Updated', owner: 'me', published: true, linkIds: [], updatedAt: '' };

    service.updateList('1', { name: 'Updated', published: true }).subscribe((list) => {
      expect(list.name).toBe('Updated');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.variables.id).toBe('1');
    expect(req.request.body.variables.name).toBe('Updated');
    req.flush({ data: { updateList: updated } });
  });

  it('should delete a list', () => {
    service.deleteList('1').subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.variables).toEqual({ id: '1' });
    req.flush({ data: { deleteList: true } });
  });

  it('should add a link to a list', () => {
    const updated = { id: '1', linkIds: ['l1', 'l2'] };

    service.addLinkToList('1', 'https://new.com', 'New Link').subscribe((list) => {
      expect(list.linkIds.length).toBe(2);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.variables).toEqual({ listId: '1', url: 'https://new.com', title: 'New Link' });
    req.flush({ data: { addLinkToList: updated } });
  });

  it('should get me', () => {
    service.getMe().subscribe((me) => {
      expect(me.username).toBe('alice');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.query).toContain('me');
    req.flush({ data: { me: { username: 'alice' } } });
  });

  it('should throw on GraphQL errors', () => {
    service.getMyLists().subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Something went wrong');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush({ errors: [{ message: 'Something went wrong' }] });
  });
});
