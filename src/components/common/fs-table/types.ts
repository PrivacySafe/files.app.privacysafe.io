import { VNode } from 'vue';
import { type Nullable, Ui3nTable } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';

export interface FsTableProps {
  fsId: string;
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

  (event: 'init', value: typeof Ui3nTable): void;

  (event: 'make:active'): void;

  (event: 'go', value: string): void;

  (event: 'open:info', value: string): void;

  (event: 'select:entity', value: ListingEntryExtended[]): void;

  (event: 'drag:start'): void;

  (
    event: 'drag:end',
    value: {
      sourceFsId: Nullable<string>;
      data: Nullable<ListingEntryExtended[]>;
      targetFsId: Nullable<string>;
      target: Nullable<ListingEntryExtended>;
    },
  ): void;

  (event: 'drag:stop'): void;
}

export interface FsTableSlots {
  'group-actions': ({ selectedRows }: { selectedRows: ListingEntryExtended[] }) => VNode;
}
