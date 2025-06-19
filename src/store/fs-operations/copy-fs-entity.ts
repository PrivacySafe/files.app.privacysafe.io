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
import { getEntityTargetPath } from './get-entity-target-path';
import type { ListingEntryExtended } from '@/types';

export async function copyFsEntity({
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
  const { type, fullPath } = entity;

  try {
    switch (type) {
      case 'folder': {
        const folder = await fs.readonlySubRoot(entity.fullPath);
        const entityNewPath = await getEntityTargetPath({ fs: targetFs, entity, targetFolder, targetEntityName });
        await targetFs.saveFolder(folder, entityNewPath);
        break;
      }
      case 'file': {
        const file = await fs.readonlyFile(entity.fullPath);
        const entityNewPath = await getEntityTargetPath({ fs: targetFs, entity, targetFolder, targetEntityName });
        await targetFs.saveFile(file, entityNewPath);
        break;
      }
      case 'link': {
        const link = await fs.readLink(fullPath);
        const data = await link.target();

        if (link.isFolder) {
          const entityNewPath = await getEntityTargetPath({ fs: targetFs, entity, targetFolder, targetEntityName });
          await targetFs.saveFolder(data as web3n.files.FS, entityNewPath);
        }

        if (link.isFile) {
          const entityNewPath = await getEntityTargetPath({ fs: targetFs, entity, targetFolder, targetEntityName });
          await targetFs.saveFile(data as web3n.files.File, entityNewPath);
        }

        break;
      }
    }
  } catch (err) {
    const errorMessage = `Error while copying the ${entity.fullPath}`;
    await w3n.log!('error', errorMessage, err);
    throw err;
  }
}
