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

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { ListingEntry, ListingEntryExtended } from '@/types';

export type FavoriteFolder = {
  id: string;
  fullPath: string;
};

export interface FileLinkStoreService {
  saveLink(file: web3n.files.ReadonlyFile): Promise<string>;

  getLink(fileId: string): Promise<web3n.files.SymLink | null | undefined>;

  getFile(fileId: string): Promise<web3n.files.Linkable | null | undefined>;

  deleteLink(fileId: string): Promise<void>;
}

export interface CloudFileSystemOperations {
  fs: web3n.files.WritableFS;
  trashFolderName: string;

  makeFolder(path: string): Promise<void>;

  getEntityStats: (fullPath: string) => Promise<Nullable<ListingEntryExtended & { thumbnail?: string }>>;

  isEntityPresent: (entityPath: string, entityType: 'folder' | 'file' | 'link') => Promise<boolean>;

  renameEntity(oldPath: string, newName: string): Promise<void>;

  moveEntity(oldPath: string, newPath: string): Promise<void>;

  copyEntities(entities: ListingEntryExtended[], targetFolder: string): Promise<void>;

  moveEntities(entities: ListingEntryExtended[], targetFolder: string): Promise<void>;

  deleteEntity(entity: ListingEntryExtended): Promise<void>;

  restoreEntity(entity: ListingEntryExtended, mode: 'restore' | 'keep' | 'replace'): Promise<void>;

  downloadEntities(entities: ListingEntryExtended[]): Promise<void>;

  updateEntityXAttrs(path: string, attrs: Record<string, any | undefined>): Promise<void>;

  deleteEntityXAttrs(path: string, attrNames: string[]): Promise<void>;

  getFolderContentList(path: string): Promise<ListingEntry[]>;

  getFolderContentFilledList(path: string, bathPath: string): Promise<ListingEntryExtended[]>;

  saveFileBaseOnOsFileSystemFile(uploadFile: File, newPath: string, withThumbnail?: boolean): Promise<void>;
}

export interface DBProvider {
  addFavorite(fullPath: string, folderId?: string): Promise<string>;

  getFavorites(): Promise<FavoriteFolder[]>;

  updateFavorite(id: string, fullPath: string): Promise<void>;

  deleteFavorite(id: string): Promise<FavoriteFolder[]>;
}
