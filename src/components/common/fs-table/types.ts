import { VNode, type ShallowUnwrapRef } from 'vue';
import { type Ui3nTableExpose } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';

export interface FsTableProps {
  fsId: string;
  rootFolderId: string;
  window: 1 | 2;
  basePath?: {
    fullPath: string;
    title: string;
  };
  path: string;
  isInSplitMode?: boolean;
  isInDraggingMode?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
}

export interface FsTableEmits {
  (event: 'loading', value: boolean): void;
  (event: 'init', value: ShallowUnwrapRef<Ui3nTableExpose<ListingEntryExtended>>): void;
  (event: 'make:active'): void;
  (event: 'go', value: string): void;
  (event: 'open:info', value: string): void;
  (event: 'select:entity', value: ListingEntryExtended[]): void;
}

export interface FsTableSlots {
  'group-actions': ({ selectedRows }: { selectedRows: ListingEntryExtended[] }) => VNode;
}
