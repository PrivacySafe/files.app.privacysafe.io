/*
 Copyright (C) 2018 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { STORAGE_PLACES, STORAGE_COLLECTIONS_LIST } from '../common/const'
import { storageSrv } from '../common/storage-store'
import { changeUploadFileName } from '../common/helpers'
import { FS } from '../../common/libs/attachments-container';

export let ModuleName = "3nClinet.services.storage-action-srv"
export let StorageActionsSrvName = "storageActionsService"

export function addService(angular: angular.IAngularStatic): void {
  const mod = angular.module(ModuleName, [])
  mod.service(StorageActionsSrvName, Srv)
}

export class Srv {

  private static storageSrv = storageSrv; // exposing to test

  static $inject = ['$q', '$mdDialog']
  constructor(
    private $q: angular.IQService,
    private $mdDialog: angular.material.IDialogService
  ) {}


  deleteFolderEntities(data: client3N.FolderEntity[], completeDelete?: boolean): ng.IPromise<boolean> {
    if (completeDelete) {
      return this.completeDelete(data)
    } else {
      return this.$q.when(this.deleteToTrash(data))
    }
  }

  completeDelete(data: client3N.FolderEntity[]): ng.IPromise<boolean> {
    const confirm = this.$mdDialog.confirm()
      .title('Are you sure?')
      .textContent('The selected objects will be permanently deleted!')
      .ariaLabel('delete dialog')
      .ok('OK!')
      .cancel('Cancel')

    return this.$mdDialog.show(confirm)
      .then(() => {
        let promises: Promise<void>[] = []
        data.forEach(item => {
          switch(item.type) {
            case 'file':
              promises.push(storageSrv.deleteFile(item.placeId, item.path))
              break
            case 'folder':
              promises.push(storageSrv.deleteFolder(item.placeId, item.path))
              break
            case 'link':
              promises.push(storageSrv.deleteLink(item.placeId, item.path))
              break
          }
        })
        return this.$q.when(Promise.all(promises))
          .then(res => {
            return true
          })
          .catch(err => {
            console.error(err)
            return false
          })
      })
  }

  async deleteToTrash(data: client3N.FolderEntity[]): Promise<boolean> {
    let promises: Promise<void>[] = []
    let trashInfoPromises: Promise<void>[] = []
    for (let item of data) {
      const newFileName = await changeUploadFileName(item.placeId, '.trash' + item.path.replace(`/${item.name}`, ''), item.name)
      const newPath = item.path.replace(`/${item.name}`, '') + `/${newFileName}`
      
      const { root, pathInRoot } = await storageSrv.places.getRootFSFor(item.placeId, item.path)

      promises.push(storageSrv.moveOrStartCopy(item.placeId, item.path, item.placeId, `.trash/${newPath}`))

      // console.log(`Source place: ${item.placeId} | Source path: ${item.path} | Target place: ${item.placeId} | Target path: ${newPath}`)

      const trashInfo: client3N.TrashSystemInfo = {
        originalName: item.name,
        type: item.type,
        placeId: item.placeId,
        path: item.path,
        deletionTimestamp: Date.now()
      }

      trashInfoPromises.push(root.writeJSONFile(`.trash/.info/${newPath}.trashinfo`, trashInfo))
    }

    return Promise.all(promises)
      .then(res => {
        return Promise.all(trashInfoPromises)
      })
      .then(res => {
        return true
      })
      .catch(err => {
        console.error(err)
        return false
      })
  }

  async saveSelectObjToExternalFS(data: client3N.FolderEntity[]): Promise<void|boolean> {
    const destinationFolder = await w3n.shell.fileDialogs.openFolderDialog('Save select object(s)', null, false)

    if (destinationFolder) {
      let promises: Promise<void>[] = [];
      for (let item of data) {
        const { rootFS, rootCollection, pathInRoot } = await storageSrv.places.getRootFor(item.placeId, item.path);
        if (rootFS) {
          switch (item.type) {
            case 'file':
              const currentFile = await rootFS.readonlyFile(pathInRoot);
              promises.push(destinationFolder[0].saveFile(currentFile, item.name));
              break;
            case 'folder':
              const currentFolder = await rootFS.readonlySubRoot(pathInRoot);
              promises.push(destinationFolder[0].saveFolder(currentFolder, item.name));
              break;
          }
        } else {
          const fsItem = await rootCollection.get(pathInRoot);
          if (fsItem.item) {
            switch (item.type) {
              case 'file':
                promises.push(destinationFolder[0].saveFile((fsItem.item as client3N.ReadonlyFile), item.name));
                break;
              case 'folder':
                const currentFolder = await (fsItem.item as client3N.WritableFS).readonlySubRoot(pathInRoot);
                promises.push(destinationFolder[0].saveFolder(currentFolder, item.name));
                break;
            }
          } else if (fsItem.location) {
            switch (item.type) {
              case 'file':
                const currentFile = await fsItem.location.fs.readonlyFile(fsItem.location.path);
                promises.push(destinationFolder[0].saveFile(currentFile, item.name));
                break;
              case 'folder':
                const currentFolder = await fsItem.location.fs.readonlySubRoot(fsItem.location.path);
                promises.push(destinationFolder[0].saveFolder(currentFolder, item.name));
                break;
            }
          } else {
            throw new Error('Missing location or item in FSItem.');
          }
        }
      }
      Promise.all(promises);
    } else {
      return false;
    }
  }

}
