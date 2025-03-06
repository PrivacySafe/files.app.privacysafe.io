/// <reference path="../../libs/sqlite-on-3nstorage/index.d.ts" />
// @ts-ignore
import { SQLiteOn3NStorage } from '@/libs/sqlite-on-3nstorage/index.js';
import type { BindParams } from '@/libs/sqlite-on-3nstorage/sqljs';
import { deleteFavoriteByIdQuery, favoritesQuery, insertFavoriteQuery, upsertFavoriteQuery } from './queries';
import { favoriteValueToSqlInsertParams, objectFromQueryExecResult } from '@/services/db-provider/utils';
import { getRandomId } from '@v1nt1248/3nclient-lib/utils';
import type { FavoriteFolder, DBProvider } from '@/types';

export async function dbProvider(): Promise<DBProvider> {
  let sqlite: SQLiteOn3NStorage;

  const initialization = async () => {
    const fs = await w3n.storage!.getAppSyncedFS();
    const file = await fs.writableFile('storage-db');
    sqlite = await SQLiteOn3NStorage.makeAndStart(file);

    sqlite.db.exec(`CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY UNIQUE,
      fullPath TEXT NOT NULL
    ) STRICT`);

    await sqlite.saveToFile({ skipUpload: true });
  };

  const saveDbFile = async () => {
    const countModifiedRow = sqlite.db.getRowsModified();
    if (countModifiedRow > 0) {
      await sqlite.saveToFile({ skipUpload: true });
    }
  };

  const getFavorites = async (): Promise<FavoriteFolder[]> => {
    const [sqlValue] = sqlite.db.exec(favoritesQuery);
    if (!sqlValue) return [];

    return objectFromQueryExecResult<FavoriteFolder>(sqlValue);
  };

  const addFavorite = async (fullPath: string, folderId?: string): Promise<string> => {
    const id = folderId || `fav-${getRandomId(10)}`;
    const params = favoriteValueToSqlInsertParams({
      id,
      fullPath,
    });

    sqlite.db.exec(insertFavoriteQuery, params as BindParams);
    await saveDbFile();
    return id;
  };

  const updateFavorite = async (id: string, fullPath: string): Promise<void> => {
    const params = favoriteValueToSqlInsertParams({
      id,
      fullPath,
    });
    sqlite.db.exec(upsertFavoriteQuery, params as BindParams);
    await saveDbFile();
  };

  const deleteFavorite = async (id: string): Promise<FavoriteFolder[]> => {
    if (id) {
      sqlite.db.exec(deleteFavoriteByIdQuery, { $id: id });
      await saveDbFile();
    }
    return getFavorites();
  };

  await initialization();

  return {
    getFavorites,
    addFavorite,
    updateFavorite,
    deleteFavorite,
  };
}
