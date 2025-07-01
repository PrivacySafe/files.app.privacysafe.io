import type { FsFolderEntityEvent, ListingEntryExtended } from '@/types';

export interface FsTableRowProps<K extends string & keyof ListingEntryExtended> {
  fsId: string;
  rootFolderId: string;
  row: ListingEntryExtended;
  rowIndex: number;
  isRowSelected?: boolean;
  isDroppable?: boolean;
  columnStyle?: { [P in Omit<K, 'id'> as string | number]: Record<string, string> };
  events?: { select: (row: ListingEntryExtended, withoutEvents?: boolean) => void };
  window: 1 | 2;
  readonly?: boolean;
  disabled?: boolean;
}

export type FsTableRowEvents = 'go' | 'rename' | 'update:favorite' | 'open:info';

export interface FsTableRowEmits {
  (event: 'action', value: { event: FsFolderEntityEvent; payload?: unknown }): void;
  (event: 'select:multiple'): void;
}
