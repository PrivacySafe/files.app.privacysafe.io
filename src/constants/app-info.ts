import type { SystemFolderView } from '@/types';

export const SYSTEM_FOLDERS: Array<SystemFolderView & { disabled?: boolean }> = [
  { name: 'Home', icon: 'round-home', route: '/dashboard/home' },
  { name: 'Recent', icon: 'round-schedule', route: '/dashboard/recent', disabled: true },
  { name: 'Trash', icon: 'outline-delete', route: '/dashboard/trash' },
];
