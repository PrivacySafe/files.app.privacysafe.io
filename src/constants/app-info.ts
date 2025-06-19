import type { StorageType, RootFsFolderView } from '@/types';

export const APP_ROUTES = {
  DASHBOARD: 'dashboard',
  SINGLE: 'single',
  DOUBLE: 'double',
} as const;

export const APP_FS_ITEMS: `${'user' | 'system'}:${StorageType}`[] = [
  'user:synced',
  'user:device',
  'system:synced',
  'system:local',
  'system:device',
];

export const FS_ITEM_INITIALIZE_BY_USE: Record<'user' | 'system', 'getUserFS' | 'getSysFS'> = {
  user: 'getUserFS',
  system: 'getSysFS',
};

export const DEFAULT_FOLDERS: RootFsFolderView[] = [
  {
    id: 'user-synced-root',
    fsId: 'user-synced',
    name: 'fs.user.synced.home.folder',
    icon: 'round-home',
  },
  // {
  //   id: 'user-synced-recent',
  //   fsId: 'user-synced',
  //   name: 'fs.user.synced.recent.folder',
  //   icon: 'round-schedule',
  //   disabled: true,
  // },
  {
    id: 'user-synced-trash',
    fsId: 'user-synced',
    name: 'fs.user.synced.trash.folder',
    icon: 'outline-delete',
  },
];
