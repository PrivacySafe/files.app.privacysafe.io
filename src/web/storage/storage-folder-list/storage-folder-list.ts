/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subscription } from 'rxjs'
import { storageStore } from '../common/storage-store'
import { SYNCED_FOLDERS_DEFAULT } from '../common/const'

export const ModuleName = '3nClient.components.storage-folder-list'

class Controller {
  private folders: client3N.StorageFolder[] = SYNCED_FOLDERS_DEFAULT
  private selectFolderId: string
  private selectFolderProc = new Subscription()
  
  static $inject = ['$scope', '$timeout']
  constructor(
    private $scope: angular.IScope,
    private $timeout: angular.ITimeoutService
  ) {
    this.$timeout(() => {
      this.selectFolderId = storageStore.values.currentFolderPath[0]
    })

    this.selectFolderProc = storageStore.change$.currentFolderPath
      .do(folderPath => {
        this.$timeout(() => {
          this.selectFolderId = folderPath[0]
        })
      })
      .subscribe()
  }

  $onDestroy(): void {
    this.selectFolderProc.unsubscribe()
  }

  selectStorageFolder(folder: client3N.StorageFolder): void {
    // if (this.selectFolderId !== folder.id && !folder.virtual) {
    if (this.selectFolderId !== folder.id) {
      this.selectFolderId = folder.id
      storageStore.values.currentFolderPath  = [folder.id]
    }
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/storage/storage-folder-list/storage-folder-list.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('storageFolderList', componentConfig)
}