/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import { Subscription } from 'rxjs'
import { storageStore, storageSrv } from '../common/storage-store'
import { prepareFolderContentsList, transformSizeToString, isObjectSelected } from '../common/helpers'
import { SYNCED_FOLDERS_DEFAULT } from '../common/const'

export const ModuleName = '3nClient.components.storage-content'

class Controller {
  private selectFolder: string = ''
  private selectFolderProc = new Subscription()
  private selectFolderContentsList: client3N.FolderEntity[] = []
  private sortingRule: {field: string, order: '+'|'-'} = {
    field: 'type',
    order: '-'
  }

  static $inject = ['$rootScope', '$timeout']
  constructor(
    private $rootScope: angular.IRootScopeService,
    private $timeout: angular.ITimeoutService
  ) {
    this.reDraw()

    this.selectFolderProc = storageStore.change$.currentFolderPath
      .do(folderPath => {
        this.reDraw()
      })
      .subscribe()

    this.$rootScope.$on('storage-folder-content_refresh', () => {
      console.info('REFRESH CONTENT!')
      this.reDraw()
    })

    this.$rootScope.$on('clear-selected-folder-entity', () => {
      this.selectFolderContentsList.forEach(item => {
        item.isSelected = false
      })
      storageStore.values.selectObjects = []
    })

    this.$rootScope.$on('select-all-folder-entity', () => {
      this.selectFolderContentsList.forEach(item => {
        item.isSelected = true
      })
      storageStore.values.selectObjects = this.selectFolderContentsList.slice()
    })

    this.$rootScope.$on('storage-favorite-remove', (event, data: client3N.FolderEntity[]) => {
      this.favoritesControl(data, 'remove')
    })
  }

  $onDestroy(): void {
    this.selectFolderProc.unsubscribe()
  }

  private changeSelectFolderContentsList(fullFolderPath: string): void {
    const placeId = SYNCED_FOLDERS_DEFAULT.find(folder => folder.id === storageStore.values.currentFolderPath[0]).placeId
    prepareFolderContentsList(placeId, fullFolderPath)
      .then(res => {
        this.$timeout()
          .then(() => {
            this.$timeout(() => {
              const newList = this.sorting(res, this.sortingRule)
              newList.forEach(item => {
                const ind = isObjectSelected(item, storageStore.values.selectObjects)
                item.isSelected = ind ? true : false
              })
              this.selectFolderContentsList = newList
            })
          })
      })
  }

  private setSelectFolder(): void {
    if (storageStore.values.currentFolderPath.length === 1) {
      this.selectFolder = SYNCED_FOLDERS_DEFAULT.find(folder => folder.id === storageStore.values.currentFolderPath[0]).rootPath
    } else {
      this.selectFolder = `${SYNCED_FOLDERS_DEFAULT.find(folder => folder.id === storageStore.values.currentFolderPath[0]).rootPath}/${storageStore.values.currentFolderPath.slice(1).join('/')}`
    }
  }

  private reDraw(): void {
    this.setSelectFolder()
    this.changeSelectFolderContentsList(this.selectFolder)
  }

  private getSize(size: number): string {
    return transformSizeToString(size)
  }

  private sorting(arr: client3N.FolderEntity[], rule: {field: string, order: '+'|'-'}): client3N.FolderEntity[] {
    let sortedList = arr.slice()
    sortedList.sort((a: client3N.FolderEntity, b: client3N.FolderEntity) => {
      if (a[rule.field] > b[rule.field]) {
        return (rule.order === '+') ? 1 : -1
      }
      if (a[rule.field] < b[rule.field]) {
        return (rule.order === '+') ? -1 : 1
      }
      return 0
    })
    return sortedList
  }

  private sortingChange(field: string): void {
    if (this.sortingRule.field === field) {
      this.sortingRule.order = (this.sortingRule.order === '+') ? '-' : '+'
    } else {
      this.sortingRule = {
        field: field,
        order: '+'
      }
    }
    const sordetList = this.sorting(this.selectFolderContentsList, this.sortingRule)
    this.$timeout(() => {
      this.selectFolderContentsList = sordetList
    })
  }

  private openFolder(item: client3N.FolderEntity) {
    if (item.type === 'folder') {
      let currentFolderPath = storageStore.values.currentFolderPath.concat(item.name)
      storageStore.values.currentFolderPath = currentFolderPath
      storageStore.values.selectObjects = []
    }
  }

  private isFolderFavoririte(item: client3N.FolderEntity): boolean {
    if (item.type === 'folder') {
      return storageStore.values.favoriteFolders.some(favorite => favorite.name === item.name && favorite.path === item.path && favorite.placeId === item.placeId)
    }
    return false
  }

  private favoritesControl(entities: client3N.FolderEntity[], action: 'add'|'remove'): void {
    const tmpFavoriteFolders = storageStore.values.favoriteFolders.slice()
    switch (action) {
      case 'add':
        for (let item of entities) {
          if (item.type === 'folder') {
            tmpFavoriteFolders.push({
              name: item.name,
              placeId: item.placeId,
              rootFolderId: storageStore.values.currentFolderPath[0],
              path: item.path
            })
          }
        }
        break
      case 'remove':
        for (let item of entities) {
          if (item.type === 'folder') {
            const itemIndex = tmpFavoriteFolders.findIndex(itm => itm.name === item.name && itm.path === item.path)
            if (itemIndex !== -1) {
              tmpFavoriteFolders.splice(itemIndex, 1)
            }
          }
        }
        break
    }
    storageStore.values.favoriteFolders = tmpFavoriteFolders
  }

  private selectObj(item: client3N.FolderEntity, index: number): void {
    const tmpSelectObjects = storageStore.values.selectObjects.slice()
    const pos = isObjectSelected(item, tmpSelectObjects)
    if (this.selectFolderContentsList[index].isSelected) {
      tmpSelectObjects.splice(pos, 1)
    } else {
      tmpSelectObjects.push(item)
    }
    storageStore.values.selectObjects = tmpSelectObjects.slice()
    this.$timeout(() => {
      this.selectFolderContentsList[index].isSelected = !this.selectFolderContentsList[index].isSelected
    })
  }

}

const componentConfig: angular.IComponentOptions = {
  bindings: {},
  templateUrl: './templates/storage/storage-content/storage-content.html',
  controller: Controller
}

export function addComponent(angular: angular.IAngularStatic): void {
  const module = angular.module(ModuleName, [])
  module.component('storageContent', componentConfig)
}
