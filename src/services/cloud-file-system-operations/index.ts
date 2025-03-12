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
import { isThereEntityWithSameName } from './is-there-entity-with-same-name';
import { createFolderInFS } from './make-folder';
import { loadFsEntityStats } from './load-fs-entity-stats';
import { moveFsEntity } from './move-fs-entity';
import { copyFsEntities } from './copy-fs-entities';
import { moveFsEntities } from './move-fs-entities';
import { renameFsEntity } from './rename-fs-entity';
import { deleteEntityInFs } from './delete-entity';
import { downloadEntities as downloadSelectedEntities } from './download-entities';
import { updateXAttrs } from './update-x-attrs';
import { deleteXAttrs } from './delete-x-attrs';
import { restoreFsEntity } from './restore-fs-entity';
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

  const isEntityPresent = async (
    entityPath: string,
    entityType: 'folder' | 'file' | 'link' = 'folder',
  ): Promise<boolean> => {
    await checkFs();
    return await fileProc.startOrChain(async () => {
      return isThereEntityWithSameName({ fs: fs!, entityPath, entityType });
    });
  };

  const moveEntity = async (oldPath: string, newPath: string): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await moveFsEntity({ fs: fs!, oldFullPath: oldPath, newFullPath: newPath });
    });
  };

  const copyEntities = async (entities: ListingEntryExtended[], targetFolder: string): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await copyFsEntities({ fs: fs!, entities, targetFolder });
    });
  };

  const moveEntities = async (entities: ListingEntryExtended[], targetFolder: string): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await moveFsEntities({ fs: fs!, entities, targetFolder });
    });
  };

  const renameEntity = async (oldPath: string, newName: string): Promise<void> => {
    await checkFs();
    await renameFsEntity({ fs: fs!, oldPath, newName });
  };

  const deleteEntity = async (entity: ListingEntryExtended): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await deleteEntityInFs({ fs: fs!, entity, trashFolderName });
    });
  };

  const restoreEntity = async (
    entity: ListingEntryExtended,
    mode: 'restore' | 'keep' | 'replace' = 'restore',
  ): Promise<void> => {
    await checkFs();
    await fileProc.startOrChain(async () => {
      await restoreFsEntity({ fs: fs!, entity, mode });
    });
  };

  const downloadEntities = async (entities: ListingEntryExtended[]): Promise<void> => {
    return downloadSelectedEntities({ fs: fs!, entities });
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
    isEntityPresent,
    makeFolder,
    getEntityStats,
    renameEntity,
    moveEntity,
    copyEntities,
    moveEntities,
    deleteEntity,
    restoreEntity,
    downloadEntities,
    updateEntityXAttrs,
    deleteEntityXAttrs,
    getFolderContentList,
    getFolderContentFilledList,
    saveFileBaseOnOsFileSystemFile,
  };
}
