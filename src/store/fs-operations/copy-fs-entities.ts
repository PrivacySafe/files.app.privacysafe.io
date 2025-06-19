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

export async function copyFsEntities({
  fs,
  entities,
  targetFs,
  targetFolder,
}: {
  fs: web3n.files.WritableFS;
  entities: ListingEntryExtended[];
  targetFs: web3n.files.WritableFS;
  targetFolder: string;
}): Promise<void> {
  try {
    const processes = [] as Promise<void>[];

    for (const entity of entities) {
      processes.push(copyFsEntity({ fs, entity, targetFs, targetFolder }));
    }
    await Promise.allSettled(processes);
  } catch (err) {
    const errorMessage = `Error while copying the ${entities.map(e => e.fullPath).join(', ')}`;
    await w3n.log!('error', errorMessage, err);
    throw err;
  }
}
