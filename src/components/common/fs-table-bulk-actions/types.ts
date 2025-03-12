import type { ListingEntryExtended } from '@/types';

export type FsTableBulkActionName = 'set:favorite' | 'copy/move' | 'download' | 'restore' | 'delete';

export type FsTableBulkActions = Partial<
  Record<
    FsTableBulkActionName,
    {
      icon: string;
      iconColor?: string;
      tooltip?: string;
    }
  >
>;

export interface FsTableBulkActionsProps {
  config: FsTableBulkActions;
  selectedRows: ListingEntryExtended[];
  isMoveMode?: boolean;
  disabled?: boolean;
}

export interface FsTableBulkActionsEmits {
  (event: 'action', value: { action: FsTableBulkActionName; payload?: unknown }): void;
  (event: 'update:move-mode', value: boolean): void;
}
