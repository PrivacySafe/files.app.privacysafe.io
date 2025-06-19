import { shallowReactive, ref } from 'vue';
import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import { APP_FS_ITEMS, FS_ITEM_INITIALIZE_BY_USE, DEFAULT_FOLDERS } from '@/constants';
import type { FsListItem, RootFsFolderView, StorageType, WritableFS } from '@/types';

export const useFsStore = defineStore('fs', () => {
  const fsList = shallowReactive<Record<string, FsListItem>>({});
  const fsFolderList = ref<RootFsFolderView[]>([]);

  function prepareFsFolderList() {
    fsFolderList.value = cloneDeep(DEFAULT_FOLDERS);

    Object.keys(fsList).forEach(fsId => {
      if (fsId !== 'user-synced') {
        const fsFolder: RootFsFolderView = {
          id: `${fsId}-root`,
          fsId,
          name: fsList[fsId].name,
          icon: fsId.includes('system') ? 'round-folder-data' : 'outline-hard-drive',
        };
        fsFolderList.value.push(fsFolder);
      }
    });
  }

  async function initializeFsItems() {
    for (const itemKind of APP_FS_ITEMS) {
      const [itemUse, itemType] = itemKind.split(':') as ['user' | 'system', StorageType];
      const initFunction = FS_ITEM_INITIALIZE_BY_USE[itemUse];
      const fsItem = await w3n.storage![initFunction]!(itemType);

      if (fsItem.isCollection) {
        const items = await (fsItem.item as web3n.files.FSCollection).getAll();
        for (const val of items) {
          if (!val[1].isCollection) {
            const fsId = `${itemUse}-${itemType}-${val[0]
              .replaceAll(' ', '_')
              .replace(/[.*+?^$&{}()|[\]\\]/g, '')
              .toLowerCase()}`;
            fsList[fsId] = {
              fsId,
              name: `${val[0]} (${itemUse}, ${itemType})`,
              entity: val[1].item as WritableFS,
            };
          }
        }
      } else {
        const fsId = `${itemUse}-${itemType}`;
        fsList[fsId] = {
          fsId,
          name: `${(fsItem.item as WritableFS).name} (${itemUse}, ${itemType})`,
          entity: fsItem.item as WritableFS,
        };
      }
    }

    prepareFsFolderList();
  }

  return {
    fsList,
    fsFolderList,
    initializeFsItems,
  };
});
