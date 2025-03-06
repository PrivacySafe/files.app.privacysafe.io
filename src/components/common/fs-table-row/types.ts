import type { ListingEntryExtended } from '@/types';

export interface FsTableRowProps<K extends string & keyof ListingEntryExtended> {
  row: ListingEntryExtended;
  rowIndex: number;
  isRowSelected?: boolean;
  isDroppable?: boolean;
  columnStyle?: { [P in Omit<K, 'id'> as string | number]: Record<string, string> };
  events?: { select: (row: ListingEntryExtended, withoutEvents?: boolean) => void };
  readonly?: boolean;
  disabled?: boolean;
}

export type FsTableRowEvents = 'go' | 'rename' | 'update:favorite' | 'open:info';

export interface FsTableRowEmits {
  (ev: 'action', value: { event: FsTableRowEvents; payload?: unknown }): void;
}
