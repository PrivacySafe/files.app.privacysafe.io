/*
 Copyright (C) 2025 3NSoft Inc.

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
import { computed, type ComputedRef, ref } from 'vue';
import { defineStore } from 'pinia';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import { useNavigation } from '@/composables/useNavigation';
import { useAppStore, useFsEntryStore } from '@/store';
import type { ListingEntryExtended, RouteDouble, RouteSingle } from '@/types';
import type { Nullable } from '@v1nt1248/3nclient-lib';

export const useRunModeInfoStore = defineStore('run-mode-info', () => {
  const {
    route,
    isSplittedMode,
    isTileView,
    activeWindow,
    navigateToRouteSingle,
    navigateToRouteDouble,
    selectActiveWindow,
  } = useNavigation();

  const { setCommonLoading, $emitter, $i18n, $createNotice } = useAppStore();

  const { deleteEntity, copyMoveEntities } = useFsEntryStore();

  const isDragging = ref(false);
  const isMoveMode = ref(false);
  const isMoveModeQuick = ref(false);

  const processedPath = computed(() => {
    const { path = '', path2 = '' } = route.query as RouteDouble['query'];

    if (isSplittedMode.value) {
      return activeWindow.value === '1' ? path : path2;
    }

    return path;
  });

  const currentFsId = computed(() => {
    if (isSplittedMode.value) {
      return activeWindow.value === '1' ? route.params.fsId : route.params.fs2Id;
    }

    return route.params.fsId;
  }) as ComputedRef<string>;

  const parentSelectedFolder = computed(() => route.params.folderId) as ComputedRef<string>;

  const currentRootFsFolder = computed(() =>
    isSplittedMode.value && activeWindow.value === '2' ? route.params.folder2Id : route.params.folderId,
  ) as ComputedRef<string>;

  const isCurrentRootFsFolderTrash = computed(() => currentRootFsFolder.value.includes('-trash'));

  const isCurrentRootFsFolderSystem = computed(() => currentRootFsFolder.value.includes('system-'));

  function toggleCopyMoveMode(val: boolean) {
    isMoveMode.value = val;
  }

  async function toggleView() {
    const newView = isTileView.value ? 'table' : 'tile';

    if (isSplittedMode.value) {
      return navigateToRouteDouble({
        query: { view: newView },
      });
    }

    return navigateToRouteSingle({
      query: { view: newView },
    });
  }

  async function toggleMode() {
    const { fsId, folderId } = route.params as RouteSingle['params'] | RouteDouble['params'];
    const { path } = route.query as RouteSingle['query'] | RouteDouble['query'];

    if (isSplittedMode.value) {
      return navigateToRouteSingle({
        params: { fsId, folderId },
        query: { path },
      });
    }

    return navigateToRouteDouble({
      params: { fsId, folderId, fs2Id: fsId, folder2Id: folderId },
      query: { path, path2: '', activeWindow: '1' },
    });
  }

  async function deleteSelectedEntities({
    fsId,
    entities = [],
    completely,
  }: {
    fsId: string;
    entities: ListingEntryExtended[];
    completely?: boolean;
  }) {
    try {
      setCommonLoading(true);

      const processes = entities.map(entity => deleteEntity({ fsId, entity, completely }));

      await Promise.allSettled(processes);

      $emitter.emit('refresh:data', void 0);
    } finally {
      setCommonLoading(false);
    }
  }

  async function onDragStart(window: 1 | '1' | 2 | '2') {
    await selectActiveWindow(window);
    isDragging.value = true;
  }

  async function onDragEnd({
    sourceFsId,
    data,
    targetFsId,
    target,
  }: {
    sourceFsId: Nullable<string>;
    data: Nullable<ListingEntryExtended[]>;
    targetFsId: Nullable<string>;
    target: Nullable<ListingEntryExtended>;
  }) {
    isDragging.value = false;

    if (!sourceFsId || isEmpty(data) || !targetFsId || !target) {
      return;
    }

    try {
      setCommonLoading(true);

      await copyMoveEntities({
        sourceFsId: sourceFsId!,
        entities: data!,
        targetFsId: targetFsId!,
        target: target!,
        moveMode: isMoveMode.value || isMoveModeQuick.value,
      });

      $emitter.emit('drag:end', void 0);
      $emitter.emit('refresh:data', void 0);

      const successMessageSingle =
        isMoveMode.value || isMoveModeQuick.value
          ? $i18n.tr('fs.entity.move.single.message.success')
          : $i18n.tr('fs.entity.copy.single.message.success');

      const successMessageMulti =
        isMoveMode.value || isMoveModeQuick.value
          ? $i18n.tr('fs.entity.move.plural.message.success', { count: `${size(data)}` })
          : $i18n.tr('fs.entity.copy.plural.message.success', { count: `${size(data)}` });

      $createNotice({
        type: 'success',
        withIcon: true,
        content: size(data) > 1 ? successMessageMulti : successMessageSingle,
      });
    } catch (e) {
      console.error(e);

      const errorMessageSingle =
        isMoveMode.value || isMoveModeQuick.value
          ? $i18n.tr('fs.entity.move.single.message.error')
          : $i18n.tr('fs.entity.copy.single.message.error');

      const errorMessageMulti =
        isMoveMode.value || isMoveModeQuick.value
          ? $i18n.tr('fs.entity.move.plural.message.error', { count: `${size(data)}` })
          : $i18n.tr('fs.entity.copy.plural.message.error', { count: `${size(data)}` });

      $createNotice({
        type: 'error',
        withIcon: true,
        content: size(data) > 1 ? errorMessageMulti : errorMessageSingle,
      });
    } finally {
      toggleCopyMoveMode(false);
      setCommonLoading(false);
    }
  }

  return {
    isDragging,
    isMoveMode,
    isMoveModeQuick,
    isTileView,
    isSplittedMode,
    activeWindow,
    processedPath,
    currentFsId,
    currentRootFsFolder,
    parentSelectedFolder,
    isCurrentRootFsFolderTrash,
    isCurrentRootFsFolderSystem,
    toggleCopyMoveMode,
    toggleView,
    toggleMode,
    deleteSelectedEntities,
    onDragStart,
    onDragEnd,
  };
});
