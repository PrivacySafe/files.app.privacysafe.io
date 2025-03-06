import { VNode } from 'vue';
import type { ListingEntryExtended } from '@/types';
import type { FsPathObject } from '@/components/common/fs-page-toolbar/types';

export interface FsTableProps {
  name: string;
  basePath?: FsPathObject;
  path: string;
  isInSplitMode?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  isTrashFolder?: boolean;
}

export interface FsTableEmits {
  (event: 'loading', value: boolean): void;
  (event: 'make:active'): void;
  (event: 'go', value: string): void;
  (event: 'open:info', value: string): void;
  (event: 'select:entity', value: ListingEntryExtended[]): void;
}

export interface FsTableSlots {
  'group-actions': ({ selectedRows }: { selectedRows: ListingEntryExtended[] }) => VNode;
}
