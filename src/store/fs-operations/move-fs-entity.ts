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
import { copyFsEntity } from './copy-fs-entity';
import type { ListingEntryExtended } from '@/types';

export async function moveFsEntity({
  fs,
  entity,
  targetFs,
  targetFolder,
  targetEntityName,
}: {
  fs: web3n.files.WritableFS;
  entity: ListingEntryExtended;
  targetFs: web3n.files.WritableFS;
  targetFolder: string;
  targetEntityName?: string;
}): Promise<void> {
  const { name, type, fullPath } = entity;
  try {
    await copyFsEntity({ fs, entity, targetFs, targetFolder, targetEntityName: targetEntityName || name });

    switch (type) {
      case 'folder':
        await fs.deleteFolder(fullPath, true);
        break;
      case 'file':
        await fs.deleteFile(fullPath);
        break;
      case 'link':
        await fs.deleteLink(fullPath);
        break;
    }
  } catch (e) {
    const errorMessage = `Error move entity ${entity.fullPath}. `;
    console.error(errorMessage, e);
    await w3n.log!('error', errorMessage, e);
    throw e;
  }
}
