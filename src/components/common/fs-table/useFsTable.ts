import dayjs from 'dayjs';
import size from 'lodash/size';
import { Ui3nTableProps } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';

export function useFsTable() {
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

  function getGhostElementText(data: ListingEntryExtended[]): string {
    if (size(data) === 0) return '';

    const name = data[0].name;
    const processedName = size(name) > 40 ? `${name.slice(0, 40)}...` : name;

    return size(data) > 1 ? `${processedName} (+${size(data) - 1})` : processedName;
  }

  function sortFolderData(
    a: ListingEntryExtended,
    b: ListingEntryExtended,
    field: keyof ListingEntryExtended,
    direction: 'asc' | 'desc',
  ): -1 | 1 {
    const aFieldValue = field === 'ext' && a.type === 'file' ? `${a.ext}-${a.name}` : a[field]!;
    const aFieldValueProcessed = typeof aFieldValue === 'string' ? aFieldValue.toLowerCase() : aFieldValue;

    const bFieldValue = field === 'ext' && a.type === 'file' ? `${b.ext}-${b.name}` : b[field]!;
    const bFieldValueProcessed = typeof bFieldValue === 'string' ? bFieldValue.toLowerCase() : bFieldValue;

    return aFieldValueProcessed > bFieldValueProcessed
      ? direction === 'desc'
        ? 1
        : -1
      : direction === 'desc'
        ? -1
        : 1;
  }

  return {
    prepareFolderDataTable,
    getGhostElementText,
    sortFolderData,
  };
}
