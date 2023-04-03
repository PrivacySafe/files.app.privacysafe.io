/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

import { STORAGE_COLLECTIONS_LIST } from './const'
import { storageSrv } from './storage-store'

/**
 * Is already present a folder with this name in current folder
 * @param placeId {string}
 * @param parentFolder {string}
 * @param folderName {string}
 * @return {Promise<void>}
 */
export async function checkFolderName(placeId: string, parentFolder: string, folderName: string): Promise<boolean> {
  const parentFolderList = await storageSrv.list(placeId, parentFolder)
  return parentFolderList.lst.some(item => item.isFolder && item.name === folderName)
}

/**
 *  Folder list data transform to data for display
 * @param placeId {string}
 * @param folderPath {string}
 * @return {Promise<client3N.FolderEntity[]>}
 */
export async function prepareFolderContentsList(placeId: string, folderPath: string): Promise<client3N.FolderEntity[]> {
  // console.log(arguments)
  const folderList = await storageSrv.list(placeId, folderPath)
  console.log(folderList)
  const folderEntity = folderList.lst
    .filter(item => item.name[0] !== '.')
    .map(item => {
      const entity: client3N.FolderEntity = {
        type: item.isFile ? 'file' : (item.isFolder ? 'folder' : 'link'),
        name: item.name,
        placeId: placeId,
        path: (folderPath && folderPath !== '/') ? `${folderPath}/${item.name}` : `${item.name}`,
        owner: 'me',
        date: 0,
        size: 0
      }
      return entity
    })
  
  if (STORAGE_COLLECTIONS_LIST.indexOf(placeId) === -1) {
    const {root, pathInRoot} = await storageSrv.places.getRootFSFor(placeId, folderPath)
    folderEntity.forEach(async (item) => {
      console.log(item)
      if (item.type === 'file') {
        const stat = await root.stat(item.path)
        item.size = stat.size
      }
    })
  } else {
    const { rootCollection } = await storageSrv.places.getRootFor(placeId, folderPath)
    folderEntity.forEach(async (item) => {
      console.log(item)
      if (item.type === 'file') {
        const fsItem = await rootCollection.get(item.name)
        if (fsItem.item) {
          const stat = await (fsItem.item as web3n.files.File).stat()
          item.size = stat.size
        } else {
          const stat = await fsItem.location.fs.stat(fsItem.location.path)
          item.size = stat.size
        }
      }
    })
    
  }

  
  return folderEntity
}

export async function loadFilesFromExternalFS(placeId: string, path: string): Promise<void> {
  // console.info(`Upload file's ...`)
  // console.log(arguments)

  const title = 'Select file(s):'
  const uploadFiles = await w3n.shell.fileDialogs.openFileDialog(title, null, true)
  // console.log(uploadFiles)

  if (uploadFiles) {
    const { root, pathInRoot } = await storageSrv.places.getRootFSFor(placeId, path)
    const promises: Promise<void>[] = []
    for (let file of uploadFiles) {
      const newFileName = await changeUploadFileName(placeId, path, file.name)
      const fullFileName = `${pathInRoot}/${newFileName}`
      promises.push(root.saveFile(file, fullFileName))
    }
    Promise.all(promises)
  }
}

export async function changeUploadFileName(placeId: string, path: string, fileName: string): Promise<string> {
  const { containerType, lst } = await storageSrv.list(placeId, path)
  let newFileName = fileName
  let isEnd = false
  while (!isEnd) {
    const isPresent = lst.some(item => item.isFile && item.name === newFileName)
    if (!isPresent) {
      isEnd = true
    } else {
      const position = newFileName.lastIndexOf('.')
      let _fileName: string = null
			let _fileExt: string = null
			if (position !== -1) {
				_fileName = newFileName.substring(0, position)
				_fileExt = newFileName.substr(position + 1)
			} else {
				_fileName = newFileName
			}

      if (!/\(\d+\)/.test(newFileName)) {
				_fileName = _fileName + '(1)' + (!!_fileExt ? `.${_fileExt}` : '')
			} else {
				const pos = _fileName.lastIndexOf('(')
				let val = parseInt(_fileName.substring(pos + 1, _fileName.length - 1))
				val += 1
				let _fileNamePart = _fileName.substring(0, pos + 1)
				_fileName = _fileNamePart + val + ')' + (!!_fileExt ? `.${_fileExt}` : '')
			}
			newFileName = _fileName
    }
  }
  return newFileName
}

export function transformSizeToString(size: number): string {
  if (size < 900) {
    return `${size} `
  }

  if (size < (900 * 1024) ) {
    return `${Math.round(size / 1024 * 100) / 100} KB`
  }

  if (size < (900 * 1024 * 1024)) {
    return `${Math.round(size / (1024 * 1024) * 100) / 100} MB`
  }

  return `${Math.round(size / (1024 * 1024 * 1024) * 100) / 100} GB`
}

function converByControlPoints(obj: client3N.FolderEntity): string {
  let res: any = {
    type: obj.type,
    name: obj.name,
    path: obj.path,
    date: obj.date
  }
  if (obj.placeId) { res.placeId = obj.placeId }
  if (obj.size) { res.size = obj.size }
  return JSON.stringify(res)
}

export function isObjectSelected(obj: client3N.FolderEntity, selected: client3N.FolderEntity[]): number|null {
  const objStr = converByControlPoints(obj)
  let index: number|null = null
  selected.forEach((val, i) => {
    index = JSON.stringify(val) === objStr ? i : index
  })
  return index
}

export function convertTimestamp(timestamp: number): string {
  const res = {
    date: new Date(timestamp).getDate(),
    month: new Date(timestamp).getMonth() + 1,
    year: new Date(timestamp).getFullYear(),
    hours: new Date(timestamp).getUTCHours(),
    min: new Date(timestamp).getMinutes(),
    sec: new Date(timestamp).getSeconds()
  }

  console.log()

  return `${res.date}.${res.month}.${res.year} - ${res.hours}:${res.min}:${res.sec}`
}
