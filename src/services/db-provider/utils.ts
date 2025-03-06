// @ts-ignore
import { QueryExecResult } from '@/libs/sqlite-on-3nstorage';
import type { FavoriteFolder } from '@/types';

type SqlValue = number | string | Uint8Array | Blob | null;

export function objectFromQueryExecResult<T>(sqlResult: QueryExecResult): Array<T> {
  const { columns, values: rows } = sqlResult;
  return rows.map((row: SqlValue[]) =>
    row.reduce((obj, cellValue, index) => {
      const field = columns[index] as keyof T;
      obj[field] = cellValue as T[keyof T];
      return obj;
    }, {} as T),
  );
}

export function favoriteValueToSqlInsertParams(value: FavoriteFolder) {
  return {
    $id: value.id,
    $fullPath: value.fullPath,
  };
}
