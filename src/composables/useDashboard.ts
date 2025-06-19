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
import { computed, defineAsyncComponent, inject, onBeforeMount } from 'vue';
import { storeToRefs } from 'pinia';
import { DIALOGS_KEY, I18N_KEY, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
import { useNavigation } from '@/composables/useNavigation';
import { useAppStore, useFsStore, useFavoriteStore, useFsEntryStore, useRunModeInfoStore } from '@/store';
import type { AppGlobalEvents, FavoriteFolder, RootFsFolderView } from '@/types';

export function useDashboard() {
  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject(I18N_KEY)!;
  const dialogs = inject(DIALOGS_KEY)!;

  const { route, navigateToRouteSingle } = useNavigation();

  const appStore = useAppStore();
  const { areSystemFoldersShowing } = storeToRefs(appStore);
  const { setCommonLoading } = appStore;

  const fsStore = useFsStore();
  const { fsFolderList } = storeToRefs(fsStore);

  const favoriteStore = useFavoriteStore();
  const { processedFavoriteFolders } = storeToRefs(favoriteStore);
  const { getFavoriteFolderList } = favoriteStore;

  const fsEntryStore = useFsEntryStore();
  const { isEntityPresent, makeFolder, saveFileBaseOnOsFileSystemFile, removeFavoriteFolderFromList } = fsEntryStore;

  const runModeInfoStore = useRunModeInfoStore();
  const { isTileView, isSplittedMode, activeWindow, processedPath, currentFsId, parentSelectedFolder } =
    storeToRefs(runModeInfoStore);

  const userSyncedFsFolders = computed(() => fsFolderList.value.filter(f => f.fsId.includes('user-synced')));
  const userDeviceFsFolders = computed(() => fsFolderList.value.filter(f => f.fsId.includes('user-device')));
  const systemFsFolders = computed(() => fsFolderList.value.filter(f => f.fsId.includes('system-')));

  function isFolderSelected(folder: RootFsFolderView) {
    return folder.id === parentSelectedFolder.value;
  }

  async function selectFolder(folder: RootFsFolderView) {
    await navigateToRouteSingle({
      params: {
        fsId: folder.fsId,
        folderId: folder.id,
      },
      query: {
        view: isTileView.value ? 'tile' : 'table',
        path: '',
      },
    });

    bus.$emitter.emit('click:breadcrumb', void 0);
    bus.$emitter.emit('refresh:data', void 0);
  }

  function createFolder() {
    const component = defineAsyncComponent(() => import('@/components/dialogs/update-folder-name-dialog.vue'));

    dialogs.$openDialog<typeof component>({
      component,
      componentProps: {
        name: '',
      },
      dialogProps: {
        title: $tr('create.folder.dialog.title'),
        confirmButtonText: $tr('create.dialog.confirm.button'),
        onConfirm: async data => {
          const { newName } = data as unknown as { oldName: string; newName: string };
          if (newName) {
            const newFolderPath = `${processedPath.value}/${newName}`;
            await makeFolder({ fsId: currentFsId.value, path: newFolderPath });
            bus.$emitter.emit('create:folder', { fsId: currentFsId.value, fullPath: newFolderPath });
          }
        },
      },
    });
  }

  function uploadFile() {
    const component = defineAsyncComponent(() => import('@/components/dialogs/upload-files-dialog.vue'));

    dialogs.$openDialog<typeof component>({
      component,
      componentProps: {
        currentFolder: processedPath.value,
      },
      dialogProps: {
        title: '',
        cssStyle: {
          width: '95%',
          height: '90%',
        },
        confirmButton: false,
        cancelButton: false,
        closeOnClickOverlay: false,
        onConfirm: async files => {
          try {
            setCommonLoading(true);

            for (const file of files as File[]) {
              await saveFileBaseOnOsFileSystemFile({
                fsId: currentFsId.value,
                uploadedFile: file,
                folderPath: processedPath.value,
                withThumbnail: true,
              });
            }

            bus.$emitter.emit('upload:file', {
              fsId: currentFsId.value,
              fullPath: processedPath.value,
            });
          } finally {
            setCommonLoading(false);
          }
        },
      },
    });
  }

  async function goToFavoriteFolder(favoriteFolder: FavoriteFolder) {
    const { fsId, fullPath } = favoriteFolder;

    const parentFolder = fsFolderList.value.find(f => f.fsId === fsId && f.id.includes('-root'));

    const isFolderPresent = await isEntityPresent({ fsId, entityPath: fullPath });

    if (isFolderPresent && parentFolder) {
      return navigateToRouteSingle({
        params: {
          fsId,
          folderId: parentFolder!.id,
        },
        query: {
          path: fullPath,
          view: isTileView.value ? 'tile' : 'table',
        },
      });
    } else {
      const component = defineAsyncComponent(() => import('@/components/dialogs/confirmation-dialog.vue'));

      dialogs.$openDialog<typeof component>({
        component,
        componentProps: {
          dialogText: $tr('favorite.folder.missing.warning.text', { path: fullPath }),
          additionalDialogText: $tr('favorite.folder.missing.warning.question'),
        },
        dialogProps: {
          title: $tr('dialog.title.warning'),
          confirmButtonBackground: 'var(--error-content-default)',
          confirmButtonColor: 'var(--error-fill-default)',
          onConfirm: async () => {
            await removeFavoriteFolderFromList(favoriteFolder.id);
          },
        },
      });
    }
  }

  onBeforeMount(async () => {
    await getFavoriteFolderList();
  });

  return {
    route,
    isTileView,
    isSplittedMode,
    activeWindow,
    areSystemFoldersShowing,
    processedFavoriteFolders,
    userSyncedFsFolders,
    userDeviceFsFolders,
    systemFsFolders,
    isFolderSelected,
    selectFolder,
    createFolder,
    uploadFile,
    goToFavoriteFolder,
  };
}
