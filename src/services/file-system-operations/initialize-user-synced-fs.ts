/*
 Copyright (C) 2025 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';

export async function initializeUserSyncedFs(): Promise<web3n.files.WritableFS> {
  const fsItem = await w3n.storage?.getUserFS!('synced');

  if (!fsItem) {
    await w3n.log('error', 'Error while initialize user-synced FS');
    throw new Error('Error while initialize user-synced FS');
  }

  const fs = fsItem.item as web3n.files.WritableFS;
  const user = await w3n.mailerid?.getUserId();
  const trashFolderName = `.trash-folder-${user || ''}`;
  const isTrashFolderPresent = await fs!.checkFolderPresence(trashFolderName);

  if (!isTrashFolderPresent) {
    await fs.makeFolder(trashFolderName);
    await fs!.updateXAttrs(trashFolderName, {
      set: { id: getRandomId(16) },
    });
  }

  return fs;
}
