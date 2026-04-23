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
import { shallowReactive, ref, defineAsyncComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { defineStore } from 'pinia';
import isEmpty from 'lodash/isEmpty';
import { appStorageSrv } from '@/services/services-provider';
import { createFileBaseOnOsFileSystemFile as _createFileBaseOnOsFileSystemFile } from './fs-operations/create-file-based-on-os-file-system-file';
import { downloadEntities as _downloadEntities } from './fs-operations/download-entities';
import { useAppStore } from '@/store/app.store';
import type { FileW, FsListItem, ListingEntryExtended, RootFsFolderView } from '@shared/types';
import { START_OF_SYSTEM_FS_ID, USER_DEVICE_FS, USER_FS, USER_LOCAL_FS } from '@shared/constants';

export const useFsStore = defineStore('fs', () => {
  const { t } = useI18n();
  const appStore = useAppStore();
  const { $dialogs, $createNotice } = appStore;

  const {
    initializeFsItems: _initializeFsItems,
    getTrashFolderName,
    isEntityPresent,
    getEntityStats,
    getSyncedStatus,
    syncUpload,
    startSyncUpload,
    startSyncDownload,
    adoptRemote,
    makeFolder,
    moveEntity,
    moveEntities,
    copyEntities,
    copyMoveEntities,
    getFolderContentList,
    getFolderContentFilledList: _getFolderContentFilledList,
    renameEntity,
    deleteEntity,
    restoreEntity,
    setFolderAsFavorite,
    unsetFolderAsFavorite,
    removeFavoriteFolderFromList,
  } = appStorageSrv;

  const fsList = shallowReactive<Record<string, FsListItem>>({});
  const fsFolderList = ref<RootFsFolderView[]>([]);

  const trashFolderName = ref<string | null>(null);

  const fsAvailableFolderList = computed(() =>
    fsFolderList.value.filter(f => {
      const { localFoldersDisplaying, systemFoldersDisplaying, deviceFoldersDisplaying } = appStore.appStorageSettings;
      return (
        f.fsId === USER_FS ||
        (localFoldersDisplaying && f.fsId === USER_LOCAL_FS) ||
        (deviceFoldersDisplaying && f.fsId === USER_DEVICE_FS) ||
        (systemFoldersDisplaying && f.id.includes(START_OF_SYSTEM_FS_ID))
      );
    }),
  );

  function getFs(fsId: string): web3n.files.WritableFS {
    const fs = fsList[fsId];
    if (!fs) {
      throw new Error(`No FS found for id ${fsId}`);
    }

    return fs.entity;
  }

  async function getFolderContentFilledList({
    fsId,
    rootFolderId,
    path,
    basePath,
    operatingSystem,
  }: {
    fsId: string;
    rootFolderId: string;
    path: string;
    basePath?: string;
    operatingSystem: 'macos' | 'linux' | 'windows';
  }): Promise<{ rootFolderId: string; path: string; data: ListingEntryExtended[] }> {
    return {
      rootFolderId,
      path,
      data: await _getFolderContentFilledList({ fsId, path, basePath, operatingSystem }),
    };
  }

  async function saveFileBaseOnOsFileSystemFile({
    fsId,
    uploadedFile,
    folderPath,
    withThumbnail,
  }: {
    fsId: string;
    uploadedFile: File;
    folderPath: string;
    withThumbnail?: boolean;
  }): Promise<void> {
    const fs = getFs(fsId);
    await _createFileBaseOnOsFileSystemFile({
      fsId,
      fs,
      uploadedFile,
      folderPath,
      withThumbnail,
    });
  }

  type ListingEntryRestoreExtended = ListingEntryExtended & { restoreMode?: 'restore' | 'keep' | 'replace' };
  type EntitiesForRestore = Record<
    string,
    { simple: ListingEntryRestoreExtended[]; extra: ListingEntryRestoreExtended[] }
  >;
  async function restoreEntities({
    fsId,
    entities,
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
  }): Promise<number | undefined> {
    if (![USER_FS, USER_LOCAL_FS].includes(fsId)) {
      return;
    }

    const _restoreEntities = async (data: EntitiesForRestore, modeForExtraProcessing?: 'keep' | 'replace') => {
      for (let i = 0; i < Object.keys(data).length; i++) {
        const currentParentFolder = Object.keys(data)[i];
        const entities = [...data[currentParentFolder].simple];
        for (const ent of data[currentParentFolder].extra) {
          entities.push({
            ...ent,
            restoreMode: modeForExtraProcessing,
          });
        }

        for (let e = 0; e < entities.length; e++) {
          const whetherSyncParentFolder = e === entities.length - 1;
          await restoreEntity({
            fsId,
            entity: entities[e],
            ...(entities[e].restoreMode && { mode: entities[e].restoreMode }),
            withoutSync: !(fsId === USER_FS && whetherSyncParentFolder),
          });
        }
      }
    };

    const entitiesForRestore: EntitiesForRestore = {};

    let numberOfEntitiesForSimpleProcessing = 0;
    let numberOfEntitiesForExtraProcessing = 0;

    for (const entity of entities) {
      const { originalName, parentFolder = '', type } = entity;
      const restoredPath = `${parentFolder}/${originalName}`;
      if (!entitiesForRestore[parentFolder]) {
        entitiesForRestore[parentFolder] = {
          simple: [],
          extra: [],
        };
      }

      const isCurrentEntityPresent = await isEntityPresent({ fsId, entityPath: restoredPath, entityType: type });
      if (isCurrentEntityPresent) {
        entitiesForRestore[parentFolder].extra.push(entity);
        numberOfEntitiesForExtraProcessing += 1;
      } else {
        entitiesForRestore[parentFolder].simple.push(entity);
        numberOfEntitiesForSimpleProcessing += 1;
      }
    }

    if (numberOfEntitiesForExtraProcessing === 0) {
      await _restoreEntities(entitiesForRestore);
      return numberOfEntitiesForSimpleProcessing;
    }

    const component = defineAsyncComponent(() => import('@/components/dialogs/restore-fs-entities-dialog.vue'));
    const res = await $dialogs.open<'keep' | 'replace'>(component, {
      entityNames: Object.keys(entitiesForRestore).reduce((res, parentFolder) => {
        const entities = entitiesForRestore[parentFolder].extra;
        for (const entity of entities) {
          res.push(entity.name);
        }
        return res;
      }, [] as string[]),
      dialogProps: {
        title: t('dialog.warning.title'),
        confirmButton: false,
        cancelButton: false,
        closeOnClickOverlay: false,
      },
    });

    const { event, data } = res;
    if (event === 'confirm') {
      await _restoreEntities(entitiesForRestore, data as 'keep' | 'replace');
      return numberOfEntitiesForSimpleProcessing + numberOfEntitiesForExtraProcessing;
    }

    return undefined;
  }

  async function downloadEntities({
    fsId,
    entities = [],
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
  }): Promise<void> {
    if (isEmpty(entities)) {
      return;
    }

    try {
      const fs = getFs(fsId);
      await _downloadEntities({ fs, entities });
      $createNotice({
        type: 'success',
        withIcon: true,
        content: t('fs.entity.message.success.download', { count: entities.length }),
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      $createNotice({
        type: 'error',
        withIcon: true,
        content: t('fs.entity.message.error.download', { count: entities.length }),
      });
    }
  }

  async function openFile(fsId: string, fullPath: string, isLinkPath = false) {
    const fs = getFs(fsId);
    const file = isLinkPath
      ? ((await (await fs.readLink(fullPath)).target()) as FileW)
      : await (fs.writable ? fs.writableFile(fullPath) : fs.readonlyFile(fullPath));

    await w3n.shell!.openFile!(file);
  }

  async function initializeFsItems(): Promise<void> {
    const { fsList: fsListValue, fsFolderList: fsFolderListValue } = await _initializeFsItems();

    Object.keys(fsListValue).forEach(key => {
      fsList[key] = fsListValue[key];
    });
    fsFolderList.value = fsFolderListValue;
    trashFolderName.value = await getTrashFolderName();
  }

  return {
    fsList,
    fsFolderList,
    fsAvailableFolderList,
    trashFolderName,
    initializeFsItems,
    getFs,
    isEntityPresent,
    getEntityStats,
    getSyncedStatus,
    syncUpload,
    startSyncUpload,
    startSyncDownload,
    adoptRemote,
    makeFolder,
    moveEntity,
    moveEntities,
    copyEntities,
    copyMoveEntities,
    getFolderContentList,
    getFolderContentFilledList,
    saveFileBaseOnOsFileSystemFile,
    renameEntity,
    deleteEntity,
    restoreEntity,
    restoreEntities,
    downloadEntities,
    openFile,
    setFolderAsFavorite,
    unsetFolderAsFavorite,
    removeFavoriteFolderFromList,
  };
});
