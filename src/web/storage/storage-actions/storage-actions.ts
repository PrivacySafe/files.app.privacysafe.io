/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { Subscription } from 'rxjs'
import { storageStore, storageSrv } from '../common/storage-store'
import { checkFolderName, transformSizeToString, convertTimestamp } from '../common/helpers'
import * as CommonSrvMod from '../../common/services/common-srv'
import * as StorageActionsSrvMod from './storage-action-srv'


export const ModuleName = '3nClient.components.storage-actions'

class Controller {
  private selectObjects: client3N.FolderEntity[]
  private isFolderTrash: boolean
  private selectedMode: 'create'|'rename'|'delete'|'show'|null
  private areSelectAll: boolean = false
  private editObjName: string = ''
  private proc = {
    selectObjects: new Subscription(),
    rootFolder: new Subscription()
  }

  static $inject = ['$rootScope', '$timeout', CommonSrvMod.CommonSrvName, StorageActionsSrvMod.StorageActionsSrvName]
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService,
    private _commonSrv: CommonSrvMod.Srv,
    private _actions: StorageActionsSrvMod.Srv
  ) {
    this.$timeout(() => {
      this.selectObjects = storageStore.values.selectObjects
      this.isFolderTrash = storageStore.values.currentFolderPath[0] === '99' ? true : false
    })

    this.proc.selectObjects = storageStore.change$.selectObjects
      .do(selectedObjects => {
        if (selectedObjects.length > 0) {
          if (selectedObjects[0].isNew) {
            this.createNewFolder()
          } else {
            this.selectedMode = 'show'
          }
        } else {
          this.selectedMode = null
        }
        this.$timeout(() => {
          this.selectObjects = selectedObjects
        })
      })
      .subscribe()

    this.proc.rootFolder = storageStore.change$.currentFolderPath
      .do(path => {
        this.isFolderTrash = path[0] === '99' ? true : false
      })
      .subscribe()
  }

  $onDestroy() {
    this.proc.selectObjects.unsubscribe()
    this.proc.rootFolder.unsubscribe()
  }

  /* блок создания новой папки */
  createNewFolder() {
    this.selectedMode = 'create'
    this.editObjName = ''
    this.$timeout(() => {
      (document.querySelector('#edit') as HTMLElement).focus()
    })
  }

  preSaveCreateFolder(event: JQueryKeyEventObject): void {
    const keycode = event.keyCode || event.which
    if (keycode === 13) {
      if (this.editObjName.length > 0) {
        this.runSaveEditFolder(this.editObjName)
        this.cancelCreateFolder()
      }
    }
    if (keycode === 27) {
      this.cancelCreateFolder()
    }
  }

  cancelCreateFolder(): void {
    this.selectedMode = null
    this.editObjName = ''
    storageStore.values.selectObjects = []
  }

  async runSaveEditFolder(folderName: string): Promise<void> {
    const currentFolderPath = storageStore.values.currentFolderPath.slice(1).join('/')
    const isNewFolderPresent = await checkFolderName(storageStore.values.currentPlacesId, currentFolderPath, folderName)
    if (isNewFolderPresent) {
      return this._commonSrv.sysNotification('error', null, `Folders with the name ${folderName} already exists! Please enter a different name.`)
        .then(() => {
          (document.querySelector('#edit') as HTMLElement).focus()
        })
    } else {
      const fullNewFolderPath = `${currentFolderPath}/${folderName}`
      await storageSrv.makeFolder(storageStore.values.currentPlacesId, fullNewFolderPath)
      this.$rootScope.$emit('storage-folder-content_refresh')
    }
  }
  
  clearSelected(): void {
    this.$rootScope.$emit('clear-selected-folder-entity')
  }

  showDate(timestamp: number): string {
    return convertTimestamp(timestamp)
  }

  showSize(size: number): string {
    return transformSizeToString(size)
  }

  async runAction(action: 'select_all'|'copy'|'share'|'send'|'download'|'tag'|'del'): Promise<void> {
    switch (action) {
      case 'select_all':
        console.log(`ACTION: ${!this.areSelectAll ? 'SELECT ALL' : 'DESELECT ALL'}`)
        if (!this.areSelectAll) {
          this.areSelectAll = true
          this.$rootScope.$emit('select-all-folder-entity')
        } else {
          this.areSelectAll = false
          this.$rootScope.$emit('clear-selected-folder-entity')
        }
        break
      case 'copy':
        console.log(`ACTION: COPY/MOVE TO`)
        break
      case 'share':
        console.log(`ACTION: SHARE`)
        break
      case 'send':
        console.log(`ACTION: SEND`)
        break
      case 'download':
        console.log(`ACTION: DOWNLOAD`)
        this._actions.saveSelectObjToExternalFS(storageStore.values.selectObjects)
          .then(res => {
            if (res !== false) {
              this._commonSrv.sysNotification('success', null, 'The objects have downloaded!');
              this.$rootScope.$emit('clear-selected-folder-entity')
            }
          })
          .catch(err => {
            console.error(err)
            this._commonSrv.sysNotification('error', null, 'Error downloading objects')
          })

        break
      case 'tag':
        console.log(`ACTION: ADD TAG`)
        break
      case 'del':
        console.log(`ACTION: DELETE`)
        console.log(storageStore.values.selectObjects)
        console.log(`Trash: ${this.isFolderTrash}`)
        
        this._actions.deleteFolderEntities(storageStore.values.selectObjects)
          .then(() => {
            this.$rootScope.$emit('storage-favorite-remove', storageStore.values.selectObjects)
            this._commonSrv.sysNotification('success', null, 'The objects have deleted!');
            this.$rootScope.$emit('storage-folder-content_refresh')
          })
          .catch(err => {
            console.error(err)
            this._commonSrv.sysNotification('error', null, 'Error deleting objects');
          })
          
        break
    }
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/storage/storage-actions/storage-actions.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('storageActions', componentConfig)
}