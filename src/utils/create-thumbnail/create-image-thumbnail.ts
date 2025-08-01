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
import { getFileExtension, mimeTypes, resizeImage, uint8ToDataURL } from '@v1nt1248/3nclient-lib/utils';
import type { Nullable } from '@v1nt1248/3nclient-lib';

export async function createImageThumbnail(fs: web3n.files.FS, path: string): Promise<Nullable<string>> {
  const fileExt = getFileExtension(path);
  const fileMimeType = mimeTypes[fileExt] || 'image/jpeg';
  return fs.readBytes(path).then(byteArray => {
    if (!byteArray) {
      throw new Error(`Error while ${path} file read`);
    }

    const base64Image = uint8ToDataURL(byteArray, fileMimeType);
    if (!base64Image) return null;

    return resizeImage(base64Image, 200);
  });
}
