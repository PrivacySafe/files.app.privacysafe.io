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
import { cloudFileSystemSrv } from '@/services/services-provider';
import { useFavoriteStore } from './favoririte.store';
import type { ListingEntryExtended } from '@/types';

export const useFsEntryStore = defineStore('fsEntry', () => {
  const { addFavoriteFolder, deleteFavoriteFolder, $dialogs, $i18n, $createNotice } = useFavoriteStore();

  async function setFolderAsFavorite(fullPath: string) {
    const favoriteId = await addFavoriteFolder(fullPath);
    await cloudFileSystemSrv.updateEntityXAttrs(fullPath, { favoriteId });
  }

  async function removeFavoriteFolderFromList(id: string) {
    await deleteFavoriteFolder(id);
  }

  async function unsetFolderAsFavorite(id: string, fullPath: string) {
    await deleteFavoriteFolder(id);
    await cloudFileSystemSrv.deleteEntityXAttrs(fullPath, ['favoriteId']);
  }

  async function isEntityPresent(
    entityPath: string,
    entityType: 'folder' | 'file' | 'link' = 'folder',
  ): Promise<boolean> {
    return cloudFileSystemSrv.isEntityPresent(entityPath, entityType);
  }

  async function makeFolder(path: string): Promise<void> {
    return cloudFileSystemSrv.makeFolder(path);
  }

  async function saveFileBaseOnOsFileSystemFile(
    uploadedFile: File,
    folderPath: string,
    withThumbnail?: boolean,
  ): Promise<void> {
    return cloudFileSystemSrv.saveFileBaseOnOsFileSystemFile(uploadedFile, folderPath, withThumbnail);
  }

  async function renameEntity(fullPath: string, newName: string) {
    await cloudFileSystemSrv.renameEntity(fullPath, newName);
  }

  async function deleteEntity(entity: ListingEntryExtended) {
    return cloudFileSystemSrv.deleteEntity(entity);
  }

  async function restoreEntity(entity: ListingEntryExtended, mode: 'restore' | 'keep' | 'replace' = 'restore') {
    return cloudFileSystemSrv.restoreEntity(entity, mode);
  }

  async function restoreEntities(entities: ListingEntryExtended[]): Promise<number> {
    const entitiesForSimpleRestore: ListingEntryExtended[] = [];
    const entitiesForExtraProcessing: ListingEntryExtended[] = [];

    for (const entity of entities) {
      const { name, parentFolder = '', type } = entity;
      const restoredPath = `${parentFolder}/${name}`;
      const isCurrentEntityPresent = await isEntityPresent(restoredPath, type);
      if (isCurrentEntityPresent) {
        entitiesForExtraProcessing.push(entity);
      } else {
        entitiesForSimpleRestore.push(entity);
      }
    }

    if (isEmpty(entitiesForExtraProcessing)) {
      const processes = entitiesForSimpleRestore.map(entity => restoreEntity(entity));
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

            const processes = entitiesForSimpleRestore.map(entity => restoreEntity(entity));
            await Promise.all(processes);
            resolve(entitiesForSimpleRestore.length);
          },
          onCancel: async () => {
            if (isEmpty(entitiesForSimpleRestore)) {
              resolve(0);
            }

            const processes = entitiesForSimpleRestore.map(entity => restoreEntity(entity));
            await Promise.all(processes);
            resolve(entitiesForSimpleRestore.length);
          },
          onConfirm: async mode => {
            const processes1 = entitiesForExtraProcessing.map(entity =>
              restoreEntity(entity, mode as 'keep' | 'replace'),
            );
            const processes2 = entitiesForSimpleRestore.map(entity => restoreEntity(entity));
            await Promise.all([...processes1, ...processes2]);
            resolve(entities.length);
          },
        },
      });
    });
  }

  async function downloadEntities(entities: ListingEntryExtended[] = []): Promise<void> {
    if (isEmpty(entities)) return;

    try {
      await cloudFileSystemSrv.downloadEntities(entities);
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

  async function copyMoveEntities(
    entities: ListingEntryExtended[],
    target: ListingEntryExtended,
    moveMode?: boolean,
  ): Promise<void> {
    const { fullPath: targetPath = '' } = target;

    if (moveMode) {
      await cloudFileSystemSrv.moveEntities(entities, targetPath);
      return;
    }

    await cloudFileSystemSrv.copyEntities(entities, targetPath);
  }

  return {
    isEntityPresent,
    makeFolder,
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
