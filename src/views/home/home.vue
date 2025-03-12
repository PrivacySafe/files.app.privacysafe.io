<!--
 Copyright (C) 2024 - 2025 3NSoft Inc.

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
-->
<script lang="ts" setup>
  import { computed, inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import size from 'lodash/size';
  import isEmpty from 'lodash/isEmpty';
  import {
    VueBusPlugin,
    VUEBUS_KEY,
    I18N_KEY,
    I18nPlugin,
    NotificationsPlugin,
    NOTIFICATIONS_KEY,
  } from '@v1nt1248/3nclient-lib/plugins';
  import { type Nullable, Ui3nButton, Ui3nIcon, Ui3nProgressCircular, Ui3nTable } from '@v1nt1248/3nclient-lib';
  import { useFsEntryStore } from '@/store/fs-entity.store';
  import type { AppGlobalEvents, ListingEntryExtended } from '@/types';
  import FsPageToolbar from '@/components/common/fs-page-toolbar/fs-page-toolbar.vue';
  import FsTable from '@/components/common/fs-table/fs-table.vue';
  import FsTableBulkActions from '@/components/common/fs-table-bulk-actions/fs-table-bulk-actions.vue';
  import FsEntityInfo from '@/components/views/home/fs-entity-info/fs-entity-info.vue';
  import { HOME_PAGE_FS_ACTIONS } from './constants';
  import type { FsTableBulkActionName } from '@/components/common/fs-table-bulk-actions/types';

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;

  const route = useRoute();
  const router = useRouter();

  const { downloadEntities, deleteEntity, copyMoveEntities } = useFsEntryStore();

  const tableComponents = ref<{
    left: Nullable<typeof Ui3nTable>;
    right: Nullable<typeof Ui3nTable>;
  }>({
    left: null,
    right: null,
  });

  const currentProcessedPaths = ref({ first: '', second: '' });
  const isSplitMode = ref(false);
  const isLoading = ref(false);
  const isMoveMode = ref({
    left: false,
    right: false,
  });
  const isDragging = ref(false);
  const displayedFsEntity = ref<string>('');

  const activeWindow = computed(() => {
    const { activePath = '1' } = route.query as { path?: string; path2?: string; activePath?: string };
    return activePath === '1' ? 'left' : 'right';
  });

  async function go(fullPath: string) {
    if (!isSplitMode.value) {
      await router.push({ query: { path: fullPath, path2: '', activePath: '1' } });
      displayedFsEntity.value = '';
      return;
    }

    const query = activeWindow.value === 'left'
      ? { path: fullPath, path2: currentProcessedPaths.value.second, activePath: '1' }
      : { path: currentProcessedPaths.value.first, path2: fullPath, activePath: '2' };
    await router.push({ query });
    displayedFsEntity.value = '';
  }

  async function switchMode() {
    if (isSplitMode.value) {
      await switchNoSplitMode();
    } else {
      displayedFsEntity.value = '';
      const { path = '', path2 = '' } = route.query as { path?: string; path2?: string; activePath?: string };
      await router.push({ query: { path, path2, activePath: '1' } });
      isSplitMode.value = true;
    }
  }
  async function switchNoSplitMode() {
    displayedFsEntity.value = '';
    isSplitMode.value = false;
    isMoveMode.value.right = false;
    await router.push({ query: { path: currentProcessedPaths.value.first, path2: '', activePath: '1' } });
  }

  async function selectActiveWindow(val: '1' | '2') {
    const { path = '', path2 = '', activePath } = route.query as { path?: string; path2?: string; activePath?: string };
    if (activePath !== val) {
      await router.push({ query: { path, path2, activePath: val } });
    }
  }

  function fsEntityInfoOpen(path: string) {
    if (!isSplitMode.value) {
      displayedFsEntity.value = path;
    }
  }

  async function deleteSelectedEntities(entities: ListingEntryExtended[] = []) {
    try {
      isLoading.value = true;
      const processes = entities.map((entity) => deleteEntity(entity));
      await Promise.all(processes);
      bus.$emitter.emit('refresh:data', void 0);
    } finally {
      isLoading.value = false;
    }
  }

  async function handleBulkActions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { action, payload }: { action: FsTableBulkActionName, payload?: unknown },
    entities: ListingEntryExtended[],
  ) {
    switch (action) {
      case 'delete':
        await deleteSelectedEntities(entities);
        break;

      case 'download':
        await downloadEntities(entities);
        break;
    }
  }

  function toggleCopyMoveMode(value: boolean, window: '1' | '2' = '1') {
    const tablePosition = window === '1' ? 'left' : 'right';
    isMoveMode.value[tablePosition] = value;
  }

  function onDragStart(window: '1' | '2') {
    selectActiveWindow(window);
    isDragging.value = true
  }

  async function onDragEnd({ data, target }: {
    data: Nullable<ListingEntryExtended[]>;
    target: Nullable<ListingEntryExtended>
  }) {
    isDragging.value = false;

    if (isEmpty(data) || !target) {
      return;
    }

    try {
      isLoading.value = true;
      await copyMoveEntities(data!, target, isMoveMode.value[activeWindow.value]);

      // @ts-ignore
      tableComponents.value.left && tableComponents.value.left!.closeGroupActionsRow();
      // @ts-ignore
      tableComponents.value.right && tableComponents.value.right!.closeGroupActionsRow();
      isMoveMode.value = {
        left: false,
        right: false,
      };

      bus.$emitter.emit('refresh:data', void 0);
      const successMessageSingle = isMoveMode.value[activeWindow.value]
        ? $tr('fs.entity.move.single.message.success')
        : $tr('fs.entity.copy.single.message.success');
      const successMessageMulti = isMoveMode.value[activeWindow.value]
        ? $tr('fs.entity.move.plural.message.success', { count: `${size(data)}` })
        : $tr('fs.entity.copy.plural.message.success', { count: `${size(data)}` });

      notifications.$createNotice({
        type: 'success',
        withIcon: true,
        content: size(data) > 1 ? successMessageMulti : successMessageSingle,
      });
    } catch (e) {
      console.error(e);

      const errorMessageSingle = isMoveMode.value[activeWindow.value]
        ? $tr('fs.entity.move.single.message.error')
        : $tr('fs.entity.copy.single.message.error');
      const errorMessageMulti = isMoveMode.value[activeWindow.value]
        ? $tr('fs.entity.move.plural.message.error', { count: `${size(data)}` })
        : $tr('fs.entity.copy.plural.message.error', { count: `${size(data)}` });

      notifications.$createNotice({
        type: 'error',
        withIcon: true,
        content: size(data) > 1 ? errorMessageMulti : errorMessageSingle,
      });
    } finally {
      isLoading.value = false;
    }
  }

  onBeforeMount(() => {
    bus.$emitter.on('go:favorite', switchNoSplitMode);
  });

  onBeforeUnmount(() => {
    bus.$emitter.off('go:favorite', switchNoSplitMode);
  });
</script>

<template>
  <div :class="[$style.home, isDragging && $style.homeDraggingMode]">
    <fs-page-toolbar
      :base-path="{ fullPath: '', title: 'Home' }"
      :is-split-mode="isSplitMode"
      :active-window="activeWindow"
      @change:paths="currentProcessedPaths = $event"
      @go="go"
    >
      <template #actions>
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="isSplitMode ? 'round-check-box-outline-blank' : 'splitscreen-right'"
          icon-color="var(--color-icon-button-secondary-default)"
          @click="switchMode"
        />
      </template>
    </fs-page-toolbar>

    <div :class="$style.body">
      <div :class="$style.content">
        <div :class="[$style.table, isSplitMode && $style.reducedTable]">
          <fs-table
            name="home"
            :path="currentProcessedPaths.first"
            :is-in-split-mode="isSplitMode"
            :is-in-dragging-mode="isDragging"
            :is-active="isSplitMode && activeWindow === 'left'"
            :is-loading="isLoading"
            @init="tableComponents.left = $event"
            @loading="isLoading = $event"
            @make:active="selectActiveWindow('1')"
            @go="go"
            @open:info="fsEntityInfoOpen"
            @drag:start="onDragStart('1')"
            @drag:end="onDragEnd"
            @drag:stop="isDragging = false"
          >
            <template #group-actions="{ selectedRows }">
              <fs-table-bulk-actions
                :config="HOME_PAGE_FS_ACTIONS"
                :selected-rows="selectedRows"
                :is-move-mode="isMoveMode.left"
                :disabled="isLoading"
                @action="handleBulkActions($event, selectedRows)"
                @update:move-mode="toggleCopyMoveMode($event, '1')"
              />
            </template>
          </fs-table>
        </div>

        <div
          v-if="isSplitMode"
          :class="[$style.table, isSplitMode && $style.reducedTable]"
        >
          <fs-table
            name="home-extra"
            :path="currentProcessedPaths.second"
            :is-in-split-mode="isSplitMode"
            :is-in-dragging-mode="isDragging"
            :is-active="isSplitMode && activeWindow === 'right'"
            :is-loading="isLoading"
            @init="tableComponents.right = $event"
            @loading="isLoading = $event"
            @make:active="selectActiveWindow('2')"
            @go="go"
            @open:info="fsEntityInfoOpen"
            @drag:start="onDragStart('2')"
            @drag:end="onDragEnd"
            @drag:stop="isDragging = false"
          >
            <template #group-actions="{ selectedRows }">
              <fs-table-bulk-actions
                :config="HOME_PAGE_FS_ACTIONS"
                :selected-rows="selectedRows"
                :is-move-mode="isMoveMode.right"
                :disabled="isLoading"
                @action="handleBulkActions($event, selectedRows)"
                @update:move-mode="toggleCopyMoveMode($event, '2')"
              />
            </template>
          </fs-table>
        </div>
      </div>

      <transition
        name="fade"
        mode="in-out"
      >
        <div
          v-if="displayedFsEntity && !isSplitMode"
          :class="$style.info"
        >
          <fs-entity-info
            :path="displayedFsEntity"
            @close="displayedFsEntity = ''"
          />
        </div>
      </transition>
    </div>

    <div
      v-if="isLoading"
      :class="$style.loader"
    >
      <ui3n-progress-circular
        indeterminate
        size="80"
      />
    </div>

    <div
      v-if="isDragging"
      :class="$style.draggingNotice"
    >
      <ui3n-icon
        icon="drag-pan"
        color="var(--color-icon-table-accent-default)"
      />

      {{ isMoveMode[activeWindow] ? $tr('fs.entity.action.moving') : $tr('fs.entity.action.copying') }}
    </div>

    <div
      id="home-dragging-ghost"
      :class="$style.draggingInfo"
    >
      <ui3n-icon
        icon="drag-pan"
        color="var(--color-icon-button-primary-default)"
      />

      <span>data</span>
    </div>
  </div>
</template>

<style lang="scss" module>
  .home {
    --header-height: calc(var(--spacing-l) * 2);
    --sidebar-width: calc(var(--column-size) * 3);

    position: relative;
    width: 100%;
    height: 100%;
    cursor: default;
  }

  .homeDraggingMode {
    cursor: none;
  }

  .body {
    position: relative;
    width: 100%;
    height: calc(100% - var(--header-height));
    display: flex;
    justify-content: space-between;
    align-items: stretch;
  }

  .content {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: stretch;
    flex-grow: 1;

    .reducedTable:first-child {
      border-right: 1px solid var(--color-border-table-primary-default);
    }
  }

  .info {
    position: relative;
    width: 285px;
    border-left: 1px solid var(--color-border-block-primary-default);
  }

  .table {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .reducedTable {
    width: 50%;
  }

  .bulkActions {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .loader {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    background-color: var(--black-12);
  }

  .draggingNotice {
    position: fixed;
    z-index: 50;
    width: 96px;
    height: 48px;
    left: calc(50% + 95px - 48px);
    bottom: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-xs);
    border-radius: 12px;
    color: var(--color-text-table-primary-default);
    background-color: var(--color-bg-control-secondary-default);
    font-size: var(--font-12);
    line-height: var(--font-16);
    font-weight: 500;
  }

  .draggingInfo {
    position: absolute;
    top: -200px;
    left: -1000px;
    width: max-content;
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--color-bg-control-accent-default);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    font-size: var(--font-12);
    color: var(--color-text-avatar-primary-default);
    border-radius: 6px;
  }
</style>
