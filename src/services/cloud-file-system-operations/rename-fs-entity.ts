/*
 Copyright (C) 2024-2025 3NSoft Inc.

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
import { moveFsEntity } from './move-fs-entity';

export async function renameFsEntity({
  fs,
  oldPath,
  newName,
}: {
  fs: web3n.files.WritableFS;
  oldPath: string;
  newName: string;
}): Promise<void> {
  try {
    const oldPathParts = oldPath.split('/');
    const newPath = `${oldPathParts.slice(0, -1).join('/')}/${newName}`;
    await moveFsEntity({ fs: fs!, oldFullPath: oldPath, newFullPath: newPath });
  } catch (e) {
    const errorMessage = `Error renaming the entity ${oldPath}. `;
    console.error(errorMessage, e);
    await w3n.log!('error', errorMessage, e);
  }
}
