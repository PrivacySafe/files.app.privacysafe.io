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
import { defineStore } from 'pinia';
import { cloudFileSystemSrv } from '@/services/services-provider';
import { useFavoriteStore } from './favoririte.store';
import type { ListingEntryExtended } from '@/types';

export const useFsEntryStore = defineStore('fsEntry', () => {
  const { addFavoriteFolder, deleteFavoriteFolder } = useFavoriteStore();

  async function setFolderAsFavorite(fullPath: string) {
    const favoriteId = await addFavoriteFolder(fullPath);
    await cloudFileSystemSrv.updateEntityXAttrs(fullPath, { favoriteId });
  }

  async function unsetFolderAsFavorite(id: string, fullPath: string) {
    await deleteFavoriteFolder(id);
    await cloudFileSystemSrv.deleteEntityXAttrs(fullPath, ['favoriteId']);
  }

  async function renameEntity(fullPath: string, newName: string) {
    await cloudFileSystemSrv.renameEntity(fullPath, newName);
  }

  async function deleteEntity(entity: ListingEntryExtended) {
    const { type, fullPath } = entity;
    return cloudFileSystemSrv.deleteEntity(fullPath, type);
  }

  return {
    renameEntity,
    deleteEntity,
    setFolderAsFavorite,
    unsetFolderAsFavorite,
  };
});
