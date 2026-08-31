import { ref, computed, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import { useAppStore } from '@/store/app.store';
import type { RootFsFolderView, FsListItem } from '@shared/types';
import { START_OF_SYSTEM_FS_ID, USER_DEVICE_FS, USER_FS, USER_LOCAL_FS } from '@shared/constants';
import { appStorageSrv } from '@/services/services-provider';

export const usePickerFsStore = defineStore('picker-fs', () => {
  const appStore = useAppStore();

  const { initializeFsItems: _initializeFsItems, getFsList, getFsRootFolderList } = appStorageSrv;

  const fsList = shallowRef<Record<string, FsListItem>>({});
  const fsFolderList = ref<RootFsFolderView[]>([]);

  const fsAvailableFolderList = computed(() =>
    fsFolderList.value.filter(f => {
      const { localFoldersDisplaying, systemFoldersDisplaying, deviceFoldersDisplaying } =
        appStore.appStorageSettings;
      return (
        f.fsId === USER_FS ||
        (localFoldersDisplaying && f.fsId === USER_LOCAL_FS) ||
        (deviceFoldersDisplaying && f.fsId === USER_DEVICE_FS) ||
        (systemFoldersDisplaying && f.id.includes(START_OF_SYSTEM_FS_ID))
      );
    }),
  );

  async function initializeFsItems(): Promise<void> {
    if (!getFsList) {
      await _initializeFsItems();
    }
    fsList.value = await getFsList();
    fsFolderList.value = await getFsRootFolderList();
  }

  return {
    fsAvailableFolderList,
    initializeFsItems,
  };
});
