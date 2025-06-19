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
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { dbSrv } from '@/services/services-provider';
import type { FavoriteFolder } from '@/types';

export const useFavoriteStore = defineStore('favorite', () => {
  const favoriteFolders = ref<FavoriteFolder[]>([]);

  const processedFavoriteFolders = computed<
    Array<
      FavoriteFolder & {
        folderName?: string;
      }
    >
  >(() =>
    favoriteFolders.value.map(item => {
      const parsedFullPath = item.fullPath.split('/');
      const folderName = parsedFullPath.pop();
      return {
        ...item,
        folderName,
      };
    }),
  );

  async function getFavoriteFolderList() {
    try {
      favoriteFolders.value = await dbSrv.getFavorites();
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
      const favFolderId = await dbSrv.addFavorite({ fsId, fullPath });
      await getFavoriteFolderList();
      return favFolderId;
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
      await dbSrv.updateFavorite({ fsId, id, fullPath });
      await getFavoriteFolderList();
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

      favoriteFolders.value = await dbSrv.deleteFavorite(favoriteFolderId);
    } catch (e) {
      w3n.log('error', `Failed to delete favorite folder [${favoriteFolderId}]`, e);
    }
  }

  return {
    favoriteFolders,
    processedFavoriteFolders,
    getFavoriteFolderList,
    addFavoriteFolder,
    updateFavoriteFolder,
    deleteFavoriteFolder,
  };
});
