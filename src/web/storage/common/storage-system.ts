/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { SingleProc } from '../../common/services/processes'
import { logError } from '../../common/libs/logging'

export class StorageSystem {
  private fs: client3N.WritableFS = null
  private initializing: Promise<void> = null
  private valueToSave: any
  protected changeProc: SingleProc|undefined = new SingleProc()

  constructor() {
    this.initializing = w3n.storage.getAppSyncedFS()
      .then(fs => {
        this.fs = fs
        this.initializing = null
      })
  }

  async saveStorageSysFile<T>(fullFileName: string, val: T): Promise<void> {
    if (this.initializing) { await this.initializing }

    if (!this.changeProc) {
      throw new Error(`Json from ${fullFileName} is already closed.`)
    }

    this.valueToSave = val
    return this.changeProc.startOrChain(async () => {
      if (this.valueToSave !== val) { return }
      await this.fs.writeJSONFile(fullFileName, val)
    })
    .catch( err => logError(`Error occured when saving json to ${fullFileName}`, err))
  }

  async readStorageSysFile<T>(fullFileName: string): Promise<T>|null {
    if (this.initializing) { await this.initializing }
    return await this.fs.readJSONFile<T>(fullFileName)
      .catch((exc: client3N.FileException) => {
        if (exc.notFound) {
          return null
        } else {
          throw exc
        }
      })
  }

}
