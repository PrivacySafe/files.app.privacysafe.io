import type { FsTableBulkActions } from '@/components/common/fs-table-bulk-actions/types';

export const FS_TABLE_BULK_ACTIONS: FsTableBulkActions = {
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
  'delete:completely': {
    icon: 'trash-can',
    iconColor: 'var(--error-content-default)',
    tooltip: 'Permanently delete selected objects',
  },
  restore: {
    icon: 'round-refresh',
    tooltip: 'Restore selected objects',
  },
  'copy/move': {
    icon: '',
    tooltip: 'Copy/Move selected objects',
  },
};
