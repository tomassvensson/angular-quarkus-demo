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
