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
  import { computed, defineAsyncComponent, inject, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import {
    DialogsPlugin,
    DIALOGS_KEY,
    I18nPlugin,
    I18N_KEY,
    VueBusPlugin,
    VUEBUS_KEY,
  } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nProgressCircular } from '@v1nt1248/3nclient-lib';
  import { cloudFileSystemSrv } from '@/services/services-provider';
  import { useFsEntryStore } from '@/store/fs-entity.store';
  import type { AppGlobalEvents, ListingEntryExtended } from '@/types';
  import FsPageToolbar from '@/components/common/fs-page-toolbar/fs-page-toolbar.vue';
  import FsTable from '@/components/common/fs-table/fs-table.vue';
  import FsTableBulkActions from '@/components/common/fs-table-bulk-actions/fs-table-bulk-actions.vue';
  import { TRASH_PAGE_FS_ACTIONS } from './constants';
  import { FsTableBulkActionName } from '@/components/common/fs-table-bulk-actions/types';

  const route = useRoute();
  const router = useRouter();

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;
  const dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;

  const { trashFolderName } = cloudFileSystemSrv;
  const { deleteEntity } = useFsEntryStore();

  const currentProcessedPaths = ref({ first: '', second: '' });
  const isLoading = ref(false);
  const selectedEntities = ref<ListingEntryExtended[]>([]);

  const availableFsActions = computed(() => {
    const { path = '' } = route.query as { path?: string };
    return path
      ? { download: TRASH_PAGE_FS_ACTIONS.download }
      : TRASH_PAGE_FS_ACTIONS;
  });

  async function go(fullPath: string) {
    await router.push({ query: { path: fullPath, path2: '' } });
  }

  async function handleBulkActions(
    { action }: { action: FsTableBulkActionName },
    entities: ListingEntryExtended[],
  ) {
    console.log('handleBulkActions: ', action, entities);
    switch (action) {
      case 'delete':
        // eslint-disable-next-line
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
              const res = entities.map((entity) => deleteEntity(entity));
              await Promise.all(res);
              bus.$emitter.emit('refresh:data', void 0);
            },
          },
        });
        break;
    }
  }
</script>

<template>
  <div :class="$style.trash">
    <fs-page-toolbar
      :base-path="{ fullPath: trashFolderName, title: 'Trash' }"
      @change:paths="currentProcessedPaths = $event"
      @go="go"
    />

    <div :class="$style.body">
      <div :class="$style.table">
        <fs-table
          name="trash"
          :base-path="{ fullPath: trashFolderName, title: 'Trash' }"
          :path="currentProcessedPaths.first"
          :is-loading="isLoading"
          is-trash-folder
          @loading="isLoading = $event"
          @go="go"
          @select:entity="selectedEntities = $event"
        >
          <template #group-actions="{ selectedRows }">
            <fs-table-bulk-actions
              :config="availableFsActions"
              :selected-rows="selectedRows"
              :disabled="isLoading"
              @action="handleBulkActions($event, selectedRows)"
            />
          </template>
        </fs-table>
      </div>
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
  .trash {
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

  .table {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
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
