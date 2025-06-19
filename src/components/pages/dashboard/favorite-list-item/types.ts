import type { FavoriteFolder } from '@/types';

export interface FavoriteListItemProps {
  item: FavoriteFolder & { folderName?: string };
}

export interface FavoriteListItemEmits {
  (event: 'go', value: FavoriteFolder & { folderName?: string }): void;
}
