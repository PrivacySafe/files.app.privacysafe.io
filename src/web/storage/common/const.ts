/*
 Copyright (C) 2017, 2021 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

export const SYSTEM_FILES = {
	FAVORITE_FOLDERS: 'fav-folders.json'
}

export const STORAGE_PLACES = {
	device: 'system-device',
	systemSynced: 'system-synced',
	userLocal: 'user-local',
	userDevice: 'user-device',
	userSynced: 'user-synced',
	userImages: 'user-images'
}

export const SYNCED_FOLDERS_DEFAULT: client3N.StorageFolder[] = [
	{
		id: '10', name: 'Home', icon: 'home', virtual: false, rootPath: '',
		rootPathName: 'Home', placeId: STORAGE_PLACES.userSynced
	}, {
		id: '12', name: 'Images', icon: 'image', virtual: true, rootPath: '',
		rootPathName: 'Images', placeId: STORAGE_PLACES.userImages
	}, {
		id: '80', name: 'System', icon: 'home', virtual: false, rootPath: '',
		rootPathName: 'System', placeId: STORAGE_PLACES.systemSynced
	}, {
		id: '99', name: 'Trash', icon: 'delete', virtual: false,
		rootPath: '.trash', rootPathName: 'Trash',
		placeId: STORAGE_PLACES.userSynced
	}
]

export const STORAGE_COLLECTIONS_LIST: string[] = [
	'user-images',
	'system-synced'
];
