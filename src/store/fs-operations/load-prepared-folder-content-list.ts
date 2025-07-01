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
import { useAppStore } from '@/store/app.store';
import { loadFolderContentList } from './load-folder-content-list';
import { prepareFolderPath } from '@/utils';
import { prepareFsEntityId } from './utils';
import { ListingEntry, ListingEntryExtended } from '@/types';

function whetherToProcessThisEntity(
  entity: ListingEntry,
  trashFolderName: string,
  os: 'macos' | 'linux' | 'windows',
): boolean {
  const { name, isFolder } = entity;

  const firstNameLetter = name.slice(0, 1);
  if (firstNameLetter === '.' || (isFolder && name === trashFolderName)) return false;

  if (os === 'windows' && isFolder && name.toLowerCase() === 'ntuser.dat') return false;

  return !(os === 'macos' && ['desktop', 'applications', 'library'].includes(name.toLowerCase()));
}

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
    const appStore = useAppStore();
    const folderPath = prepareFolderPath([basePath, path]);
    const list = await loadFolderContentList({ fs, path: folderPath });
    if (isEmpty(list)) {
      return [];
    }

    const isThisFsDevice = fs.type === 'device';

    const preparedList: ListingEntryExtended[] = [];
    for (const item of list) {
      if (whetherToProcessThisEntity(item, trashFolderName, appStore.operatingSystem)) {
        const compoundPath = prepareFolderPath([folderPath, item.name]);
        const stats = await fs!.stat(compoundPath);

        const id = prepareFsEntityId(fs, compoundPath);
        const tags = isThisFsDevice ? [] : ((await fs!.getXAttr(compoundPath, 'tags')) as string[] | undefined);
        const favoriteId = isThisFsDevice
          ? undefined
          : ((await fs!.getXAttr(compoundPath, 'favoriteId')) as string | undefined);
        const thumbnail = isThisFsDevice
          ? undefined
          : ((await fs!.getXAttr(compoundPath, 'thumbnail')) as string | undefined);
        const parentFolder = isThisFsDevice
          ? ''
          : ((await fs!.getXAttr(compoundPath, 'parentFolder')) as string | undefined);

        preparedList.push({
          id,
          name: item.name,
          fullPath: compoundPath,
          tags: tags || [],
          type: item.isFile ? 'file' : item.isFolder ? 'folder' : 'link',
          ext: item.isFile ? getFileExtension(item.name) : `@${item.isFolder ? 'folder' : 'link'}-${item.name}`,
          ...(favoriteId && { favoriteId }),
          ...(parentFolder && { parentFolder }),
          ...(thumbnail && { thumbnail }),
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
