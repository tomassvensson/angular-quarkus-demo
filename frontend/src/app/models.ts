export interface Link {
  id: string;
  owner: string;
  url: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LinkList {
  id: string;
  owner: string;
  name: string;
  published: boolean;
  linkIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ListDetails {
  list: LinkList;
  links: Link[];
}

export interface PublishedListsPage {
  items: LinkList[];
  page: number;
  size: number;
  total: number;
}

export interface VoteStats {
  averageRating: number;
  voteCount: number;
  userRating: number | null;
}

export interface RatingEntry {
  rating: number;
  count: number;
}

export interface VoteAnalytics {
  averageRating: number;
  voteCount: number;
  ratingDistribution: RatingEntry[];
  userRating: number | null;
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  actorUsername: string;
  preview: string;
  read: boolean;
  targetId: string;
  createdAt: string;
}

export interface NotificationPage {
  items: Notification[];
  total: number;
  unreadCount: number;
}
