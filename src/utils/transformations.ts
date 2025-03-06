export function prepareFolderPath(paths: Array<string | undefined> = []): string {
  return paths.reduce((res: string, item) => {
    if (item) {
      res = res ? `${res}/${item}` : item;
    }

    return res;
  }, '');
}
