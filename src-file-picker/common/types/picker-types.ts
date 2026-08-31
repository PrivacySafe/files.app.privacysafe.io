/**
 * The two tabs...this is also the key used for `windows` in picker state.
 * Internally mapped to real fs sources in usePickerState.ts:
 *   filesystem  -> 'device'
 *   3n-storage  -> 'synced'  (ASSUMPTION: 'local' not addressed yet —
 *                             revisit if it needs its own toggle/tab)
 */
export type PickerSource = 'filesystem' | '3n-storage';

export type PickerLoadStatus = 'idle' | 'loading' | 'error' | 'ready';

export type FsSource = 'device' | 'local' | 'synced';

export interface PickerFile {
  /** Full path from the source's root...doubles as a stable unique id. */
  id: string;
  name: string;
  isFolder: boolean;
  size?: number;
  ctime?: Date;
}

// Row shape handed to Ui3nTable. Keep it separate from PickerFile so the
// table-display concerns (formatted strings) don't leak into the domain type.
export interface PickerTableRow {
  id: string;
  name: string;
  isFolder: boolean;
  type: string; // 'Folder' | extension | ''
  size: number; // 0 for folders, so sort works predictably
  displayingDate: string; // pre-formatted, matches Storage app's pattern
}

export interface PickerWindowState {
  currentPath: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  entries: PickerFile[];
  status: PickerLoadStatus;
  error?: unknown;
}

export interface PickerState {
  activeTab: PickerSource;
  tileView: boolean;
  selected: Set<string>;
  saveFileName: string;
  windows: Record<PickerSource, PickerWindowState>;
}
