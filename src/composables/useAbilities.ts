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
import { computed } from 'vue';
import { useNavigation } from '@/composables/useNavigation';
import {
  USER_FS,
  USER_DEVICE_FS,
  END_OF_ROOT_FOLDER_ID,
  END_OF_TRASH_FOLDER_ID,
  START_OF_SYSTEM_FS_ID,
} from '@/constants';

export function useAbilities() {
  const { isSplittedMode, activeWindow, window1FsId, window1RootFolderId, window2FsId, window2RootFolderId } =
    useNavigation();

  const canCreateFolder = computed(() => {
    if ((isSplittedMode.value && activeWindow.value === '1') || !isSplittedMode.value) {
      return (
        (window1FsId.value === USER_FS && window1RootFolderId.value.includes(END_OF_ROOT_FOLDER_ID)) ||
        window1FsId.value === USER_DEVICE_FS
      );
    }

    return (
      (window2FsId.value === USER_FS && window2RootFolderId.value?.includes(END_OF_ROOT_FOLDER_ID)) ||
      window2FsId.value === USER_DEVICE_FS
    );
  });

  function canSetUnsetFavorite(currentFsId: string, currentRootFolderId: string): boolean {
    return (
      (currentFsId === USER_FS && currentRootFolderId.includes(END_OF_ROOT_FOLDER_ID)) || currentFsId === USER_DEVICE_FS
    );
  }

  function canRestore(currentFsId: string, currentRootFolderId: string, currentFolderPath?: string): boolean {
    return currentFsId === USER_FS && currentRootFolderId.includes(END_OF_TRASH_FOLDER_ID) && !currentFolderPath;
  }

  function canDelete(currentFsId: string, currentRootFolderId: string): boolean {
    return currentFsId === USER_FS && !currentRootFolderId.includes(END_OF_TRASH_FOLDER_ID);
  }

  function canDeleteCompletely(currentFsId: string, currentRootFolderId: string, currentFolderPath?: string): boolean {
    return currentFsId === USER_FS && currentRootFolderId.includes(END_OF_TRASH_FOLDER_ID)
      ? !currentFolderPath
      : !currentFsId.includes(START_OF_SYSTEM_FS_ID);
  }

  function canUpload(currentFsId: string, currentRootFolderId: string): boolean {
    return (
      (currentFsId === USER_FS && currentRootFolderId.includes(END_OF_ROOT_FOLDER_ID)) || currentFsId === USER_DEVICE_FS
    );
  }

  function canRename(currentFsId: string, currentRootFolderId: string): boolean {
    return (
      (currentFsId === USER_FS && currentRootFolderId.includes(END_OF_ROOT_FOLDER_ID)) || currentFsId === USER_DEVICE_FS
    );
  }

  function canCopyMove(currentRootFolderId: string): boolean {
    return !currentRootFolderId.includes(END_OF_TRASH_FOLDER_ID);
  }

  function canDrop(currentFsId: string, currentRootFolderId: string): boolean {
    return (
      (currentFsId === USER_FS || currentFsId === USER_DEVICE_FS) &&
      !currentRootFolderId.includes(END_OF_TRASH_FOLDER_ID)
    );
  }

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
