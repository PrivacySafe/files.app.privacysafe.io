import { getFileExtension } from '@v1nt1248/3nclient-lib/utils';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { ListingEntryExtended } from '@/types';
import { prepareFsEntityId } from './utils';

export async function loadFsEntityStats(
  fs: web3n.files.WritableFS,
  fullPath: string,
): Promise<
  Nullable<
    ListingEntryExtended & {
      thumbnail?: string;
    }
  >
> {
  if (!fullPath) {
    return null;
  }

  const isThisFsDevice = fs.type === 'device';

  const name = fullPath.split('/').pop() || '';
  const stats = await fs!.stat(fullPath);

  const id = prepareFsEntityId(fs, fullPath);
  const tags = isThisFsDevice ? [] : ((await fs!.getXAttr(fullPath, 'tags')) as string[] | undefined);
  const favoriteId = isThisFsDevice ? undefined : ((await fs!.getXAttr(fullPath, 'favoriteId')) as string | undefined);
  const thumbnail = isThisFsDevice ? undefined : ((await fs!.getXAttr(fullPath, 'thumbnail')) as string | undefined);
  const kayrosAttrsNames = await fs!.listXAttrs(fullPath)
    .catch(() => []) as string[];
  const kayrosAttrKeys = kayrosAttrsNames.filter(name => name.startsWith('kayros_'));
  const kayrosAttrsEntries = await Promise.all(kayrosAttrKeys.map(async key => (
    [key, await fs!.getXAttr(fullPath, key).catch(() => undefined)] as const
  )));
  const kayrosAttrs = Object.fromEntries(
    kayrosAttrsEntries.filter(([, value]) => value !== undefined),
  );

  return {
    id,
    name,
    fullPath,
    tags: tags || [],
    type: stats.isFile ? 'file' : stats.isFolder ? 'folder' : 'link',
    ...(favoriteId && { favoriteId }),
    ...(stats.isFile && { ext: getFileExtension(name) }),
    ...(thumbnail && { thumbnail }),
    ...(Object.keys(kayrosAttrs).length > 0 && { kayrosAttrs }),
    ...stats,
  };
}
