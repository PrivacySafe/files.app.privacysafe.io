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
import { ref } from 'vue';
import { defineStore } from 'pinia';
import { appStorageSrv } from '@/services/services-provider';
import { useFsStore } from '@/store/fs.store';
import { USER_FS } from '@shared/constants';
import type { SyncQueueElement } from '@shared/types';

export const useSyncQueueStore = defineStore('sync-queue', () => {
  const fsStore = useFsStore();

  const uploadProcesses = ref<Map<string, number>>(new Map());
  const downloadProcesses = ref<Map<string, number>>(new Map());
  const adoptProcesses = ref<Map<string, boolean>>(new Map());
  const rootFolderSyncStatus = ref<web3n.files.SyncStatus | undefined>(undefined);
  const trashFolderSyncStatus = ref<web3n.files.SyncStatus | undefined>(undefined);

  async function getRootFolderSyncStatus(type: 'root' | 'trash'): Promise<void> {
    const fs = fsStore.getFs(USER_FS);
    if (type === 'root') {
      rootFolderSyncStatus.value = await fs.v?.sync?.status('');
    } else if (type === 'trash') {
      trashFolderSyncStatus.value = await fs.v?.sync?.status(fsStore.trashFolderName!);
    }
  }

  function onAddQueueItem(item: SyncQueueElement) {
    console.log('📝 ON ADD QUEUE ITEM: ', item);
    const [action, path = ''] = item.split(':');
    switch (action) {
      case 'upload':
        uploadProcesses.value.set(path, 0);
        break;
      case 'download':
        downloadProcesses.value.set(path, 0);
        break;
      case 'adoptRemote':
        adoptProcesses.value.set(path, true);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function onRemoveQueueItem(item: SyncQueueElement) {
    console.log('🗑 ON REMOVE QUEUE ITEM: ', item);
    const [action, path = ''] = item.split(':');
    switch (action) {
      case 'upload':
        uploadProcesses.value.has(path) && uploadProcesses.value.delete(path);
        break;
      case 'download':
        downloadProcesses.value.has(path) && downloadProcesses.value.delete(path);
        break;
      case 'adoptRemote':
        adoptProcesses.value.has(path) && adoptProcesses.value.delete(path);
        break;
    }
  }

  function onUpdateQueue(val: SyncQueueElement[] = []) {
    uploadProcesses.value.clear();
    downloadProcesses.value.clear();
    adoptProcesses.value.clear();

    for (const item of val) {
      onAddQueueItem(item);
    }
    console.log(
      '📝 UPDATE QUEUE ITEM: ',
      JSON.stringify([...uploadProcesses.value]),
      JSON.stringify([...downloadProcesses.value]),
      JSON.stringify([...adoptProcesses.value]),
    );
  }

  function synchronizationQueueInitialProcess() {
    return appStorageSrv.synchronizationQueueInitialProcess();
  }

  function upsertProcess({
    action,
    path,
    value,
  }: {
    action: 'upload' | 'download' | 'adoptRemote';
    path: string;
    value: number | boolean;
  }) {
    console.log('📝 UPSERT PROCESS: ', action, path, value);
    switch (action) {
      case 'upload':
        uploadProcesses.value.set(path, value as number);
        break;
      case 'download':
        downloadProcesses.value.set(path, value as number);
        break;
      case 'adoptRemote':
        adoptProcesses.value.set(path, value as boolean);
        break;
    }
    console.log(
      `🚀 ${action.toUpperCase()} PROCESSING [${path}] => `,
      uploadProcesses.value.get(path) || downloadProcesses.value.get(path) || adoptProcesses.value.get(path),
    );
  }

  function removeProcess({ action, path }: { action: 'upload' | 'download' | 'adoptRemote'; path: string }) {
    console.log('🗑 REMOVE PROCESS: ', action, path);
    switch (action) {
      case 'upload':
        uploadProcesses.value.delete(path);
        break;
      case 'download':
        downloadProcesses.value.delete(path);
        break;
      case 'adoptRemote':
        adoptProcesses.value.delete(path);
        break;
    }
    console.log(
      `🚀 ${action.toUpperCase()} PROCESSING [${path}] => `,
      uploadProcesses.value.has(path) || downloadProcesses.value.has(path) || adoptProcesses.value.has(path),
    );
  }

  return {
    rootFolderSyncStatus,
    trashFolderSyncStatus,
    uploadProcesses,
    downloadProcesses,
    adoptProcesses,
    getRootFolderSyncStatus,
    synchronizationQueueInitialProcess,
    onUpdateQueue,
    upsertProcess,
    removeProcess,
  };
});
