import { onBeforeMount, computed } from 'vue';
import { usePickerFsStore } from '@picker/common/stores/picker-fs.store';
import { USER_DEVICE_FS } from '@shared/constants';
import { storeToRefs } from 'pinia';

export function usePickerFS() {
  const fsStore = usePickerFsStore();

  onBeforeMount(async () => {
    try {
      await fsStore.initializeFsItems();
    } catch (e) {
      console.error('🔥 Error while mounted the app. ', e);
      throw e;
    }
  });

  // TODO:
  // combined userDeviceFsFolders, systemFsFolders and systemFsFolders into one object
  // so it can easily pass down into picker-sidebar component

  const { fsAvailableFolderList } = storeToRefs(fsStore);

  const userDeviceFsFolders = computed(() =>
    fsAvailableFolderList.value.filter(f => f.fsId.includes(USER_DEVICE_FS)),
  );

  return { userDeviceFsFolders };
}
