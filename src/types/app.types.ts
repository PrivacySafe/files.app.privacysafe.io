export type IncomingMessage = web3n.asmail.IncomingMessage;
export type OutgoingMessage = web3n.asmail.OutgoingMessage;
export type MsgInfo = web3n.asmail.MsgInfo;
export type AttachmentsContainer = web3n.asmail.AttachmentsContainer;

export type FS = web3n.files.FS;
export type FileW = web3n.files.File;
export type FileException = web3n.files.FileException;

export type ReadonlyFS = web3n.files.ReadonlyFS;
export type WritableFS = web3n.files.WritableFS;
export type WritableVersionedFS = web3n.files.WritableFS;
export type FSCollection = web3n.files.FSCollection;
export type FSItem = web3n.files.FSItem;
export type ListingEntry = web3n.files.ListingEntry;
export type ReadonlyFile = web3n.files.ReadonlyFile;
export type WritableFile = web3n.files.WritableFile;
export type SymLink = web3n.files.SymLink;

export type ByteSource = web3n.files.FileByteSource;
export type ByteSink = web3n.files.FileByteSink;
export type FolderEvent = web3n.files.FolderEvent;
export type SelectCriteria = web3n.files.SelectCriteria;

export interface FileWithId extends ReadonlyFile {
  fileId: string;
}

export type AvailableLanguage = 'en';

export type AvailableColorTheme = 'default' | 'dark';

export type ConnectivityStatus = 'offline' | 'online';

export type AppConfig = {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
};

export interface AppConfigsInternal {
  getSettingsFile: () => Promise<AppSettings>;
  saveSettingsFile: (data: AppSettings) => Promise<void>;
  getCurrentLanguage: () => Promise<AvailableLanguage>;
  getCurrentColorTheme: () => Promise<AvailableColorTheme>;
}

export interface AppConfigs {
  getCurrentLanguage: () => Promise<AvailableLanguage>;
  getCurrentColorTheme: () => Promise<AvailableColorTheme>;
  watchConfig(obs: web3n.Observer<AppConfig>): () => void;
}

export interface SettingsJSON {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
}

export interface AppSettings {
  currentConfig: SettingsJSON;
}

export interface SystemFolderView {
  name: string;
  icon: string;
  route: string;
}

export interface ListingEntryExtended extends web3n.files.Stats {
  name: string;
  fullPath: string;
  type: 'folder' | 'file' | 'link';
  id?: string;
  favoriteId?: string;
  tags?: string[];
  parentFolder?: string;
  ext?: string;
  displayingCTime?: string;
}

export interface AppGlobalEvents {
  'go:favorite': void;
  'create:folder': { fullPath: string };
  'upload:file': { fullPath: string };
  'refresh:data': void;
}
