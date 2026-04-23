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
import { executeFunc } from '@shared/utils/execute-function';
import type { ListingEntryExtended } from '@shared/types';

export async function downloadEntities({
  fs,
  entities,
}: {
  fs: web3n.files.WritableFS;
  entities: ListingEntryExtended[];
}): Promise<void> {
  try {
    // @ts-ignore
    const targetFs = await w3n?.shell?.fileDialogs?.saveFolderDialog('Select a folder for downloading', 'Ok');

    if (!targetFs) {
      return;
    }

    for (const entity of entities) {
      const { name, type, fullPath } = entity;
      switch (type) {
        case 'folder': {
          const folder = await executeFunc({
            fn: fs.readonlySubRoot,
            fnArgs: [fullPath],
          });
          folder && (await targetFs.saveFolder(folder, name));
          break;
        }
        case 'file': {
          const file = await executeFunc({
            fn: fs.readonlyFile,
            fnArgs: [fullPath],
            timeoutValue: 0,
          });
          file &&
            (await executeFunc({
              fn: targetFs.saveFile,
              fnArgs: [file, name],
              timeoutValue: 0,
            }));
          break;
        }
        case 'link': {
          const link = await executeFunc({
            fn: fs.readLink,
            fnArgs: [fullPath],
            errorText: `Error while link reading ${fullPath}`,
          });
          if (!link) {
            throw new Error(`Error while link reading ${fullPath}`);
          }

          const data = await link.target();

          if (link.isFolder) {
            await executeFunc({
              fn: targetFs.saveFolder,
              fnArgs: [data as web3n.files.ReadonlyFS, name],
            });
            return;
          }

          if (link.isFile) {
            await executeFunc({
              fn: targetFs.saveFile,
              fnArgs: [data as web3n.files.ReadonlyFile, name],
            });
          }
        }
      }
    }
  } catch (e) {
    w3n.log('error', `Error while downloading ${entities.map(entity => entity.name).join(', ')}. `, e);
    throw e;
  }
}
