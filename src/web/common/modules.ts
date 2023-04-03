/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import * as ArrayFilterMod from './filters/to-array';
ArrayFilterMod.addFilter(angular);

import * as CustomFilterMod from './filters/custom';
CustomFilterMod.addFilter(angular);

import * as CacheSrvMod from './services/cache-srv';
CacheSrvMod.addService(angular);

import * as CommonSrvMod from './services/common-srv';
CommonSrvMod.addService(angular);

import * as MainCompMod from './components/main/main';
MainCompMod.addComponent(angular);

import * as NotificationSrvMod from './services/notifications/notifications-srv';
NotificationSrvMod.addService(angular);

import * as NotificationCompMod from './services/notifications/notifications';
NotificationCompMod.addComponent(angular);

import * as EmojiSrvMod from './services/emoji/emoji-srv';
EmojiSrvMod.addService(angular);

// import * as StorageStoreSrvMod from '../storage/common/storage-store'
// StorageStoreSrvMod.addService(angular)

import * as StorageAppCompMod from '../storage/storage-app/storage-app'
StorageAppCompMod.addComponent(angular)

import * as StorageTitleCompMod from '../storage/storage-title/storage-title'
StorageTitleCompMod.addComponent(angular)

import * as StorageFolderListCompMod from '../storage/storage-folder-list/storage-folder-list'
StorageFolderListCompMod.addComponent(angular)

import * as StorageFavoritesCompMod from '../storage/storage-favorites/storage-favorites'
StorageFavoritesCompMod.addComponent(angular)

import * as StorageActionsSrvMod from '../storage/storage-actions/storage-action-srv'
StorageActionsSrvMod.addService(angular)

import * as StorageActionsCompMod from '../storage/storage-actions/storage-actions'
StorageActionsCompMod.addComponent(angular)

import * as StorageContentCompMod from '../storage/storage-content/storage-content'
StorageContentCompMod.addComponent(angular)



export const appModuleDependencies = [
  'ui.router',
  'ngAnimate',
  'ngSanitize',
  'ngMaterial',
  'ngMdIcons',
  'hmTouchEvents',
  'ngQuill',
  'ngEmbed',
	ArrayFilterMod.ModuleName,
	CustomFilterMod.ModuleName,
	CacheSrvMod.ModuleName,
  CommonSrvMod.ModulName,
  MainCompMod.ModuleName,
  NotificationSrvMod.ModuleName,
  NotificationCompMod.ModuleName,
  EmojiSrvMod.ModuleName,
  // StorageStoreSrvMod.ModuleName,
  StorageAppCompMod.ModuleName,
  StorageTitleCompMod.ModuleName,
  StorageFolderListCompMod.ModuleName,
  StorageFavoritesCompMod.ModuleName,
  StorageActionsSrvMod.ModuleName,
  StorageActionsCompMod.ModuleName,
  StorageContentCompMod.ModuleName
];
