export function getCompoundFsId(fs: web3n.files.WritableFS): string {
  const processedFsName = fs.name
    .replaceAll(' ', '_')
    .replace(/[.*+?^$&{}()|[\]\\]/g, '')
    .toLowerCase();

  return `${fs.type}-${processedFsName}`;
}

export function prepareFsEntityId(fs: web3n.files.WritableFS, entityPath: string): string {
  const compoundFsId = getCompoundFsId(fs);
  return `${compoundFsId}-${entityPath.replace(/[.*+?^$&{}()|/[\]\\]/g, '_')}`;
}
