/*
 Copyright (C) 2018, 2021 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. 
*/

import { makeFSCollection, readonlyWrapFSCollection }
	from '../../common/libs/fs-collection';
import { logError } from '../../common/libs/logging';
import { Observable } from 'rxjs';
import { STORAGE_PLACES } from '../common/const'

type FS = web3n.files.FS;
type WritableFS = web3n.files.WritableFS;
type FSCollection = web3n.files.FSCollection;
type FSItem = web3n.files.FSItem;
type ListingEntry = web3n.files.ListingEntry;
type FolderEvent = web3n.files.FolderEvent;

const storagePlace = STORAGE_PLACES;

const idToGetterMap = new Map<string, () => Promise<FSItem>>([
	[ storagePlace.userSynced, () => w3n.storage.getUserFS('synced') ],
	[ storagePlace.userLocal, () => w3n.storage.getUserFS('local') ],
	[ storagePlace.userDevice, () => w3n.storage.getUserFS('device') ],
	[ storagePlace.systemSynced, () => w3n.storage.getSysFS('synced') ],
	// [ storagePlace.systemSynced, makeSystemPlace ],
	[ storagePlace.userImages, makeImagesPlace ],
	[ storagePlace.device, () => w3n.storage.getSysFS('device') ],
]);

async function makeSystemPlace(): Promise<FSItem> {
	const sys = await makeFSCollection();
	sys.set('Local', await w3n.storage.getSysFS('local'));
	sys.set('Synced', await w3n.storage.getSysFS('synced'));
	return {
		isCollection: true,
		item: readonlyWrapFSCollection(sys),
	};
}

async function makeImagesPlace(): Promise<FSItem> {
	const userSyncedFSItem = await w3n.storage.getUserFS('synced');
	const userSyncedFS = userSyncedFSItem.item! as FS;
	const { completion, items } = await userSyncedFS.select('/', {
		action: 'include',
		type: 'file',
		name: '*.png'
	});
	return {
		isCollection: true,
		item: items
	};

}

export class Places {

	private places = makeFSCollection();
	private initialization: Promise<any>|undefined;

	constructor() {
		this.init();
	}

	private async init(): Promise<void> {
		const setupPlaces: Promise<void>[] = [];
		for (const idAndGetter of idToGetterMap.entries()) {
			const setup = idAndGetter[1]().then(
				f => this.places.set(idAndGetter[0], f),
				logError);
			setupPlaces.push(setup);
		}
		this.initialization = Promise.all(setupPlaces);
		await this.initialization;
console.log(`=================== after init ========================`);
console.log(this.places);
		this.initialization = undefined;
	}

	async list(): Promise<string[]> {
		const placeIds = (await this.places.getAll())
		.map(pAndItem => pAndItem[0]);
		return placeIds;
	}

	async get(placeId: string): Promise<FSItem> {
		if (this.initialization) { await this.initialization; }
		let place = await this.places.get(placeId);
		if (place) { return place; }
		throw makeNotFoundException('', `Unknown storage place id: ${placeId}`);
	}

	async listItemsIn(placeId: string, path: string):
			Promise<{ containerType: 'fs' | 'collection'; lst: ListingEntry[]; }> {
		const place = await this.get(placeId);
		if (place.isFolder) {
			ensureIsFolder(place.item);
			return {
				containerType: 'fs',
				lst: await (place.item as WritableFS).listFolder(path),
			};
		} else if (place.isCollection) {
			ensureIsCollection(place.item);
			return listCollection(place.item as FSCollection, path);
		} else {
			throw makeNotFoundException(path,
				`Place ${placeId} is neither folder, nor collection`);
		}
	}

	async watchFolder(placeId: string, path: string):
			Promise<Observable<FolderEvent>> {
		const place = await this.get(placeId);
		if (place.isFolder) {
			const f = place.item as WritableFS;
			ensureIsFolder(f);
			return new Observable(obs => f.watchFolder(path, obs));
		} else if (place.isCollection) {
			const c = place.item as FSCollection;
			ensureIsCollection(c);
			// XXX implement watching in collection object
			console.error(`Missing implementation to watch changes in collection`);
			return Observable.from([]);
		} else {
			throw makeNotFoundException(path,
				`Place ${placeId} is neither folder, nor collection`);
		}
	}

	async getRootFor(placeId: string, path: string):
			Promise<{ rootFS?: WritableFS; rootCollection?: FSCollection; pathInRoot: string; }> {
		const place = await this.get(placeId);
		if (place.isFolder) {
			ensureIsFolder(place.item);
			return {
				rootFS: place.item as WritableFS,
				pathInRoot: path,
			};
		} else if (place.isCollection) {
			ensureIsCollection(place.item);
			if (!path || path==='.' || path==='/') {
				return {
					pathInRoot: path,
					rootCollection: place.item as FSCollection
			 	};
			} else {
				return unfoldCollectionHierarchyIfPossible(
					place.item as FSCollection, path, detectSeparator(path));
			}
		} else {
			throw makeNotFoundException(path,
				`Place ${placeId} is neither folder, nor collection`);
		}
	}

	async getRootFSFor(placeId: string, path: string):
			Promise<{ root?: WritableFS; pathInRoot: string; }> {
		const { rootCollection, rootFS, pathInRoot } = await this.getRootFor(
			placeId, path);
		if (rootFS) {
			return { root: rootFS, pathInRoot };
		} else if (rootCollection) {
console.log(this);
			throw new Error(`Given path ${path} sits in collection in place ${placeId} and not in a folder`);
		} else {
			throw new Error(`Root wasn't returned, and exception wasn't thrown`);
		}
	}

}

function ensureIsFolder(x: any): void {
	if (!(x as FS).listFolder) { throw new Error(
		`Given object is not a folder`); }
}

function ensureIsCollection(x: any): void {
	if (!(x as FSCollection).entries) { throw new Error(
		`Given object is not an fs collection`); }
}

/**
 * This function assumes that there are two distinct uses of FSCollection.
 * The first use is when item names are paths somewhere, e.g. collections
 * returned from fs.select(). The second use is a simulation of file hierarchy.
 * In it names of items are not paths but sections of paths. The second is
 * where unfolding is required.
 * Function returns an object with two fields: (1) pathInRoot, which is a path
 * in returned root, (2) either rootFS or rootCollection, depending on whether
 * root is FS or FSCollection.
 * @param root 
 * @param path 
 * @param sep 
 */
async function unfoldCollectionHierarchyIfPossible(root: FSCollection,
		path: string, sep: string|null): Promise<{ rootFS?: WritableFS; rootCollection?: FSCollection; pathInRoot: string; }> {
	const lst = await root.getAll();

	let item = lst.find(nameAndItem => (nameAndItem[0] === path));
	// case of names being paths with item being found
	if (item) {
		return {
			rootCollection: root,
			pathInRoot: path
		};
	}
	// from here we assume that it is the case of names not being paths

	// case for path being a complete name, and not being found
	if (sep === null) {
		throw makeNotFoundException(path);
	}

	// split path into sections, and complete cases without folder hierarchy
	const pathSections = path.split(sep).filter(s => (s.length > 0));
	if (pathSections.length === 0) {
		throw makeNotFoundException(path);
	} else if (pathSections.length === 1) {
		const pathInRoot = pathSections.join(sep);
		const found = !!lst.find(nameAndItem => (nameAndItem[0] === pathInRoot));
		if (!found) { throw makeNotFoundException(path); }
		return {
			rootCollection: root,
			pathInRoot
		};
	}

	// try if complete path is a name in collection; this options may appear
	// often, so, we put it first.
	{
		const pathInRoot = pathSections.join(sep);
		if (lst.find(nameAndItem => (nameAndItem[0] === pathInRoot))) {
			return {
				rootCollection: root,
				pathInRoot
			};
		} else if (pathSections.length === 1) {
			throw makeNotFoundException(path);
		}
	}

	// find proper item, which may have a name, consisting of several segments
	for (let i=1; i<pathSections.length; i+=1) {
		const rootName = pathSections.slice(0,i).join(sep);
		const foundItem = lst.find(nameAndItem => (nameAndItem[0] === rootName));
		if (foundItem) {
			const pathInRoot = pathSections.slice(i).join(sep);
			const fsItem = foundItem[1];
			if (!fsItem.item) { throw new Error(
				`Unexpectedly got fs item without item field`); }
			if (fsItem.isFolder) {
				return { rootFS: fsItem.item as WritableFS, pathInRoot };
			} else if (fsItem.isCollection) {
				return { rootCollection: fsItem.item as FSCollection, pathInRoot };
			} else {
				throw makeNotFoundException(
					path, `Path section ${rootName} is not a folder`);
			}
		}
	}

	throw makeNotFoundException(path);
}

function detectSeparator(path: string): string|null {
	return (path.includes('/') ? '/' : path.includes('\\') ? '\\' : null);
}

function shorterNamesToTail(p1: [ string, FSItem ], p2: [ string, FSItem ]):
		number {
	const a = p1[0].length;
	const b = p2[0].length;
	if (a < b) {
		return -1;
	} else if (a > b) {
		return 1;
	} else {
		return 0;
	}
}

async function listCollection(
		c: FSCollection, path: string, pathArr?: string[]):
		Promise<{ containerType: 'fs' | 'collection'; lst: ListingEntry[]; }> {
	if (!pathArr) {
		pathArr = path.split('/').filter(s => (s.length > 0));
	}

	const name = pathArr.shift();

	if (name === undefined) {
		const lst = (await c.getAll())
		.map(([ name, item ]) => {
			const lstEntry: ListingEntry = {
				name,
				isFile: item.isFile,
				isFolder: (item.isFolder || item.isCollection),
			};
			return lstEntry;
		});
		return { containerType: 'collection', lst };
	}

	const nameAndItem = (await c.getAll())
	.find(([ itemName ]) => (itemName === name));

	if (!nameAndItem) { throw makeNotFoundException(path); }

	const item = nameAndItem[1];
	if (item.isFolder) {
		ensureIsFolder(item.item);
		return {
			containerType: 'fs',
			lst: await (item.item as WritableFS).listFolder(pathArr.join('/')),
		};
	} else if (item.isCollection) {
		ensureIsCollection(item.item);
		return listCollection(item.item as FSCollection, path, pathArr);
	} else {
		throw makeNotFoundException(path,
			`Item ${name} is neither folder, nor collection`);
	}
}

type FileException = web3n.files.FileException;

export function makeNotFoundException(path: string, cause?: any):
		FileException {
	const exc: FileException = {
		runtimeException: true,
		type: 'file',
		code: 'ENOENT',
		path,
		cause,
		notFound: true,
	};
	return exc;
}
