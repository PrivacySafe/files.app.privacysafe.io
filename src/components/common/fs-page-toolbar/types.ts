import { VNode } from 'vue';

export type FsPathObject = {
  fullPath: string;
  title: string;
};

export interface FsPageToolbarProps {
  basePath: FsPathObject;
  isSplitMode?: boolean;
  activeWindow?: 'left' | 'right';
}

export interface FsPageToolbarEmits {
  (event: 'change:paths', value: { first: string; second: string }): void;
  (event: 'go', value: string): void;
}

export interface FsPageToolbarSlots {
  actions: () => VNode;
}
