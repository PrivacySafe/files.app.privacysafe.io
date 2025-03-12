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
import { getFileExtension } from '@v1nt1248/3nclient-lib/utils';
import { isThereEntityWithSameName } from '@/services/cloud-file-system-operations/is-there-entity-with-same-name';
import type { ListingEntryExtended } from '@/types';

export async function getEntityTargetPath({
  fs,
  entity,
  targetFolder,
  namePostfix = 'copy',
}: {
  fs: web3n.files.WritableFS;
  entity: ListingEntryExtended;
  targetFolder: string;
  namePostfix?: string;
}): Promise<string> {
  const { type, name, fullPath } = entity;

  const possibleEntityNewPath = `${targetFolder}/${name}`;
  const isEntityPresentInTargetFolder = await isThereEntityWithSameName({
    fs,
    entityPath: possibleEntityNewPath,
    entityType: type,
  });

  if (type === 'folder') {
    return isEntityPresentInTargetFolder ? `${possibleEntityNewPath}_${namePostfix}` : possibleEntityNewPath;
  }

  if (type === 'link') {
    const link = await fs.readLink(fullPath);
    if (link.isFolder) {
      return isEntityPresentInTargetFolder ? `${possibleEntityNewPath}_${namePostfix}` : possibleEntityNewPath;
    }
  }

  const fileExt = getFileExtension(name);
  const fileName = name.replace(`.${fileExt}`, '');
  return isEntityPresentInTargetFolder
    ? `${targetFolder}/${fileName}_${namePostfix}.${fileExt}`
    : possibleEntityNewPath;
}
