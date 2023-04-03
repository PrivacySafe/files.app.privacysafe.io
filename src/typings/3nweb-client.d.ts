/*
 Copyright (C) 2016 3NSoft Inc.

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

declare namespace client3N {

	type IncomingMessage = web3n.asmail.IncomingMessage;
	type OutgoingMessage = web3n.asmail.OutgoingMessage;
	type AttachmentsContainer = web3n.asmail.AttachmentsContainer;
	type MsgInfo = web3n.asmail.MsgInfo;
	type FileException = web3n.files.FileException;

	type FS = web3n.files.FS;
	type WritableVersionedFS = web3n.files.WritableFS;
	type ReadonlyFS = web3n.files.ReadonlyFS;
	type ReadonlyFile = web3n.files.ReadonlyFile;
	type WritableFS = web3n.files.WritableFS;
	type FSCollection = web3n.files.FSCollection;
	type FSItem = web3n.files.FSItem;
	type ListingEntry = web3n.files.ListingEntry;

	type StorageFolder = {
		id: string;
		name: string;
		icon: string;
		virtual: boolean;
		rootPath: string;
		rootPathName: string;
		placeId: string;
	}

	type FavoriteStorageFolder = {
		name: string;
		placeId: string;
		rootFolderId: string;
		path: string;
	}

	interface FolderEntity {
		type: 'file'|'link'|'folder';
		name: string;
		isNew?: boolean;
		placeId?: string;
		path: string;
		owner: any;
		date: number;
		size?: number|null;
		tags?: string[];
		isSelected?: boolean; // исп. только для storage-content
	}

	interface StorageEntity extends FolderEntity {
		isNew: boolean;
	}

	interface StatsEntry extends ListingEntry {
		size?: number;
	}

	interface SavingProgress extends StatsEntry {
		bytesSaved?: number;
		done?: boolean;
	}

	interface TrashSystemInfo {
		originalName: string;
		type: 'folder'|'file'|'link';
		placeId: string;
		path: string;
		deletionTimestamp: number;
	}

	type Emoji = {
		groupId: string;
		symbol: string;
		note: string;
	}

	interface Notification {
		app: string;
		type: string;
		text: string;
		actionData?: {
			folderId?: string;
			msgId?: string;
		};
	}

}
