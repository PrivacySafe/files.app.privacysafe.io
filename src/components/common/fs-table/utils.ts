import size from 'lodash/size';
import type { ListingEntryExtended } from '@/types';

export function getGhostElementText(data: ListingEntryExtended[]): string {
  if (size(data) === 0) return '';

  const name = data[0].name;
  const processedName = size(name) > 40 ? `${name.slice(0, 40)}...` : name;

  return size(data) > 1 ? `${processedName} (+${size(data) - 1})` : processedName;
}
