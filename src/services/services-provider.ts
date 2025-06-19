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
import { dbProvider } from '@/services/db-provider';
import { initializeUserSyncedFs } from '@/services/file-system-operations/initialize-user-synced-fs';
import type { DBProvider } from '@/types';

export let dbSrv: DBProvider;

export async function initializationServices() {
  try {
    await initializeUserSyncedFs();
    dbSrv = await dbProvider();
    console.info('<- SERVICES ARE INITIALIZED ->');
  } catch (e) {
    console.error('# ERROR WHILE SERVICES INITIALISE # ', e);
  }
}
