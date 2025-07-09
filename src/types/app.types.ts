export type WritableFS = web3n.files.WritableFS;
export type ListingEntry = web3n.files.ListingEntry;
export type StorageUse = web3n.storage.StorageUse;
export type StorageType = web3n.storage.StorageType;
export type AttachmentsContainer = web3n.asmail.AttachmentsContainer;
export type FS = web3n.files.FS;
export type FileW = web3n.files.File;

export type AvailableLanguage = 'en';

export type AvailableColorTheme = 'default' | 'dark';

export type ConnectivityStatus = 'offline' | 'online';

export type AppConfig = {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
  systemFoldersDisplaying?: boolean;
};

export interface AppConfigsInternal {
  getSettingsFile: () => Promise<AppSettings>;
  saveSettingsFile: (data: AppSettings) => Promise<void>;
  getCurrentLanguage: () => Promise<AvailableLanguage>;
  getCurrentColorTheme: () => Promise<AvailableColorTheme>;
  getSystemFoldersDisplaying: () => Promise<boolean>;
}

export interface AppConfigs {
  getCurrentLanguage: () => Promise<AvailableLanguage>;
  getCurrentColorTheme: () => Promise<AvailableColorTheme>;
  getSystemFoldersDisplaying: () => Promise<boolean>;
  watchConfig(obs: web3n.Observer<AppConfig>): () => void;
}

export interface SettingsJSON {
  lang: AvailableLanguage;
  colorTheme: AvailableColorTheme;
  systemFoldersDisplaying: boolean;
}

export interface AppSettings {
  currentConfig: SettingsJSON;
}

export interface AppGlobalEvents {
  'create:folder': { fsId: string; fullPath: string };
  'upload:file': { fsId: string; fullPath: string };
  'drag:end': void;
  'refresh:data': void;
  'click:breadcrumb': void;
}

export interface FsListItem {
  fsId: string;
  name: string;
  entity: WritableFS;
}

export interface RootFsFolderView {
  id: string;
  fsId: string;
  name: string;
  icon: string;
  disabled?: boolean;
}

export interface ListingEntryExtended extends web3n.files.Stats {
  name: string;
  fullPath: string;
  type: 'folder' | 'file' | 'link';
  id: string;
  favoriteId?: string;
  tags?: string[];
  parentFolder?: string;
  ext?: string;
  thumbnail?: string;
  displayingCTime?: string;
}

export type FsFolderEntityEvent = 'go' | 'go:linked-folder' | 'rename' | 'update:favorite' |
'open:info' | 'open:file' | 'open:linked-file';
