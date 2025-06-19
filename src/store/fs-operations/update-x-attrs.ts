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
export async function updateXAttrs({
  fs,
  path,
  attrs,
}: {
  fs: web3n.files.WritableFS;
  path: string;
  attrs: Record<string, any | undefined>;
}) {
  try {
    await fs!.updateXAttrs(path, {
      set: attrs,
    });
  } catch (e) {
    const attrNames = Object.keys(attrs).join(', ');
    const errorMessage = `Error update xAttrs (${attrNames}) in the entity ${path}. `;
    await w3n.log!('error', errorMessage, e);
  }
}
