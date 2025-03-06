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
import { useFavoriteStore } from '@/store/favoririte.store';
import { useFsEntryStore } from '@/store/fs-entity.store';

export async function deleteEntityInFs({
  fs,
  path,
  entityType,
  trashFolderName,
}: {
  fs: web3n.files.WritableFS;
  path: string;
  entityType: 'folder' | 'file' | 'link';
  trashFolderName: string;
}): Promise<void> {
  const favoriteStore = useFavoriteStore();
  const { unsetFolderAsFavorite } = useFsEntryStore();

  try {
    const removeCompletely = path.includes(trashFolderName);
    if (removeCompletely) {
      switch (entityType) {
        case 'folder':
          await fs.deleteFolder(path, true);
          break;
        case 'file':
          await fs.deleteFile(path);
          break;
        case 'link':
          await fs.deleteLink(path);
          break;
      }

      return;
    }

    const parsedPath = path.split('/');
    const parentFolder = parsedPath.slice(0, -1).join('/');
    const entityName = parsedPath.pop();

    if (entityName) {
      await fs.move(path, `${trashFolderName}/${entityName}`);
      await fs!.updateXAttrs(`${trashFolderName}/${entityName}`, {
        set: { parentFolder },
      });

      if (entityType === 'folder') {
        const favoriteItems = favoriteStore.favoriteFolders.filter(fav => fav.fullPath.includes(path));
        if (isEmpty(favoriteItems)) {
          return;
        }

        const unsetFoldersAsFavorite = favoriteItems.map(fav => {
          const newFavoriteFolderPath = fav.fullPath.replace(path, entityName);
          return unsetFolderAsFavorite(fav.id, `${trashFolderName}/${newFavoriteFolderPath}`);
        });
        await Promise.all(unsetFoldersAsFavorite);
      }
    }
  } catch (e) {
    const errorMessage = `Error delete the ${entityType} ${path}. `;
    await w3n.log!('error', errorMessage, e);
  }
}
