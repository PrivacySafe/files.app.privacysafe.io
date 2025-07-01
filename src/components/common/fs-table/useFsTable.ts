import dayjs from 'dayjs';
import { Ui3nTableProps } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';
import { useFsFolder } from '@/composables/useFsFolder';
import { ComputedRef } from 'vue';

export function useFsTable(tableWindow: ComputedRef<'1' | '2'>) {
  const { changeSort, sortFolderData } = useFsFolder(tableWindow);

  function prepareFolderDataTable(
    data: ListingEntryExtended[],
    tableName: string,
    tr: (key: string, placeholders?: Record<string, string>) => string,
  ): Ui3nTableProps<ListingEntryExtended> {
    return {
      config: {
        tableName,
        fieldAsRowKey: 'id',
        selectable: 'multiple',
        columnStyle: {
          name: { width: 'calc(100% - 234px)' },
          type: { width: '64px' },
          size: { width: '80px' },
          displayingCTime: { width: '90px' },
        },
        showNoDataMessage: false,
      },
      head: [
        { key: 'name', text: tr('table.header.name'), sortable: true },
        { key: 'type', text: tr('table.header.type'), sortable: true },
        { key: 'size', text: tr('table.header.size'), sortable: true },
        { key: 'displayingCTime', text: tr('table.header.date'), sortable: true },
      ],
      body: {
        content: data.map(item => ({
          ...item,
          // ext: item.isFile ? item.ex
          size: item.size || 0,
          displayingCTime: item.ctime ? dayjs(item.ctime).format('YYYY-MM-DD') : '',
        })),
      },
    };
  }

  return {
    changeSort,
    prepareFolderDataTable,
    sortFolderData,
  };
}
