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
  import { VueBusPlugin, VUEBUS_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nProgressCircular } from '@v1nt1248/3nclient-lib';
  import { useFsEntryStore } from '@/store/fs-entity.store';
  import type { AppGlobalEvents, ListingEntryExtended } from '@/types';
  import FsPageToolbar from '@/components/common/fs-page-toolbar/fs-page-toolbar.vue';
  import FsTable from '@/components/common/fs-table/fs-table.vue';
  import FsTableBulkActions from '@/components/common/fs-table-bulk-actions/fs-table-bulk-actions.vue';
  import FsEntityInfo from '@/components/views/home/fs-entity-info/fs-entity-info.vue';
  import { HOME_PAGE_FS_ACTIONS } from './constants';
  import type { FsTableBulkActionName } from '@/components/common/fs-table-bulk-actions/types';

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;

  const route = useRoute();
  const router = useRouter();

  const { deleteEntity } = useFsEntryStore();

  const currentProcessedPaths = ref({ first: '', second: '' });
  const isSplitMode = ref(false);
  const isLoading = ref(false);
  const displayedFsEntity = ref<string>('');
  const selectedEntities = ref<ListingEntryExtended[]>([]);

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

  async function selectActiveWindow(val: '1' | '2') {
    const { path = '', path2 = '' } = route.query as { path?: string; path2?: string; activePath?: string };
    await router.push({ query: { path, path2, activePath: val } });
  }

  function fsEntityInfoOpen(path: string) {
    if (!isSplitMode.value) {
      displayedFsEntity.value = path;
    }
  }

  async function switchNoSplitMode() {
    displayedFsEntity.value = '';
    isSplitMode.value = false;
    await router.push({ query: { path: currentProcessedPaths.value.first, path2: '', activePath: '1' } });
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
    { action }: { action: FsTableBulkActionName },
    entities: ListingEntryExtended[],
  ) {
    switch (action) {
      case 'delete':
        await deleteSelectedEntities(entities);
        break;
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
  <div :class="$style.home">
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
            :is-active="isSplitMode && activeWindow === 'left'"
            :is-loading="isLoading"
            @loading="isLoading = $event"
            @make:active="selectActiveWindow('1')"
            @go="go"
            @open:info="fsEntityInfoOpen"
            @select:entity="selectedEntities = $event"
          >
            <template #group-actions="{ selectedRows }">
              <fs-table-bulk-actions
                :config="HOME_PAGE_FS_ACTIONS"
                :selected-rows="selectedRows"
                :disabled="isLoading"
                @action="handleBulkActions($event, selectedRows)"
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
            :is-active="isSplitMode && activeWindow === 'right'"
            :is-loading="isLoading"
            @loading="isLoading = $event"
            @make:active=" selectActiveWindow('2')"
            @go="go"
            @open:info="fsEntityInfoOpen"
          >
            <template #group-actions="{ selectedRows }">
              <fs-table-bulk-actions
                :config="HOME_PAGE_FS_ACTIONS"
                :selected-rows="selectedRows"
                :disabled="isLoading"
                @action="handleBulkActions($event, selectedRows)"
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
  </div>
</template>

<style lang="scss" module>
  .home {
    --header-height: calc(var(--spacing-l) * 2);
    --sidebar-width: calc(var(--column-size) * 3);

    position: relative;
    width: 100%;
    height: 100%;
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
      border-right: 1px solid var(--color-border-table-accent-default);
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
</style>
