import { VNode } from 'vue';
import { type Nullable, Ui3nTable } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';
import type { FsPathObject } from '@/components/common/fs-page-toolbar/types';

export interface FsTableProps {
  name: string;
  basePath?: FsPathObject;
  path: string;
  isInSplitMode?: boolean;
  isInDraggingMode?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  isTrashFolder?: boolean;
}

export interface FsTableEmits {
  (event: 'loading', value: boolean): void;

  (event: 'init', value: typeof Ui3nTable): void;

  (event: 'make:active'): void;

  (event: 'go', value: string): void;

  (event: 'open:info', value: string): void;

  (event: 'select:entity', value: ListingEntryExtended[]): void;

  (event: 'drag:start'): void;

  (event: 'drag:end', value: { data: Nullable<ListingEntryExtended[]>; target: Nullable<ListingEntryExtended> }): void;

  (event: 'drag:stop'): void;
}

export interface FsTableSlots {
  'group-actions': ({ selectedRows }: { selectedRows: ListingEntryExtended[] }) => VNode;
}
