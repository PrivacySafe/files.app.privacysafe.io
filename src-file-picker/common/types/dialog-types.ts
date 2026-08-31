export interface DialogResultMap {
  openFile: web3n.files.ReadonlyFile[];
  openFolder: web3n.files.WritableFS[];
  saveFile: web3n.files.WritableFile;
  saveFolder: web3n.files.WritableFS;
}

export type DialogMode = keyof DialogResultMap;
export type DialogResult = DialogResultMap[DialogMode] | undefined;

export interface DialogRequestState {
  mode: DialogMode | null;
  title: string;
  btnLabel: string;
  multiSelections: boolean;
  filters?: web3n.shell.files.FileTypeFilter[];
  defaultPath?: string;
  resolve: ((result: DialogResult) => void) | null;
}
