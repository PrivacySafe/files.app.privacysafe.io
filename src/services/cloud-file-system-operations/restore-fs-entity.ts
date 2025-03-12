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
import { isThereEntityWithSameName } from './is-there-entity-with-same-name';
import { deleteEntityInFs } from './delete-entity';
import type { ListingEntryExtended } from '@/types';

function prepareRestoredPath(entity: ListingEntryExtended, mode: 'restore' | 'keep' | 'replace'): string {
  if (mode !== 'keep') {
    return `${entity.parentFolder}/${entity.name}`;
  }

  const fileExt = getFileExtension(entity.name);
  const fileName = entity.name.replace(`.${fileExt}`, '');
  return `${entity.parentFolder}/${fileName}_copy.${fileExt}`;
}

export async function restoreFsEntity({
  fs,
  entity,
  mode = 'restore',
}: {
  fs: web3n.files.WritableFS;
  entity: ListingEntryExtended;
  mode: 'restore' | 'keep' | 'replace';
}) {
  try {
    const restoredPath = prepareRestoredPath(entity, mode);

    if (mode === 'replace') {
      const doesEntityNeedDelete = await isThereEntityWithSameName({
        fs,
        entityPath: restoredPath,
        entityType: entity.type,
      });

      doesEntityNeedDelete &&
        (await deleteEntityInFs({
          fs,
          entity,
        }));
    }

    await fs.move(entity.fullPath, restoredPath);
    await fs.updateXAttrs(restoredPath, {
      remove: ['parentFolder'],
    });
  } catch (e) {
    w3n.log('error', `Error while restore entity ${entity.name}. `, e);
  }
}
