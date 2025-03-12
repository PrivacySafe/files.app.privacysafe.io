import type { FsTableBulkActions } from '@/components/common/fs-table-bulk-actions/types';

export const HOME_PAGE_FS_ACTIONS: FsTableBulkActions = {
  'set:favorite': {
    icon: 'outline-bookmark-add',
    tooltip: 'Mark as/Unmark as Favorite folder',
  },
  download: {
    icon: 'outline-download-for-offline',
    tooltip: 'Download selected objects',
  },
  delete: {
    icon: 'outline-delete',
    tooltip: 'Delete selected objects to the Trash folder',
  },
  'copy/move': {
    icon: '',
    tooltip: 'Copy/Move selected objects',
  },
};
