/*
 Copyright (C) 2024-2025 3NSoft Inc.

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
import { defineAsyncComponent } from 'vue';
import { defineStore } from 'pinia';
import isEmpty from 'lodash/isEmpty';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { ListingEntry, ListingEntryExtended, WritableFS } from '@/types';
import { useAppStore } from './app.store';
import { useFsStore } from './fs.store';
import { useFavoriteStore } from './favoririte.store';
import { isThereEntityWithSameName } from '@/store/fs-operations/is-there-entity-with-same-name';
import { loadFsEntityStats } from '@/store/fs-operations/load-fs-entity-stats';
import { createFolderInFS } from '@/store/fs-operations/make-folder';
import { moveFsEntity } from '@/store/fs-operations/move-fs-entity';
import { copyFsEntities } from '@/store/fs-operations/copy-fs-entities';
import { moveFsEntities } from '@/store/fs-operations/move-fs-entities';
import { renameFsEntity as _renameFsEntity } from '@/store/fs-operations/rename-fs-entity';
import { deleteEntityInFs } from '@/store/fs-operations/delete-entity';
import { restoreFsEntity as _restoreFsEntity } from '@/store/fs-operations/restore-fs-entity';
import { downloadEntities as _downloadEntities } from '@/store/fs-operations/download-entities';
import { updateXAttrs } from '@/store/fs-operations/update-x-attrs';
import { deleteXAttrs } from '@/store/fs-operations/delete-x-attrs';
import { loadFolderContentList } from '@/store/fs-operations/load-folder-content-list';
import { loadPreparedFolderContentList } from '@/store/fs-operations/load-prepared-folder-content-list';
import { createFileBaseOnOsFileSystemFile } from '@/store/fs-operations/create-file-based-on-os-file-system-file';

export const useFsEntryStore = defineStore('fsEntry', () => {
  const appStore = useAppStore();
  const fsStore = useFsStore();
  const { addFavoriteFolder, deleteFavoriteFolder, $dialogs, $i18n, $createNotice } = useFavoriteStore();

  function getFs(fsId: string): WritableFS {
    const fs = fsStore.fsList[fsId];
    if (!fs) {
      throw new Error(`No FS found for id ${fsId}`);
    }

    return fs.entity;
  }

  async function isEntityPresent({
    fsId,
    entityPath,
    entityType = 'folder',
  }: {
    fsId: string;
    entityPath: string;
    entityType?: 'folder' | 'file' | 'link';
  }): Promise<boolean> {
    const fs = getFs(fsId);
    return isThereEntityWithSameName({ fs, entityPath, entityType });
  }

  async function updateEntityXAttrs({
    fsId,
    path,
    attrs,
  }: {
    fsId: string;
    path: string;
    attrs: Record<string, unknown | undefined>;
  }): Promise<void> {
    if (fsId.includes('-device')) return;

    const fs = getFs(fsId);

    await updateXAttrs({ fs, path, attrs });
  }

  async function deleteEntityXAttrs({
    fsId,
    path,
    attrNames = [],
  }: {
    fsId: string;
    path: string;
    attrNames: string[];
  }): Promise<void> {
    try {
      if (fsId.includes('-device')) return;

      const fs = getFs(fsId);
      return await deleteXAttrs({ fs, path, attrNames });
    } catch (e) {
      w3n.log('error', JSON.stringify(e), e);
    }
  }

  async function getEntityStats({
    fsId,
    fullPath,
  }: {
    fsId: string;
    fullPath: string;
  }): Promise<Nullable<ListingEntryExtended & { thumbnail?: string }> | undefined> {
    const fs = getFs(fsId);
    return loadFsEntityStats(fs, fullPath);
  }

  async function makeFolder({ fsId, path }: { fsId: string; path: string }): Promise<void> {
    const fs = getFs(fsId);

    await createFolderInFS({ fs, path });
  }

  async function getFolderContentList({ fsId, path }: { fsId: string; path: string }): Promise<ListingEntry[]> {
    const fs = getFs(fsId);
    return loadFolderContentList({ fs, path });
  }

  async function getFolderContentFilledList({
    fsId,
    path,
    basePath = '',
  }: {
    fsId: string;
    path: string;
    basePath?: string;
  }) {
    const fs = getFs(fsId);

    return loadPreparedFolderContentList({ fs, path, basePath, trashFolderName: appStore.trashFolderName });
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

    await createFileBaseOnOsFileSystemFile({ fs, uploadedFile, folderPath, withThumbnail });
  }

  async function moveEntity({
    fsId,
    entity,
    targetFsId,
    newPath,
  }: {
    fsId: string;
    entity: ListingEntryExtended;
    targetFsId: string;
    newPath: string;
  }): Promise<void> {
    const fs = getFs(fsId);
    const targetFs = getFs(targetFsId);

    const parsedNewPath = newPath.split('/');
    const targetFolder = parsedNewPath.slice(0, -1).join('/');

    await moveFsEntity({ fs, entity, targetFs, targetFolder });
  }

  async function moveEntities({
    fsId,
    entities,
    targetFsId,
    targetFolder,
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
    targetFsId: string;
    targetFolder: string;
  }): Promise<void> {
    const fs = getFs(fsId);
    const targetFs = getFs(targetFsId);

    await moveFsEntities({ fs, entities, targetFsId, targetFs, targetFolder });
  }

  async function copyEntities({
    fsId,
    entities,
    targetFsId,
    targetFolder,
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
    targetFsId: string;
    targetFolder: string;
  }): Promise<void> {
    const fs = getFs(fsId);
    const targetFs = getFs(targetFsId);

    await copyFsEntities({ fs, entities, targetFs, targetFolder });
  }

  async function copyMoveEntities({
    sourceFsId,
    entities,
    targetFsId,
    target,
    moveMode,
  }: {
    sourceFsId: string;
    entities: ListingEntryExtended[];
    targetFsId: string;
    target: ListingEntryExtended;
    moveMode?: boolean;
  }): Promise<void> {
    const { fullPath: targetPath = '' } = target;

    if (moveMode) {
      await moveEntities({ fsId: sourceFsId, entities, targetFsId, targetFolder: targetPath });
      return;
    }

    await copyEntities({ fsId: sourceFsId, entities, targetFsId, targetFolder: targetPath });
  }

  async function renameEntity({
    fsId,
    entity,
    newName,
  }: {
    fsId: string;
    entity: ListingEntryExtended;
    newName: string;
  }) {
    const fs = getFs(fsId);
    await _renameFsEntity({ fs, entity, targetFs: fs, newName });
  }

  async function deleteEntity({
    fsId,
    entity,
    completely,
  }: {
    fsId: string;
    entity: ListingEntryExtended;
    completely?: boolean;
  }): Promise<void> {
    const fs = getFs(fsId);

    await deleteEntityInFs({ fsId, fs, entity, trashFolderName: appStore.trashFolderName, completely });
  }

  async function restoreEntity({
    fsId,
    entity,
    mode = 'restore',
  }: {
    fsId: string;
    entity: ListingEntryExtended;
    mode?: 'restore' | 'keep' | 'replace';
  }) {
    if (!fsId.includes('user-synced')) return;

    const fs = getFs(fsId);
    const trashFolderName = appStore.trashFolderName;

    return _restoreFsEntity({ fsId, fs, entity, trashFolderName, mode });
  }

  async function restoreEntities({
    fsId,
    entities,
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
  }): Promise<number | undefined> {
    if (!fsId.includes('user-synced')) return;

    const entitiesForSimpleRestore: ListingEntryExtended[] = [];
    const entitiesForExtraProcessing: ListingEntryExtended[] = [];

    for (const entity of entities) {
      const { name, parentFolder = '', type } = entity;
      const restoredPath = `${parentFolder}/${name}`;
      const isCurrentEntityPresent = await isEntityPresent({ fsId, entityPath: restoredPath, entityType: type });
      if (isCurrentEntityPresent) {
        entitiesForExtraProcessing.push(entity);
      } else {
        entitiesForSimpleRestore.push(entity);
      }
    }

    if (isEmpty(entitiesForExtraProcessing)) {
      const processes = entitiesForSimpleRestore.map(entity => restoreEntity({ fsId, entity }));
      await Promise.all(processes);
      return entitiesForSimpleRestore.length;
    }

    return new Promise(resolve => {
      const component = defineAsyncComponent(() => import('@/components/dialogs/restore-fs-entities-dialog.vue'));
      $dialogs.open<typeof component>({
        component,
        componentProps: {
          entityNames: entitiesForExtraProcessing.map(entity => entity.name),
        },
        dialogProps: {
          title: $i18n.tr('dialog.title.warning'),
          confirmButton: false,
          cancelButton: false,
          closeOnClickOverlay: false,
          onClose: async () => {
            if (isEmpty(entitiesForSimpleRestore)) {
              resolve(0);
            }

            const processes = entitiesForSimpleRestore.map(entity => restoreEntity({ fsId, entity }));
            await Promise.all(processes);
            resolve(entitiesForSimpleRestore.length);
          },
          onCancel: async () => {
            if (isEmpty(entitiesForSimpleRestore)) {
              resolve(0);
            }

            const processes = entitiesForSimpleRestore.map(entity => restoreEntity({ fsId, entity }));
            await Promise.all(processes);
            resolve(entitiesForSimpleRestore.length);
          },
          onConfirm: async mode => {
            // @ts-ignore
            const processes1 = entitiesForExtraProcessing.map(entity => restoreEntity({ fsId, entity, mode }));
            const processes2 = entitiesForSimpleRestore.map(entity => restoreEntity({ fsId, entity }));
            await Promise.all([...processes1, ...processes2]);
            resolve(entities.length);
          },
        },
      });
    });
  }

  async function downloadEntities({
    fsId,
    entities = [],
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
  }): Promise<void> {
    if (isEmpty(entities)) return;

    const fs = getFs(fsId);

    try {
      await _downloadEntities({ fs, entities });
      $createNotice({
        type: 'success',
        withIcon: true,
        content:
          entities.length > 1
            ? $i18n.tr('fs.entity.download.plural.message.success', { count: `${entities.length}` })
            : $i18n.tr('fs.entity.download.single.message.success'),
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      $createNotice({
        type: 'error',
        withIcon: true,
        content:
          entities.length > 1
            ? $i18n.tr('fs.entity.download.plural.message.error', { count: `${entities.length}` })
            : $i18n.tr('fs.entity.download.single.message.error'),
      });
    }
  }

  /* favorites  */

  async function setFolderAsFavorite({ fsId, fullPath }: { fsId: string; fullPath: string }) {
    const favoriteId = await addFavoriteFolder({ fsId, fullPath });
    if (fsId.includes('-device')) return;

    await updateEntityXAttrs({ fsId, path: fullPath, attrs: { favoriteId } });
  }

  async function removeFavoriteFolderFromList(id: string) {
    await deleteFavoriteFolder(id);
  }

  async function unsetFolderAsFavorite({ fsId, id, fullPath }: { fsId: string; id: string; fullPath: string }) {
    try {
      await deleteFavoriteFolder(id);

      if (fsId.includes('-device')) return;

      await deleteEntityXAttrs({ fsId, path: fullPath, attrNames: ['favoriteId'] });
    } catch (error) {
      console.error('U ERR: ', error);
    }
  }

  return {
    isEntityPresent,
    updateEntityXAttrs,
    deleteEntityXAttrs,
    getEntityStats,
    makeFolder,
    moveEntity,
    moveEntities,
    copyEntities,
    getFolderContentList,
    getFolderContentFilledList,
    saveFileBaseOnOsFileSystemFile,
    renameEntity,
    downloadEntities,
    deleteEntity,
    restoreEntity,
    restoreEntities,
    copyMoveEntities,
    setFolderAsFavorite,
    removeFavoriteFolderFromList,
    unsetFolderAsFavorite,
  };
});
