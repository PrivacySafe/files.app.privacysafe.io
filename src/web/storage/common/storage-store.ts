/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { STORAGE_PLACES } from './const'
import { Store } from './store'
import { StorageSrv } from './storage-srv'

export const storageSrv = new StorageSrv() 

interface Fields {
  currentPlacesId: string;
  currentFolderPath: string[];
  favoriteFolders: client3N.FavoriteStorageFolder[];
  selectObjects: client3N.FolderEntity[];
}

export const storageStore = new Store<Fields>()

storageStore.values.currentPlacesId = STORAGE_PLACES.userSynced
/**
 * в storageStore.values.currentFolderPath 0 элемент должен
 * содержать id родительской папки (смотри SYNCED_FOLDERS_DEFAULT)
 */
storageStore.values.currentFolderPath = ['10']
storageStore.values.favoriteFolders = []
storageStore.values.selectObjects = []
