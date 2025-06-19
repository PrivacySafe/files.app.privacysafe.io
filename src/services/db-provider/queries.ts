export const favoritesQuery = 'SELECT * FROM favorites';

export const insertFavoriteQuery = 'INSERT INTO favorites(id, fsId, fullPath) VALUES ($id, $fsId, $fullPath)';

export const upsertFavoriteQuery =
  'INSERT INTO favorites(id, fsid, fullPath) VALUES ($id, $fsId, $fullPath) ON CONFLICT(id) DO UPDATE SET id=$id, fsId=$fsId, fullPath=$fullPath';

export const deleteFavoriteByIdQuery = 'DELETE FROM favorites WHERE id=$id';
