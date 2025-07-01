import type { StorageType, RootFsFolderView } from '@/types';

export const APP_ROUTES = {
  DASHBOARD: 'dashboard',
  SINGLE: 'single',
  DOUBLE: 'double',
} as const;

export const USER_FS = 'user-synced';
export const USER_DEVICE_FS = 'user-device';
export const START_OF_SYSTEM_FS_ID = 'system-';
export const END_OF_ROOT_FOLDER_ID = '-root';
export const END_OF_TRASH_FOLDER_ID = '-trash';

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
    fsId: USER_FS,
    name: 'fs.user.synced.home.folder',
    icon: 'round-home',
  },
  // {
  //   id: 'user-synced-recent',
  //   fsId: USER_FS,
  //   name: 'fs.user.synced.recent.folder',
  //   icon: 'round-schedule',
  //   disabled: true,
  // },
  {
    id: 'user-synced-trash',
    fsId: USER_FS,
    name: 'fs.user.synced.trash.folder',
    icon: 'outline-delete',
  },
];
