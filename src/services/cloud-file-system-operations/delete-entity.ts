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
import isEmpty from 'lodash/isEmpty';
import { getEntityTargetPath } from './get-entity-target-path';
import { useFavoriteStore } from '@/store/favoririte.store';
import { useFsEntryStore } from '@/store/fs-entity.store';
import type { ListingEntryExtended } from '@/types';

export async function deleteEntityInFs({
  fs,
  entity,
  trashFolderName,
}: {
  fs: web3n.files.WritableFS;
  entity: ListingEntryExtended;
  trashFolderName?: string;
}): Promise<void> {
  const favoriteStore = useFavoriteStore();
  const { unsetFolderAsFavorite } = useFsEntryStore();

  const { fullPath, type } = entity;

  try {
    const removeCompletely = trashFolderName ? fullPath.includes(trashFolderName) : true;
    if (removeCompletely) {
      switch (type) {
        case 'folder':
          await fs.deleteFolder(fullPath, true);
          break;
        case 'file':
          await fs.deleteFile(fullPath);
          break;
        case 'link':
          await fs.deleteLink(fullPath);
          break;
      }

      return;
    }

    const parsedPath = fullPath.split('/');
    const parentFolder = parsedPath.slice(0, -1).join('/');
    const parentFolderValue = parentFolder || '/';
    const entityName = parsedPath.pop();

    if (entityName) {
      const pathInTrash = await getEntityTargetPath({
        fs,
        entity,
        targetFolder: trashFolderName!,
        namePostfix: `${Date.now()}`,
      });

      await fs.move(fullPath, pathInTrash);
      await fs!.updateXAttrs(pathInTrash, {
        set: { parentFolder: parentFolderValue },
      });

      if (type === 'folder') {
        const favoriteItems = favoriteStore.favoriteFolders.filter(fav => fav.fullPath.includes(fullPath));

        if (isEmpty(favoriteItems)) {
          return;
        }

        const unsetFoldersAsFavorite = favoriteItems.map(fav => {
          const newFavoriteFolderPath = fav.fullPath.replace(fullPath, entityName);
          return unsetFolderAsFavorite(fav.id, `${trashFolderName}/${newFavoriteFolderPath}`);
        });

        await Promise.allSettled(unsetFoldersAsFavorite);
      }
    }
  } catch (e) {
    const errorMessage = `Error delete the ${type} ${fullPath}. `;
    await w3n.log!('error', errorMessage, e);
  }
}
