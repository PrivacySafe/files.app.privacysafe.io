/*
 Copyright (C) 2025 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { computed, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import { APP_ROUTES } from '@/constants';

const USER_FS = 'user-synced';
const USER_DEVICE_FS = 'user-device';

export function useAbilities(currentWindow?: ComputedRef<'1' | '2'>) {
  const route = useRoute();

  const isSplittedMode = computed(() => route.name === APP_ROUTES.DOUBLE);
  const activeWindow = computed(() => (route.query.activeWindow || '1') as '1' | '2');

  const fsId = computed(() => route.params.fsId as string);
  const folderId = computed(() => route.params.folderId as string);

  const fs2Id = computed(() => route.params.fs2Id || (null as Nullable<string>));
  const folder2Id = computed(() => route.params.folder2Id || (null as Nullable<string>));

  const canCreateFolder = computed(() => {
    if ((isSplittedMode.value && activeWindow.value === '1') || !isSplittedMode.value) {
      return (fsId.value === USER_FS && folderId.value.includes('-root')) || fsId.value === USER_DEVICE_FS;
    }

    return (fs2Id.value === USER_FS && folder2Id.value?.includes('-root')) || fs2Id.value === USER_DEVICE_FS;
  });

  const canSetUnsetFavorite = computed(() => {
    if (isSplittedMode.value) {
      return currentWindow?.value === '1'
        ? (fsId.value === USER_FS && folderId.value.includes('-root')) || fsId.value === USER_DEVICE_FS
        : (fs2Id.value === USER_FS && folder2Id.value?.includes('-root')) || fs2Id.value === USER_DEVICE_FS;
    }

    return (fsId.value === USER_FS && folderId.value.includes('-root')) || fsId.value === USER_DEVICE_FS;
  });

  const canRestore = computed(() => {
    if (isSplittedMode.value) {
      return currentWindow?.value === '1'
        ? fsId.value === USER_FS && folderId.value.includes('-trash') && !route.query.path
        : fs2Id.value === USER_FS && folder2Id.value?.includes('-trash') && !route.query.path2;
    }

    return fsId.value === USER_FS && folderId.value.includes('-trash') && !route.query.path;
  });

  const canDelete = computed(() => {
    if (isSplittedMode.value) {
      return currentWindow?.value === '1'
        ? fsId.value === USER_FS && !folderId.value.includes('-trash')
        : fs2Id.value === USER_FS && !folder2Id.value?.includes('-trash');
    }

    return fsId.value === USER_FS && !folderId.value.includes('-trash');
  });

  const canDeleteCompletely = computed(() => {
    if (isSplittedMode.value) {
      return currentWindow?.value === '1'
        ? fsId.value === USER_FS && folderId.value.includes('-trash')
          ? !route.query.path
          : !fsId.value.includes('system-')
        : fs2Id.value === USER_FS && !folder2Id.value?.includes('-trash')
          ? !route.query.path2
          : !fs2Id.value?.includes('system-');
    }

    return fsId.value === USER_FS && folderId.value.includes('-trash')
      ? !route.query.path
      : !fsId.value.includes('system-');
  });

  const canUpload = computed(() => {
    if ((isSplittedMode.value && activeWindow.value === '1') || !isSplittedMode.value) {
      return (fsId.value === USER_FS && folderId.value.includes('-root')) || fsId.value === USER_DEVICE_FS;
    }

    return (fs2Id.value === USER_FS && folder2Id.value?.includes('-root')) || fs2Id.value === USER_DEVICE_FS;
  });

  const canRename = computed(() => {
    if ((isSplittedMode.value && activeWindow.value === '1') || !isSplittedMode.value) {
      return (fsId.value === USER_FS && folderId.value.includes('-root')) || fsId.value === USER_DEVICE_FS;
    }

    return (fs2Id.value === USER_FS && folder2Id.value?.includes('-root')) || fs2Id.value === USER_DEVICE_FS;
  });

  const canCopyMove = computed(() => {
    if (!isSplittedMode.value) return false;

    return currentWindow?.value === '1'
      ? fs2Id.value?.includes('user-') && !folder2Id.value?.includes('-trash')
      : fsId.value?.includes('user-') && !folderId.value.includes('-trash');
  });

  const canDrop = computed(() => {
    if (!isSplittedMode.value) return false;

    return currentWindow?.value === '1'
      ? fsId.value?.includes('user-') && !folderId.value.includes('-trash')
      : fs2Id.value?.includes('user-') && !folder2Id.value?.includes('-trash');
  });

  return {
    canCreateFolder,
    canSetUnsetFavorite,
    canRestore,
    canDelete,
    canDeleteCompletely,
    canUpload,
    canRename,
    canCopyMove,
    canDrop,
  };
}
