/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { SingleProc } from '../../common/services/processes'
import { logError } from '../../common/libs/logging'

export class LocalStorageFile {
  private fs: web3n.files.WritableFS = null
  private initializing: Promise<void> = null
  private changeProc: SingleProc|undefined = new SingleProc()
  private valueToSave: any|undefined

  constructor() {
    this.initializing = w3n.storage.getAppLocalFS('app.3nweb.storage')
      .then(fs => {
        this.fs = fs
        this.initializing = null
      })
  }
  
  async isFilePresent(fileName: string): Promise<boolean> {
    if (this.initializing) { await this.initializing }
    const listFolder = await this.fs.listFolder('')
    return listFolder.some(item => item.isFile && item.name === fileName)
  }

  async readFile<T>(fileName: string): Promise<T> {
    if (this.initializing) { await this.initializing }
    return await this.fs.readJSONFile<T>(fileName)
      .catch((exc: web3n.files.FileException) => {
        logError(exc)
        throw exc
      })
  }

  saveFile<T>(fileName: string, data: T): Promise<void> {
    if (!this.changeProc) {
      throw new Error(`Json from ${fileName} is already closed.`)
    }
    this.valueToSave = data
    return this.changeProc.startOrChain(async () => {
      if (this.valueToSave !== data) { return }
      await this.fs.writeJSONFile(fileName, data)
    })
    .catch(err => logError(`Error occured when saving json to ${fileName}`, err))
  }


}
