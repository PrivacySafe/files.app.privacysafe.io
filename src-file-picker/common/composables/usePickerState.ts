import { reactive, computed, watch, provide, inject, type InjectionKey } from 'vue';

import { getListFolder } from '@shared/utils/fs-utils';
import type { FsSource, PickerState, PickerSource, PickerWindowState, PickerFile } from '@picker/common/types';
import type { DialogRequestState } from '@picker/common/types/dialog-types';
import { isValidFileName } from '@picker/common/utils/validate-filename';

// Maps our two UI tabs to the real fs sources getUserFS understands.
// ASSUMPTION: '3n-storage' -> 'synced' only for now. 'local' isn't
// addressed yet...revisit if it needs its own toggle inside this tab.

const TAB_TO_FS_SOURCE: Record<PickerSource, FsSource> = {
  filesystem: 'device',
  '3n-storage': 'synced',
};

function createDefaultWindowState(): PickerWindowState {
  return {
    currentPath: '',
    sortBy: 'name',
    sortOrder: 'asc',
    entries: [],
    status: 'idle',
  };
}

export function createPickerState(dialogRequest: DialogRequestState) {
  const state = reactive<PickerState>({
    activeTab: 'filesystem',
    tileView: false,
    selected: new Set<string>(),
    saveFileName: dialogRequest.defaultPath ?? '',
    windows: {
      filesystem: createDefaultWindowState(),
      '3n-storage': createDefaultWindowState(),
    },
  });

  // When saving file, filename will appear in header for mobile version
  watch(
    () => dialogRequest.defaultPath,
    newPath => {
      if (newPath && !state.saveFileName) {
        state.saveFileName = newPath;
      }
    },
  );

  const currentWindow = computed(() => state.windows[state.activeTab]);

  // Memoized per-source FS handle fetches — getUserFS only called once
  // per fs source per picker instance, even switching tabs back and forth.
  // getUserFS returns an FSItem whose .item is writable or readonly
  // depending on the manifest's storage.userFS grant...this app requests
  // "all", so the same underlying object backs both getFs and getWritableFs.
  const fsHandles = new Map<FsSource, Promise<web3n.files.FS>>();

  async function getFs(fsSource: FsSource): Promise<web3n.files.FS> {
    if (!fsHandles.has(fsSource)) {
      const promise = w3n.storage!.getUserFS!(fsSource)
        .then(fsItem => {
          if (!fsItem.isFolder || !fsItem.item) {
            throw new Error(`getUserFS('${fsSource}') did not resolve to a folder root.`);
          }
          return fsItem.item as web3n.files.FS;
        })
        .catch(err => {
          fsHandles.delete(fsSource); // allow retry on next call
          throw err;
        });
      fsHandles.set(fsSource, promise);
    }
    return fsHandles.get(fsSource)!;
  }

  //Same cached handle as getFs, viewed through the writable interface.
  async function getWritableFs(fsSource: FsSource): Promise<web3n.files.WritableFS> {
    const fs = await getFs(fsSource);
    return fs as unknown as web3n.files.WritableFS;
  }

  async function loadEntries(tab: PickerSource, path: string) {
    const win = state.windows[tab];
    win.status = 'loading';
    win.error = undefined;

    try {
      const fs = await getFs(TAB_TO_FS_SOURCE[tab]);
      const lst = await getListFolder({
        fs,
        folderName: path,
        vAPI: false,
        stopErrorPropagate: true,
        actionIfError: err => {
          win.status = 'error';
          win.error = err;
        },
      });
      if (lst) {
        const filtered = lst.filter(entry => !entry.name.startsWith('.'));

        // Stats fetch...per-entry, best-effort. A failed stat() shouldn't
        // blank the whole listing; entry just renders with no size/date.
        const enriched = await Promise.all(
          filtered.map(async (entry): Promise<PickerFile> => {
            const id = path ? `${path}/${entry.name}` : entry.name;
            let size: number | undefined;
            let ctime: Date | undefined;

            try {
              const stats = await fs.stat(id);
              size = stats.size;
              ctime = stats.ctime ?? stats.mtime;
            } catch {
              // leave size/ctime undefined...row still renders
            }

            return {
              id,
              name: entry.name,
              isFolder: !!entry.isFolder,
              size,
              ctime,
            };
          }),
        );

        win.entries = enriched;
        win.currentPath = path;
        win.status = 'ready';
      }
      // if lst is undefined, actionIfError already set status/error above
    } catch (err) {
      // getFs rejected...capability/manifest problem, distinct from a listing failure
      win.status = 'error';
      win.error = err;
    }
  }

  function switchTab(tab: PickerSource) {
    state.selected.clear();
    state.activeTab = tab;
    if (state.windows[tab].status === 'idle') {
      loadEntries(tab, '');
    }
  }

  function navigateToFolder(path: string) {
    state.selected.clear();
    loadEntries(state.activeTab, path);
  }

  function setSort(sortBy: string, sortOrder: 'asc' | 'desc') {
    currentWindow.value.sortBy = sortBy;
    currentWindow.value.sortOrder = sortOrder;
  }

  function toggleTileView() {
    state.tileView = !state.tileView;
  }

  function toggleSelect(fileId: string) {
    if (state.selected.has(fileId)) {
      state.selected.delete(fileId);
      return;
    }
    if (dialogRequest.multiSelections === false && state.selected.size >= 1) {
      state.selected.clear();
    }
    state.selected.add(fileId);
  }

  function clearSelection() {
    state.selected.clear();
  }

  function setSaveFileName(name: string) {
    state.saveFileName = name;
  }

  function isSaveFileNameValid(name: string): boolean {
    return isValidFileName(name);
  }

  function setSelectedIds(ids: string[]) {
    state.selected.clear();
    ids.forEach(id => state.selected.add(id));
  }

  /**
   * Collision check against the already-loaded folder listing...
   * no extra fs round-trip needed. Only meaningful for files, not folders.
   */
  function checkFileNameCollision(name: string): boolean {
    if (!name) return false;
    return currentWindow.value.entries.some(entry => !entry.isFolder && entry.name === name);
  }

  // Kick off the load for the default tab ('filesystem' / 'device') on mount.
  loadEntries(state.activeTab, '');

  async function resolveSelectedFiles(): Promise<web3n.files.ReadonlyFile[]> {
    const fs = await getFs(TAB_TO_FS_SOURCE[state.activeTab]);
    const files = await Promise.all(Array.from(state.selected).map(path => fs.readonlyFile(path)));
    return files;
  }

  async function resolveSaveFile(): Promise<web3n.files.WritableFile> {
    const fs = await getWritableFs(TAB_TO_FS_SOURCE[state.activeTab]);
    const path = currentWindow.value.currentPath
      ? `${currentWindow.value.currentPath}/${state.saveFileName}`
      : state.saveFileName;
    return fs.writableFile(path);
  }

  return {
    activeTab: computed(() => state.activeTab),
    tileView: computed(() => state.tileView),
    selected: computed(() => state.selected),
    saveFileName: computed({
      get: () => state.saveFileName,
      set: setSaveFileName,
    }),
    currentWindow,
    switchTab,
    navigateToFolder,
    setSort,
    toggleTileView,
    toggleSelect,
    clearSelection,
    setSelectedIds,
    checkFileNameCollision,
    isSaveFileNameValid,
    resolveSelectedFiles,
    resolveSaveFile,
  };
}

export type PickerStateApi = ReturnType<typeof createPickerState>;

export const PICKER_STATE_KEY: InjectionKey<PickerStateApi> = Symbol('picker-state');

export function providePickerState(dialogRequest: DialogRequestState) {
  const api = createPickerState(dialogRequest);
  provide(PICKER_STATE_KEY, api);
  return api;
}

export function usePickerState(): PickerStateApi {
  const api = inject(PICKER_STATE_KEY);
  if (!api) {
    throw new Error(
      'usePickerState() called outside <FilePicker> — did you forget to mount it under the root component?',
    );
  }

  return api;
}
