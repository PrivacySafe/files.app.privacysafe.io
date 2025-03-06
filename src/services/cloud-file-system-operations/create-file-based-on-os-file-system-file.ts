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
import {
  getRandomId,
  isFileImage,
  isFileVideo,
  resizeImage,
  uint8ToBase64,
  createVideoThumbnail,
} from '@v1nt1248/3nclient-lib/utils';
import { Nullable } from '@v1nt1248/3nclient-lib';
import { createPdfThumbnail } from '@/utils';

export async function createFileBaseOnOsFileSystemFile({
  fs,
  uploadedFile,
  folderPath,
  withThumbnail,
}: {
  fs: web3n.files.WritableFS;
  uploadedFile: File & { path?: string };
  folderPath: string;
  withThumbnail?: boolean;
}): Promise<void> {
  try {
    const { name, path, type } = uploadedFile;
    const fsItem = await w3n.storage?.getSysFS!('device', path);
    if (fsItem) {
      const file = fsItem.item as web3n.files.ReadonlyFile;
      const fullFilePath = `${folderPath}/${name}`;
      await fs.saveFile(file, fullFilePath, true);
      await fs.updateXAttrs(fullFilePath, { set: { id: getRandomId(16) } });

      if (!withThumbnail) {
        return;
      }

      const isImage = isFileImage(type);
      const isVideo = isFileVideo(type);
      let img: Nullable<string> = null;

      if (isImage) {
        const byteArray = await file.readBytes();
        const base64Image = byteArray ? uint8ToBase64(byteArray, type) : '';
        img = base64Image ? await resizeImage(base64Image, 200) : '';
      } else if (isVideo) {
        img = await createVideoThumbnail(uploadedFile, 200, 5);
      } else if (type === 'application/pdf') {
        img = await createPdfThumbnail(file, 200);
      }

      img && (await fs.updateXAttrs(fullFilePath, { set: { thumbnail: img } }));
    }
  } catch (e) {
    const errorMessage = `An error creating of the ${uploadedFile.name} file.`;
    console.error(errorMessage, e);
    await w3n.log!('error', errorMessage, e);
  }
}
