import type { ListingEntryExtended } from '@/types';

export type FsTableBulkActionName =
  | 'set:favorite'
  | 'copy/move'
  | 'download'
  | 'restore'
  | 'delete'
  | 'delete:completely';

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
  window: 1 | 2;
  fsId: string;
  rootFolderId: string;
  folderPath: string;
  selectedEntities: ListingEntryExtended[];
  isMoveMode?: boolean;
  isMoveModeQuick?: boolean;
  disabled?: boolean;
}

export interface FsTableBulkActionsEmits {
  (event: 'action', value: { action: FsTableBulkActionName; payload?: unknown }): void;
  (event: 'update:move-mode', value: boolean): void;
}
