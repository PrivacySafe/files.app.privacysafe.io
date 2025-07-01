/*
 Copyright (C) 2025 3NSoft Inc.

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
import type { Nullable } from '@v1nt1248/3nclient-lib';
import { createPdfThumbnail as createThumbnail } from '@/utils';

export async function createPdfThumbnail(fs: web3n.files.FS, path: string): Promise<Nullable<string>> {
  return fs.readBytes(path).then(byteArray => {
    if (!byteArray) {
      throw new Error(`Error while ${path} file read`);
    }

    return createThumbnail(byteArray, 200);
  });
}
