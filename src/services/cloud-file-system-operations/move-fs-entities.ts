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
import { moveFsEntity } from './move-fs-entity';
import { getEntityTargetPath } from './get-entity-target-path';
import { useFavoriteStore } from '@/store';
import type { ListingEntryExtended } from '@/types';

export async function moveFsEntities({
  fs,
  entities,
  targetFolder,
}: {
  fs: web3n.files.WritableFS;
  entities: ListingEntryExtended[];
  targetFolder: string;
}): Promise<void> {
  const favoriteStore = useFavoriteStore();

  try {
    const favoriteFoldersForProcessing: Array<ListingEntryExtended & { newFullPath: string }> = [];
    const processes: Promise<void>[] = [];

    for (const entity of entities) {
      const { fullPath, type, favoriteId } = entity;
      const entityTargetPath = await getEntityTargetPath({ fs, entity, targetFolder });

      processes.push(moveFsEntity({ fs, oldFullPath: fullPath, newFullPath: entityTargetPath }));

      if (type === 'folder' && favoriteId) {
        const isFavoriteFolderInList = !!favoriteStore.favoriteFolders.find(fav => fav.id === favoriteId);
        isFavoriteFolderInList &&
          favoriteFoldersForProcessing.push({
            ...entity,
            newFullPath: entityTargetPath,
          });
      }
    }

    await Promise.allSettled(processes);

    if (!isEmpty(favoriteFoldersForProcessing)) {
      const processes1: Promise<void>[] = [];
      for (const folder of favoriteFoldersForProcessing) {
        const { favoriteId, newFullPath } = folder;
        processes1.push(favoriteStore.updateFavoriteFolder(favoriteId!, newFullPath));
      }

      await Promise.allSettled(processes1);
    }
  } catch (err) {
    const errorMessage = `Error while moving the ${entities}`;
    await w3n.log!('error', errorMessage, err);
    throw err;
  }
}
