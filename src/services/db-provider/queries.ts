export const favoritesQuery = 'SELECT * FROM favorites';
export const insertFavoriteQuery = 'INSERT INTO favorites(id, fullPath) VALUES ($id, $fullPath)';
export const upsertFavoriteQuery =
  'INSERT INTO favorites(id, fullPath) VALUES ($id, $fullPath) ON CONFLICT(id) DO UPDATE SET id=$id, fullPath=$fullPath';
export const deleteFavoriteByIdQuery = 'DELETE FROM favorites WHERE id=$id';
export const deleteFavoriteByFullPathQuery = 'DELETE FROM favorites WHERE fullPath=$fullPath';
