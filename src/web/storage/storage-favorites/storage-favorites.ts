/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subscription } from 'rxjs'
import { storageStore } from '../common/storage-store'
import { SYSTEM_FILES, SYNCED_FOLDERS_DEFAULT } from '../common/const'
import { LocalStorageFile } from '../common/storage-file'

export const ModuleName = '3nClient.components.storage-favorites'

class Controller {
  private favorites: client3N.FavoriteStorageFolder[]
  private favoritesProc = new Subscription()
  private sysFileSrv = new LocalStorageFile()

  static $inject = ['$timeout']
  constructor(
    private $timeout: angular.ITimeoutService
  ) {
    this.$timeout(() => {
      this.favorites = storageStore.values.favoriteFolders.slice()
    })

    this.favoritesProc = storageStore.change$.favoriteFolders
      .do(val => {
        this.$timeout(() => {
          this.favorites = storageStore.values.favoriteFolders.slice()
          this.sysFileSrv.saveFile(SYSTEM_FILES.FAVORITE_FOLDERS, this.favorites)
        })
      })
      .subscribe()
  }

  $onDestroy(): void {
    this.favoritesProc.unsubscribe()
  }

  openFavFolder(folder: client3N.FavoriteStorageFolder): void {
    const fullFolderPath = [folder.rootFolderId].concat(folder.path.split('/').slice(1))
    // console.log(`Open folder: ${JSON.stringify(fullFolderPath)}`)
    storageStore.values.currentFolderPath = fullFolderPath
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/storage/storage-favorites/storage-favorites.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('storageFavorites', componentConfig)
}