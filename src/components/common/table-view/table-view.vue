<!--
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
-->
<script lang="ts" setup>
  import {
    computed,
    type ComputedRef,
    defineAsyncComponent,
    inject,
    onBeforeMount,
    onBeforeUnmount,
    ref,
    watch,
  } from 'vue';
  import { storeToRefs } from 'pinia';
  import type { AppGlobalEvents, ListingEntryExtended } from '@/types';
  import { I18N_KEY, DIALOGS_KEY, VueBusPlugin, VUEBUS_KEY, NOTIFICATIONS_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import type { Nullable, Ui3nTable } from '@v1nt1248/3nclient-lib';
  import { useAppStore, useFsEntryStore, useRunModeInfoStore } from '@/store';
  import { useNavigation } from '@/composables/useNavigation';
  import FsTable from '@/components/common/fs-table/fs-table.vue';
  import TableBulkActions from '@/components/common/fs-table-bulk-actions/fs-table-bulk-actions.vue';
  import type { FsTableBulkActionName } from '@/components/common/fs-table-bulk-actions/types';
  import FsEntityInfo from '@/components/common/fs-entity-info/fs-entity-info.vue';

  const props = defineProps<{
    window: 1 | 2;
  }>();

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject(I18N_KEY)!;
  const dialogs = inject(DIALOGS_KEY)!;
  const notifications = inject(NOTIFICATIONS_KEY)!;

  const {
    route,
    isSplittedMode,
    activeWindow,
    window1FsId,
    window1RootFolderId,
    window2FsId,
    window2RootFolderId,
    navigateToRouteSingle,
    navigateToRouteDouble,
  } = useNavigation();

  const appStore = useAppStore();
  const { commonLoading, trashFolderName } = storeToRefs(appStore);
  const { setCommonLoading } = appStore;

  const { downloadEntities, restoreEntities } = useFsEntryStore();

  const runModeInfoStore = useRunModeInfoStore();
  const { isDragging, isMoveMode } = storeToRefs(runModeInfoStore);
  const { toggleCopyMoveMode, selectActiveWindow, deleteSelectedEntities, onDragStart, onDragEnd } = runModeInfoStore;

  const tableComponent = ref<Nullable<typeof Ui3nTable>>();
  const displayedFsEntity = ref<string>('');

  const tableFsId = computed(() => {
    if (isSplittedMode.value) {
      return props.window === 1 ? window1FsId.value : window2FsId.value;
    }

    return window1FsId.value;
  }) as ComputedRef<string>;

  const tableParentFolder = computed(() => {
    if (isSplittedMode.value) {
      return props.window === 1 ? window1RootFolderId.value : window2RootFolderId.value;
    }

    return window1RootFolderId.value;
  }) as ComputedRef<string>;

  const currentProcessedPath = computed(() => {
    if (isSplittedMode.value) {
      return props.window === 1 ? route.query.path || '' : route.query.path2 || '';
    }

    return route.query.path || '';
  }) as ComputedRef<string>;

  function closeFsInfoBlock() {
    displayedFsEntity.value = '';
  }

  async function go(fullPath: string) {
    closeFsInfoBlock();
    if (isSplittedMode.value) {
      return navigateToRouteDouble({
        query: {
          ...(props.window === 1 && { path: fullPath }),
          ...(props.window === 2 && { path2: fullPath }),
        },
      });
    }

    return navigateToRouteSingle({
      params: { fsId: tableFsId.value },
      query: { path: fullPath },
    });
  }

  function fsEntityInfoOpen(path: string) {
    if (!isSplittedMode.value) {
      displayedFsEntity.value = path;
    }
  }

  async function handleBulkActions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { action, payload }: { action: FsTableBulkActionName, payload?: unknown },
    entities: ListingEntryExtended[],
  ) {
    switch (action) {
      case 'delete':
        await deleteSelectedEntities({ fsId: tableFsId.value, entities, completely: false });
        break;

      case 'delete:completely': {
        const component = defineAsyncComponent(() => import('@/components/dialogs/confirmation-dialog.vue'));
        dialogs.$openDialog<typeof component>({
          component,
          componentProps: {
            dialogText: $tr('fs.entity.delete.permanently.warning1'),
            additionalDialogText: $tr('fs.entity.delete.permanently.warning2'),
          },
          dialogProps: {
            title: $tr('fs.entity.delete.permanently.title'),
            confirmButtonText: $tr('fs.entity.delete.permanently.confirm,button'),
            confirmButtonBackground: 'var(--error-content-default)',
            confirmButtonColor: 'var(--error-fill-default)',
            onConfirm: async () => {
              try {
                await deleteSelectedEntities({ fsId: tableFsId.value, entities, completely: true });

                notifications.$createNotice({
                  type: 'info',
                  withIcon: true,
                  content: entities.length > 1
                    ? $tr('fs.entity.delete.plural.message.success', { count: `${entities.length}` })
                    : $tr('fs.entity.delete.single.message.success'),
                });
              } catch (err) {
                w3n.log('error', err as string);

                notifications.$createNotice({
                  type: 'error',
                  withIcon: true,
                  content: entities.length > 1
                    ? $tr('fs.entity.delete.plural.message.error', { count: `${entities.length}` })
                    : $tr('fs.entity.delete.single.message.error'),
                });
              }
            },
          },
        });
        break;
      }

      case 'restore': {
        let res;
        try {
          res = await restoreEntities({ fsId: tableFsId.value, entities });
          if (res && res > 0) {
            bus.$emitter.emit('refresh:data', void 0);
            notifications.$createNotice({
              type: 'success',
              withIcon: true,
              content: res > 1
                ? $tr('fs.entity.restore.plural.message.success', { count: `${res}` })
                : $tr('fs.entity.restore.single.message.success'),
            });
          }
        } catch (err) {
          w3n.log('error', err as string);
          notifications.$createNotice({
            type: 'error',
            withIcon: true,
            content: res && res > 1
              ? $tr('fs.entity.restore.plural.message.error', { count: `${res}` })
              : $tr('fs.entity.restore.single.message.error'),
          });
        }
        break;
      }

      case 'download':
        await downloadEntities({ fsId: tableFsId.value, entities });
        break;
    }
  }

  onBeforeMount(() => {
    bus.$emitter.on('click:breadcrumb', closeFsInfoBlock);
  });

  onBeforeUnmount(() => {
    bus.$emitter.off('click:breadcrumb', closeFsInfoBlock);
  });

  watch(
    isSplittedMode,
    (val, oVal) => {
      if (val && val !== oVal) {
        displayedFsEntity.value = '';
      }
    }, {
      immediate: true,
    },
  );
</script>

<template>
  <div :class="$style.tableView">
    <div :class="[$style.content, displayedFsEntity && !isSplittedMode && $style.narrow]">
      <fs-table
        :fs-id="tableFsId"
        :window="window"
        :base-path="{ fullPath: tableParentFolder.includes('-trash') ? trashFolderName : '', title: '' }"
        :path="currentProcessedPath"
        :is-in-split-mode="isSplittedMode"
        :is-in-dragging-mode="isDragging"
        :is-active="activeWindow === `${window}`"
        :is-loading="commonLoading"
        @init="tableComponent = $event"
        @loading="setCommonLoading($event)"
        @make:active="selectActiveWindow(window)"
        @go="go"
        @open:info="fsEntityInfoOpen"
        @drag:start="onDragStart(window)"
        @drag:end="onDragEnd"
        @drag:stop="isDragging = false"
      >
        <template #group-actions="{ selectedRows }">
          <table-bulk-actions
            :window="window"
            :selected-rows="selectedRows"
            :is-move-mode="isMoveMode"
            :disabled="commonLoading"
            @action="handleBulkActions($event, selectedRows)"
            @update:move-mode="toggleCopyMoveMode"
          />
        </template>
      </fs-table>
    </div>

    <transition
      name="fade"
      mode="in-out"
    >
      <div
        v-if="displayedFsEntity && !isSplittedMode"
        :class="$style.info"
      >
        <fs-entity-info
          :fs-id="tableFsId"
          :path="displayedFsEntity"
          @close="displayedFsEntity = ''"
        />
      </div>
    </transition>
  </div>
</template>

<style lang="scss" module>
  .tableView {
    --header-height: 64px;
    --sidebar-width: 285px;

    display: flex;
    position: relative;
    width: 100%;
    height: 100%;
    cursor: default;
    overflow-y: auto;
  }

  .content {
    position: relative;
    width: 100%;
    height: 100%;

    &.narrow {
      width: calc(100% - var(--sidebar-width) - 1px);
    }
  }

  .info {
    position: relative;
    width: var(--sidebar-width);
    border-left: 1px solid var(--color-border-block-primary-default);
  }
</style>
