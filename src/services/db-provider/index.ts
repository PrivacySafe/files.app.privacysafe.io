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

  async function saveDbFile() {
    const countModifiedRow = sqlite.db.getRowsModified();
    if (countModifiedRow > 0) {
      await sqlite.saveToFile({ skipUpload: true });
    }
  }

  async function getFavorites(): Promise<FavoriteFolder[]> {
    const [sqlValue] = sqlite.db.exec(favoritesQuery);
    if (!sqlValue) return [];

    return objectFromQueryExecResult<FavoriteFolder>(sqlValue);
  }

  function _addFavorite({
    fsId = 'user-synced',
    fullPath,
    folderId,
  }: {
    fsId: string;
    fullPath: string;
    folderId?: string;
  }): string {
    const id = folderId || `fav-${getRandomId(10)}`;
    const params = favoriteValueToSqlInsertParams({
      id,
      fsId,
      fullPath,
    });

    sqlite.db.exec(insertFavoriteQuery, params as BindParams);
    return id;
  }

  async function addFavorite({
    fsId = 'user-synced',
    fullPath,
    folderId,
  }: {
    fsId?: string;
    fullPath: string;
    folderId?: string;
  }): Promise<string> {
    const id = _addFavorite({ fsId, fullPath, folderId });
    await saveDbFile();
    return id;
  }

  async function updateFavorite({
    fsId = 'user-synced',
    id,
    fullPath,
  }: {
    fsId: string;
    id: string;
    fullPath: string;
  }): Promise<void> {
    const params = favoriteValueToSqlInsertParams({ id, fsId, fullPath });
    sqlite.db.exec(upsertFavoriteQuery, params as BindParams);
    await saveDbFile();
  }

  async function deleteFavorite(id: string): Promise<FavoriteFolder[]> {
    if (id) {
      sqlite.db.exec(deleteFavoriteByIdQuery, { $id: id });
      await saveDbFile();
    }
    return getFavorites();
  }

  function createFavoritesTable() {
    sqlite.db.exec(
      `CREATE TABLE favorites (id TEXT PRIMARY KEY UNIQUE, fsId TEXT NOT NULL, fullPath TEXT NOT NULL) STRICT`,
    );
  }

  async function initialization() {
    const fs = await w3n.storage!.getAppSyncedFS();
    const file = await fs.writableFile('storage-db');
    sqlite = await SQLiteOn3NStorage.makeAndStart(file);

    const [sqlValue] = sqlite.db.exec(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      AND name = 'favorites'`);

    const res = (sqlValue ? objectFromQueryExecResult(sqlValue) : []) as { name: string }[];

    if (res[0]?.name === 'favorites') {
      const tableData = await getFavorites();
      sqlite.db.exec(`DROP TABLE IF EXISTS favorites`);
      createFavoritesTable();

      for (const favoriteItem of tableData) {
        const newItem = {
          ...favoriteItem,
          fsId: 'user-synced',
        };
        _addFavorite(newItem);
      }
    } else {
      createFavoritesTable();
    }

    await sqlite.saveToFile({ skipUpload: true });
  }

  await initialization();

  return {
    getFavorites,
    addFavorite,
    updateFavorite,
    deleteFavorite,
  };
}
