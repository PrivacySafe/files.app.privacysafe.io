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
import { makeServiceCaller } from '@shared/utils/ipc/ipc-service-caller';
import type { StorageService } from '../../src-deno/storage-deno';

export let appStorageSrv: StorageService;

export async function initializationServices() {
  try {
    const srvConnection = await w3n.rpc!.thisApp!('AppStorageInternal');
    appStorageSrv = makeServiceCaller<StorageService>(srvConnection, [
      'getFs',
      'getFavorites',
      'addFavorite',
      'updateFavorite',
      'deleteFavorite',

      'initializeFsItems',
      'getTrashFolderName',

      'synchronizationQueueInitialProcess',
      'syncUpload',
      'startSyncUpload',
      'startSyncDownload',
      'adoptRemote',

      'isEntityPresent',
      'updateEntityXAttrs',
      'deleteEntityXAttrs',
      'getEntityStats',
      'getSyncedStatus',
      'isRemoteVersionOnDisk',
      'makeFolder',
      'getFolderContentList',
      'getFolderContentFilledList',
      'moveEntity',
      'moveEntities',
      'copyEntities',
      'copyMoveEntities',
      'renameEntity',
      'deleteEntity',
      'restoreEntity',
      'setFolderAsFavorite',
      'unsetFolderAsFavorite',
      'removeFavoriteFolderFromList',
    ]) as StorageService;

    console.info('<- SERVICES ARE INITIALIZED ->');
  } catch (e) {
    console.error('# ERROR WHILE SERVICES INITIALISE # ', e);
  }
}
