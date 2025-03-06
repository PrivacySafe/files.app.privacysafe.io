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
import dayjs from 'dayjs';
import type { Ui3nTableProps, Ui3nTableSort } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';

export function prepareFolderDataTable(
  data: ListingEntryExtended[],
  tableName: string,
  tr: (key: string, placeholders?: Record<string, string>) => string,
  sortingConfig?: Ui3nTableSort<ListingEntryExtended>,
): Ui3nTableProps<ListingEntryExtended> {
  return {
    config: {
      tableName,
      sortOrder: sortingConfig || {
        field: 'name',
        direction: 'desc',
      },
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
        size: item.size || 0,
        displayingCTime: item.ctime ? dayjs(item.ctime).format('YYYY-MM-DD') : '',
      })),
    },
  };
}
