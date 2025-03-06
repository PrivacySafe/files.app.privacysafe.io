import type { FsTableBulkActions } from '@/components/common/fs-table-bulk-actions/types';

export const HOME_PAGE_FS_ACTIONS: FsTableBulkActions = {
  'set:favorite': {
    icon: 'outline-bookmark-add',
    tooltip: 'Mark as/Unmark as Favorite',
  },
  download: {
    icon: 'outline-download-for-offline',
  },
  delete: {
    icon: 'outline-delete',
    tooltip: 'Delete to the Trash folder',
  },
};
