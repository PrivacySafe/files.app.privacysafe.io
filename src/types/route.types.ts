export interface RouteSingle {
  name: 'single';
  params: {
    fsId: string;
    folderId: string;
  };
  query: {
    view?: 'table' | 'tile';
    path: string;
    path2?: string;
    activeWindow?: '1';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface RouteDouble {
  name: 'double';
  params: {
    fsId: string;
    folderId: string;
    fs2Id: string;
    folder2Id: string;
  };
  query: {
    view?: 'table' | 'tile';
    path: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    path2: string;
    sort2By?: string;
    sort2Order?: 'asc' | 'desc';
    activeWindow: '1' | '2';
  };
}
