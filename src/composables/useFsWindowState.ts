import { computed, type ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore, useFsStore } from '@/store';
import { useNavigation } from '@/composables/useNavigation';
import { USER_FS, END_OF_TRASH_FOLDER_ID, START_OF_SYSTEM_FS_ID } from '@/constants';

export function useFsWindowState(fsWindowNumber: ComputedRef<'1' | '2'>) {
  const {
    isSplittedMode,
    window1FsId,
    window1RootFolderId,
    window1FolderPath,
    window1SortBy,
    window1SortOrder,
    window2FsId,
    window2RootFolderId,
    window2FolderPath,
    window2SortBy,
    window2SortOrder,
  } = useNavigation();

  const { trashFolderName } = storeToRefs(useAppStore());
  const { fsList } = storeToRefs(useFsStore());

  const currentWindowFsId = computed(() => (fsWindowNumber.value === '1' ? window1FsId.value : window2FsId.value!));

  const currentWindowFs = computed(() => Object.values(fsList.value).find(fs => fs.fsId === currentWindowFsId.value));

  const currentWindowRootFolderId = computed(() =>
    fsWindowNumber.value === '1' ? window1RootFolderId.value : window2RootFolderId.value!,
  );

  const currentWindowRootFolderBasePath = computed(() =>
    currentWindowRootFolderId.value?.includes(END_OF_TRASH_FOLDER_ID) ? trashFolderName.value : '',
  );

  const currentWindowFolderPath = computed(() =>
    fsWindowNumber.value === '1' ? window1FolderPath.value : window2FolderPath.value!,
  );

  const currentWindowSortConfig = computed(() => ({
    field: fsWindowNumber.value === '1' ? window1SortBy.value : window2SortBy.value,
    direction: fsWindowNumber.value === '1' ? window1SortOrder.value : window2SortOrder.value,
  }));

  const isTrashFolderInCurrentWindow = computed(() => {
    if ((isSplittedMode.value && fsWindowNumber.value === '1') || !isSplittedMode.value) {
      return window1FsId.value === USER_FS && window1RootFolderId.value.includes(END_OF_TRASH_FOLDER_ID);
    }

    return window2FsId.value === USER_FS && window2RootFolderId.value!.includes(END_OF_TRASH_FOLDER_ID);
  });

  const isSystemFolderInCurrentWindow = computed(() => {
    if ((isSplittedMode.value && fsWindowNumber.value === '1') || !isSplittedMode.value) {
      return window1FsId.value.includes(START_OF_SYSTEM_FS_ID);
    }

    return window2FsId.value!.includes(START_OF_SYSTEM_FS_ID);
  });

  return {
    currentWindowFsId,
    currentWindowFs,
    currentWindowRootFolderId,
    currentWindowRootFolderBasePath,
    currentWindowFolderPath,
    currentWindowSortConfig,
    isTrashFolderInCurrentWindow,
    isSystemFolderInCurrentWindow,
  };
}
