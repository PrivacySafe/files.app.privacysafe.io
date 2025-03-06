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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleProc } from '@/services/processes';
import { createFolderInFS } from './make-folder';
import { loadFsEntityStats } from './load-fs-entity-stats';
import { moveFsEntity } from './move-fs-entity';
import { renameFsEntity } from './rename-fs-entity';
import { deleteEntityInFs } from './delete-entity';
import { updateXAttrs } from './update-x-attrs';
import { deleteXAttrs } from './delete-x-attrs';
import { loadFolderContentList } from './load-folder-content-list';
import { loadPreparedFolderContentList } from './load-prepared-folder-content-list';
import { createFileBaseOnOsFileSystemFile } from './create-file-based-on-os-file-system-file';
import type { ListingEntry, ListingEntryExtended } from '@/types';
import { Nullable } from '@v1nt1248/3nclient-lib';
import { CloudFileSystemOperations } from '@/types';

export async function cloudFileSystemOperations(): Promise<CloudFileSystemOperations> {
  const fileProc = new SingleProc();
  let fs: web3n.files.WritableFS | undefined;
  let trashFolderName = 'trash-folder';

  const checkFs = async (): Promise<void> => {
    if (!fs) {
      const fsItem = await w3n.storage?.getUserFS!('synced');
      if (fsItem) {
        fs = fsItem.item as web3n.files.WritableFS;
      }
    }
  };

  const makeFolder = async (path: string): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await createFolderInFS({ fs: fs!, path });
    });
  };

  const getEntityStats = async (fullPath: string): Promise<Nullable<ListingEntryExtended & { thumbnail?: string }>> => {
    await checkFs();
    return loadFsEntityStats(fs!, fullPath);
  };

  const moveEntity = async (oldPath: string, newPath: string): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await moveFsEntity({ fs: fs!, oldFullPath: oldPath, newFullPath: newPath });
    });
  };

  const renameEntity = async (oldPath: string, newName: string): Promise<void> => {
    await checkFs();
    await renameFsEntity({ fs: fs!, oldPath, newName });
  };

  const deleteEntity = async (path: string, entityType: 'folder' | 'file' | 'link'): Promise<void> => {
    await checkFs();
    console.log('SRV DELETE_ENTITY: ', path, entityType, trashFolderName);
    await fileProc.startOrChain(async () => {
      await deleteEntityInFs({ fs: fs!, path, entityType, trashFolderName });
    });
  };

  const updateEntityXAttrs = async (path: string, attrs: Record<string, any | undefined>): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await updateXAttrs({ fs: fs!, path, attrs });
    });
  };

  const deleteEntityXAttrs = async (path: string, attrNames: string[] = []): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await deleteXAttrs({ fs: fs!, path, attrNames });
    });
  };

  const getFolderContentList = async (path: string): Promise<ListingEntry[]> => {
    await checkFs();
    return await fileProc.startOrChain(async () => {
      return loadFolderContentList({ fs: fs!, path });
    });
  };

  const getFolderContentFilledList = async (path: string, basePath = ''): Promise<ListingEntryExtended[]> => {
    await checkFs();
    return await fileProc.startOrChain(async () => {
      return loadPreparedFolderContentList({ fs: fs!, path, basePath, trashFolderName });
    });
  };

  const saveFileBaseOnOsFileSystemFile = async (
    uploadedFile: File,
    folderPath: string,
    withThumbnail?: boolean,
  ): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await createFileBaseOnOsFileSystemFile({ fs: fs!, uploadedFile, folderPath, withThumbnail });
    });
  };

  const prepareInitialFolders = async (): Promise<void> => {
    const user = await w3n.mail?.getUserId();
    trashFolderName = `trash-folder-${user || ''}`;
    const isTrashFolderPresent = await fs!.checkFolderPresence(trashFolderName);
    if (!isTrashFolderPresent) {
      await makeFolder(trashFolderName);
    }
  };

  const initializing = async (): Promise<void> => {
    const fsItem = await w3n.storage?.getUserFS!('synced');
    if (fsItem) {
      fs = fsItem.item as web3n.files.WritableFS;
      await prepareInitialFolders();
    }
  };

  await initializing();

  return {
    fs: fs!,
    trashFolderName,
    makeFolder,
    getEntityStats,
    renameEntity,
    moveEntity,
    deleteEntity,
    updateEntityXAttrs,
    deleteEntityXAttrs,
    getFolderContentList,
    getFolderContentFilledList,
    saveFileBaseOnOsFileSystemFile,
  };
}
