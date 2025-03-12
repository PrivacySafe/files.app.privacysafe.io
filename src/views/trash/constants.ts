import type { FsTableBulkActions } from '@/components/common/fs-table-bulk-actions/types';

export const TRASH_PAGE_FS_ACTIONS: FsTableBulkActions = {
  download: {
    icon: 'outline-download-for-offline',
    tooltip: 'Download selected objects',
  },
  restore: {
    icon: 'round-refresh',
    tooltip: 'Restore selected objects',
  },
  delete: {
    icon: 'outline-delete',
    iconColor: 'var(--error-content-default)',
    tooltip: 'Permanently delete selected objects',
  },
};
