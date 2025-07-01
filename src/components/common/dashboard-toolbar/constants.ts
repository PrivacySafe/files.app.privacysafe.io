import type { ListingEntryExtended } from '@/types';

export const SORTABLE_FIELDS: Array<{
  field: keyof ListingEntryExtended;
  label: string;
}> = [
  {
    field: 'name',
    label: 'table.header.name',
  },
  {
    field: 'type',
    label: 'table.header.type',
  },
  {
    field: 'size',
    label: 'table.header.size',
  },
  {
    field: 'displayingCTime',
    label: 'table.header.date',
  },
];
