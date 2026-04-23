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
import { computed, ComputedRef, ref } from 'vue';
import { defineStore } from 'pinia';
import { appStorageSrv } from '@/services/services-provider';
import type { FavoriteFolder, FavoriteFolderDb } from '@shared/types';

export const useFavoriteStore = defineStore('favorite', () => {
  const favoriteFolders = ref<FavoriteFolderDb[]>([]);

  const processedFavoriteFolders = computed(() => {
    return favoriteFolders.value.map(item => {
      const parsedFullPath = item.fullPath.split('/');
      const folderName = parsedFullPath.pop();
      return {
        ...item,
        folderName,
      };
    });
  }) as ComputedRef<FavoriteFolder[]>;

  function setFavoriteFolderListValue(value: FavoriteFolderDb[]) {
    favoriteFolders.value = value;
  }

  async function getFavoriteFolderList() {
    try {
      favoriteFolders.value = await appStorageSrv.getFavorites();
    } catch (e) {
      w3n.log('error', 'Failed to get favorite folders', e);
    }
  }

  async function addFavoriteFolder({
    fsId,
    fullPath,
  }: {
    fsId: string;
    fullPath: string;
  }): Promise<string | undefined> {
    try {
      const { folderId, updatedFolderList } = await appStorageSrv.addFavorite({ fsId, fullPath });
      favoriteFolders.value = updatedFolderList;
      return folderId;
    } catch (e) {
      w3n.log('error', `Failed to add favorite folder [${fullPath}]`, e);
    }
  }

  async function updateFavoriteFolder({
    fsId,
    id,
    fullPath,
  }: {
    fsId: string;
    id: string;
    fullPath: string;
  }): Promise<void> {
    try {
      favoriteFolders.value = await appStorageSrv.updateFavorite({ fsId, id, fullPath });
    } catch (e) {
      w3n.log('error', `Failed to update favorite folder [${fullPath}]`, e);
    }
  }

  async function deleteFavoriteFolder(favoriteFolderId: string) {
    try {
      if (!favoriteFolderId) {
        console.error('Missing favorite folder id to delete.');
        return;
      }

      favoriteFolders.value = await appStorageSrv.deleteFavorite(favoriteFolderId);
    } catch (e) {
      w3n.log('error', `Failed to delete favorite folder [${favoriteFolderId}]`, e);
    }
  }

  return {
    favoriteFolders,
    processedFavoriteFolders,
    setFavoriteFolderListValue,
    getFavoriteFolderList,
    addFavoriteFolder,
    updateFavoriteFolder,
    deleteFavoriteFolder,
  };
});
