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
import isEmpty from 'lodash/isEmpty';
import { getFileExtension } from '@v1nt1248/3nclient-lib/utils';
import { loadFolderContentList } from './load-folder-content-list';
import { prepareFolderPath } from '@/utils';
import type { ListingEntryExtended } from '@/types';

export async function loadPreparedFolderContentList({
  fs,
  path,
  basePath,
  trashFolderName,
}: {
  fs: web3n.files.WritableFS;
  path: string;
  basePath: string;
  trashFolderName: string;
}): Promise<ListingEntryExtended[]> {
  try {
    const folderPath = prepareFolderPath([basePath, path]);
    const list = await loadFolderContentList({ fs, path: folderPath });
    if (isEmpty(list)) {
      return [];
    }

    const preparedList: ListingEntryExtended[] = [];
    for (const item of list) {
      if (!(item.isFolder && item.name === trashFolderName)) {
        const compoundPath = prepareFolderPath([folderPath, item.name]);
        const stats = await fs!.stat(compoundPath);
        const id = (await fs!.getXAttr(compoundPath, 'id')) as string | undefined;
        const tags = (await fs!.getXAttr(compoundPath, 'tags')) as string[] | undefined;
        const favoriteId = (await fs!.getXAttr(compoundPath, 'favoriteId')) as string | undefined;

        preparedList.push({
          id,
          name: item.name,
          fullPath: compoundPath,
          tags: tags || [],
          type: item.isFile ? 'file' : item.isFolder ? 'folder' : 'link',
          ...(favoriteId && { favoriteId }),
          ...(item.isFile && { ext: getFileExtension(item.name) }),
          ...stats,
        });
      }
    }

    return preparedList;
  } catch (e) {
    const errorMessage = `An error reading of ${path} folder.`;
    console.error(errorMessage, e);
    await w3n.log!('error', errorMessage, e);
    return [];
  }
}
