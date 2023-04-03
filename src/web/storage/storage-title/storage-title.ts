/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subscription } from 'rxjs'
import { storageStore } from '../common/storage-store'
import { SYNCED_FOLDERS_DEFAULT } from '../common/const'
import { loadFilesFromExternalFS } from '../common/helpers'

export const ModuleName = '3nClient.components.storage-title'

class Controller {
  private proc = {
    changeFolder: new Subscription()
  }
  private currentFolderPath: string[]

  static $inject = ['$rootScope', '$timeout', '$mdDialog']
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService,
    private $mdDialog: angular.material.IDialogService
  ) {
    this.$timeout(() => {
      this.currentFolderPath = storageStore.values.currentFolderPath.slice()
    })

    this.proc.changeFolder = storageStore.change$.currentFolderPath
      .do(folder => {
        this.currentFolderPath = folder
      })
      .subscribe()
  }

  $onDestroy() {
    this.proc.changeFolder.unsubscribe()
  }

  create(ev: MouseEvent): void {
    this.$mdDialog.show({
      templateUrl: `./templates/storage/storage-title/create-dialog.html`,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      controller: ($scope: angular.IScope, $mdDialog: angular.material.IDialogService) => {
        $scope.close = (): void => {
          $mdDialog.cancel()
        }

        $scope.action = (mode: string): void => {
          $mdDialog.hide(mode)
        }
      }
    }).then(async (mode: string) => {
      switch (mode) {
        case 'folder':
          storageStore.values.selectObjects = [
            {
              type: 'folder',
              isNew: true,
              name: '',
              placeId: storageStore.values.currentPlacesId,
              path: '',
              owner: 'me',
              date: Date.now(),
              size: null
            }
          ]
          break;
        case 'upload':
          await loadFilesFromExternalFS(storageStore.values.currentPlacesId, storageStore.values.currentFolderPath.slice(1).join('/'))
          this.$rootScope.$emit('storage-folder-content_refresh')
          break;
      }
    })
  }

  getBasePath(): string {
    return SYNCED_FOLDERS_DEFAULT.find(folder => folder.id === storageStore.values.currentFolderPath[0]).rootPathName
  }

  goPath(ind: number): void {
    if (ind !== (storageStore.values.currentFolderPath.length - 1)) {
      storageStore.values.currentFolderPath = storageStore.values.currentFolderPath.slice(0, ind + 1)
    }
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/storage/storage-title/storage-title.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('storageTitle', componentConfig)
}