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
  import { computed, type ComputedRef, inject, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import size from 'lodash/size';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import {
    Ui3nDropFiles,
    Ui3nIcon,
    Ui3nInputFile,
    Ui3nTable,
    Ui3nTooltip,
    type Ui3nTableProps,
    type Ui3nTableSort,
    type Nullable,
  } from '@v1nt1248/3nclient-lib';
  import { useNavigation } from '@/composables/useNavigation';
  import { useAbilities } from '@/composables/useAbilities';
  import { useFsTable } from './useFsTable';
  import { useFsStore, useFsEntryStore } from '@/store';
  import type { AppGlobalEvents, ListingEntryExtended, RouteSingle, RouteDouble } from '@/types';
  import type { FsTableProps, FsTableEmits, FsTableSlots } from './types';
  import type { FsTableRowEvents, FsTableRowProps } from '@/components/common/fs-table-row/types';
  import FsTableRow from '@/components/common/fs-table-row/fs-table-row.vue';

  const props = withDefaults(defineProps<FsTableProps>(), {
    basePath: () => ({ fullPath: '', title: 'Home' }),
  });
  const emits = defineEmits<FsTableEmits>();
  defineSlots<FsTableSlots>();

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject(I18N_KEY)!;

  const { route, isSplittedMode, navigateToRouteSingle, navigateToRouteDouble } = useNavigation();
  const { prepareFolderDataTable, getGhostElementText, sortFolderData } = useFsTable();

  const { fsList } = storeToRefs(useFsStore());

  const {
    getFolderContentFilledList,
    setFolderAsFavorite,
    unsetFolderAsFavorite,
    renameEntity,
    saveFileBaseOnOsFileSystemFile,
  } = useFsEntryStore();

  const table = ref<Nullable<HTMLDivElement>>(null);
  const tableComponent = ref<Nullable<typeof Ui3nTable>>(null);
  const folderData = ref<Ui3nTableProps<ListingEntryExtended> | null>(null);

  const draggedRows = ref<string[]>([]);
  const droppableRow = ref<Nullable<string>>(null);
  const ghostEl = ref<Nullable<HTMLDivElement>>(null);

  const currentTableWindow = computed(() => `${props.window}` as '1' | '2');
  const isCurrentTableForTrashFolder = computed(() => {
    if (isSplittedMode.value) {
      return props.window === 1
        ? route.params.fsId === 'user-synced' && route.params.folderId.includes('-trash')
        : route.params.fs2Id === 'user-synced' && route.params.folder2Id.includes('-trash');
    }

    return route.params.fsId === 'user-synced' && route.params.folderId.includes('-trash');
  });
  const isCurrentTableForSystemFolder = computed(() => {
    if (isSplittedMode.value) {
      return props.window === 1
        ? route.params.fsId.includes('system-')
        : route.params.fs2Id.includes('system-');
    }

    return route.params.fsId.includes('system-');
  });

  const isNoDataInFolder = computed(() => isEmpty(folderData.value?.body?.content));

  // @ts-ignore
  const selectedFsEntities = computed(() => tableComponent.value?.selectedRowsArray as ListingEntryExtended[]);

  const sortConfig = computed(() => {
    if (props.isInSplitMode) {
      const {
        sortBy = 'name',
        sortOrder = 'desc',
        sort2By = 'name',
        sort2Order = 'desc',
      } = route.query as RouteDouble['query'];
      return {
        field: props.window === 1 ? sortBy : sort2By,
        direction: props.window === 1 ? sortOrder : sort2Order,
      };
    }

    const { sortBy = 'name', sortOrder = 'desc' } = route.query as RouteSingle['query'];
    return {
      field: sortBy,
      direction: sortOrder,
    };
  }) as ComputedRef<Ui3nTableSort<ListingEntryExtended>>;

  const currentFs = computed(() => Object.values(fsList.value).find(fs => fs.fsId === props.fsId));

  const pathInfo = computed(() => props.path
    ? `${props.basePath.title}/${props.path}`
    : `${props.basePath.title}`,
  );

  const sortedFolderDataBody = computed(() => {
    const { field, direction } = sortConfig.value;
    const sortingField = (
      field === 'displayingCTime' ? 'ctime' : field === 'type' ? 'ext' : field
    ) as keyof ListingEntryExtended;

    return (folderData.value?.body?.content || []).sort((a, b) => sortFolderData(a, b, sortingField, direction));
  }) as ComputedRef<ListingEntryExtended[]>;

  const { canDrop } = useAbilities(currentTableWindow);


  function closeGroupActionsRow() {
    // @ts-ignore
    tableComponent.value && tableComponent.value.closeGroupActionsRow();
  }

  async function changeSort(val: Ui3nTableSort<ListingEntryExtended>) {
    if (props.isInSplitMode) {
      await navigateToRouteDouble({
        query: {
          ...(props.window === 1 && {
            sortBy: val.field,
            sortOrder: val.direction,
          }),
          ...(props.window === 2 && {
            sort2By: val.field,
            sort2Order: val.direction,
          }),
        },
      });
    } else {
      await navigateToRouteSingle({
        query: {
          sortBy: val.field,
          sortOrder: val.direction,
        },
      });
    }
  }

  async function onFilesSelect(value: File[] | FileList) {
    try {
      emits('loading', true);
      const files = [...value] as File[];
      for (const file of files) {
        await saveFileBaseOnOsFileSystemFile({
          fsId: props.fsId,
          uploadedFile: file,
          folderPath: props.path,
          withThumbnail: true,
        });
      }
      bus.$emitter.emit('upload:file', { fsId: props.fsId, fullPath: props.path });
    } finally {
      emits('loading', false);
    }
  }

  async function handleActions(action: { event: FsTableRowEvents; payload?: unknown }) {
    const { event, payload } = action;
    switch (event) {
      case 'go': {
        const path = props.basePath.fullPath
          ? (payload as string).replace(`${props.basePath.fullPath}/`, '')
          : payload as string;
        emits('go', path);
        break;
      }

      case 'rename': {
        if (isCurrentTableForTrashFolder.value || isCurrentTableForSystemFolder.value) return;

        const { row, newName } = payload as { row: ListingEntryExtended, newName: string };
        await renameEntity({ fsId: props.fsId, entity: row, newName });
        await loadFolderData();
        break;
      }

      case 'update:favorite': {
        if (isCurrentTableForTrashFolder.value || isCurrentTableForSystemFolder.value) return;

        const { favoriteId, fullPath } = (payload as { row: ListingEntryExtended }).row;
        if (favoriteId) {
          await unsetFolderAsFavorite({ fsId: props.fsId, id: favoriteId, fullPath });
        } else {
          await setFolderAsFavorite({ fsId: props.fsId, fullPath });
        }
        await loadFolderData();
        break;
      }

      case 'open:info': {
        if (isCurrentTableForTrashFolder.value) return;

        // @ts-ignore
        if (size(tableComponent.value?.selectedRowsArray as ListingEntryExtended[]) > 1) {
          return;
        }

        emits('open:info', (payload as FsTableRowProps<keyof ListingEntryExtended>).row.fullPath);
        break;
      }
    }
  }

  async function loadFolderData() {
    try {
      emits('loading', true);
      const data = await getFolderContentFilledList({
        fsId: props.fsId,
        path: `${props.path}`,
        basePath: props.basePath.fullPath,
      }) || [];
      folderData.value = prepareFolderDataTable(data, props.fsId, $tr);
      // @ts-ignore
      tableComponent.value && tableComponent.value!.closeGroupActionsRow();
    } catch (error) {
      console.error(error);
    } finally {
      emits('loading', false);
    }
  }

  function onDragstart(ev: DragEvent, row: ListingEntryExtended) {
    if (ev.dataTransfer) {
      const data = size(selectedFsEntities.value) > 1
        ? JSON.stringify({ fsId: props.fsId, value: selectedFsEntities.value })
        : JSON.stringify({ fsId: props.fsId, value: [row] });

      draggedRows.value = size(selectedFsEntities.value) > 1
        ? selectedFsEntities.value.map(r => r.fullPath)
        : [row.fullPath];

      const ghostElText = getGhostElementText(selectedFsEntities.value);

      ghostEl.value = document.getElementById('app-dragging-ghost')!.cloneNode(true) as HTMLDivElement;
      const ghostElContent = ghostEl.value.querySelector('span');
      ghostElContent!.innerText = ghostElText;
      document.body.appendChild(ghostEl.value);

      ev.dataTransfer.setData('text/plain', data);
      ev.dataTransfer.effectAllowed = 'copyMove';
      ev.dataTransfer.setDragImage(ghostEl.value!, -8, 0);

      emits('drag:start');
    }
  }

  function onDragend() {
    droppableRow.value = null;
    draggedRows.value = [];
    ghostEl.value && document.body.removeChild(ghostEl.value);
    ghostEl.value = null;
    emits('drag:stop');
  }

  function isDroppable(ev: DragEvent, row: ListingEntryExtended): void {
    if (row.type === 'folder') {
      droppableRow.value = row.fullPath;
      ev.preventDefault();
    } else {
      droppableRow.value = null;
    }
  }

  function onDragleave(ev: DragEvent, row: ListingEntryExtended): void {
    if (droppableRow.value && droppableRow.value === row.fullPath) {
      droppableRow.value = null;
    }
    ev.preventDefault();
  }

  function onDrop(ev: DragEvent, row: ListingEntryExtended): void {
    const sourceAsString = ev.dataTransfer?.getData('text/plain');
    const source: Nullable<{
      fsId: string;
      value: ListingEntryExtended[]
    }> = sourceAsString ? JSON.parse(sourceAsString) : null;

    const target = !draggedRows.value.includes(row.fullPath) ? row : null;

    emits('drag:end', {
      sourceFsId: source?.fsId || null,
      data: source?.value || null,
      targetFsId: props.fsId,
      target,
    });

    droppableRow.value = null;
    draggedRows.value = [];
    ev.preventDefault();
  }

  onBeforeMount(async () => {
    await loadFolderData();

    bus.$emitter.on('create:folder', loadFolderData);
    bus.$emitter.on('upload:file', loadFolderData);
    bus.$emitter.on('refresh:data', loadFolderData);
    bus.$emitter.on('drag:end', closeGroupActionsRow);
  });

  onBeforeUnmount(() => {
    bus.$emitter.off('create:folder', loadFolderData);
    bus.$emitter.off('upload:file', loadFolderData);
    bus.$emitter.off('refresh:data', loadFolderData);
    bus.$emitter.off('drag:end', closeGroupActionsRow);
  });

  watch(
    () => tableComponent.value,
    () => {
      if (tableComponent.value) {
        emits('init', tableComponent.value);
      }
    },
    { immediate: true },
  );

  watch(
    [() => props.fsId, () => props.path],
    async ([fsIdVal, pathVal], [fsIdOldVal, pathOvalVal]) => {
      if (fsIdVal !== fsIdOldVal || pathVal !== pathOvalVal) {
        await loadFolderData();
      }
    },
  );

  watch(
    // @ts-ignore
    () => size(tableComponent.value?.selectedRowsArray as ListingEntryExtended[]),
    (val, oVal) => {
      if (val !== oVal) {
        emits('open:info', '');
      }
    },
  );
</script>

<template>
  <div
    v-if="folderData"
    ref="table"
    :class="[
      $style.fsTable,
      isInSplitMode && $style.fsTableInSplitMode,
      // @ts-ignore
      tableComponent?.hasGroupActionsRow && $style.fsTableShort,
      isActive && $style.fsTableActive
    ]"
    v-on="isInSplitMode && !isActive ? { click: () => emits('make:active') } : {}"
  >
    <ui3n-table
      ref="tableComponent"
      :config="{
        ...folderData.config,
        sortOrder: sortConfig,
      }"
      :head="folderData.head"
      :body="{ content: sortedFolderDataBody }"
      @change:sort="changeSort"
      @select:row="emits('select:entity', $event)"
    >
      <template #group-actions="{ selectedRows }">
        <slot
          name="group-actions"
          :selected-rows="selectedRows"
        />
      </template>

      <template #row="{ row, columnStyle, rowIndex, isRowSelected, events }">
        <fs-table-row
          :row="row"
          :row-index="rowIndex"
          :is-row-selected="isRowSelected"
          :is-droppable="
            !isCurrentTableForSystemFolder
              && !!droppableRow
              && row.fullPath === droppableRow
              && !draggedRows.includes(row.fullPath)
              && canDrop
          "
          :column-style="columnStyle"
          :events="events"
          :window="window"
          @action="handleActions"
          @dragstart="onDragstart($event, row)"
          @dragend="onDragend()"
          @dragenter="isDroppable($event, row)"
          @dragover="isDroppable($event, row)"
          @dragleave="onDragleave($event, row)"
          @drop="onDrop($event, row)"
        />
      </template>

      <template #unused-place>
        <div
          v-if="(!isCurrentTableForTrashFolder && !isCurrentTableForSystemFolder) && isNoDataInFolder && !isInDraggingMode"
          :class="$style.noData"
        >
          <ui3n-drop-files
            :title="$tr('app.upload.text')"
            permanent-display
            @select="onFilesSelect"
          >
            <template #additional-text>
              <div :class="$style.noDataText">
                <span>{{ $tr('table.folder.empty.text') }}</span>&nbsp;
                <ui3n-input-file
                  multiple
                  :button-text="$tr('app.upload.file.text')"
                  @update:model-value="onFilesSelect"
                />
              </div>
            </template>
          </ui3n-drop-files>
        </div>

        <div
          v-if="(!isCurrentTableForTrashFolder && !isCurrentTableForSystemFolder) && isInSplitMode && !isActive && isInDraggingMode"
          :class="[
            $style.droppablePlace,
            !!droppableRow && droppableRow === (path || '/') && $style.droppablePlaceShow
          ]"
          @dragend="onDragend()"
          @dragenter="isDroppable($event, { type: 'folder', fullPath: path || '/' } as ListingEntryExtended)"
          @dragover="isDroppable($event, { type: 'folder', fullPath: path || '/' } as ListingEntryExtended)"
          @dragleave="onDragleave($event, { type: 'folder', fullPath: path || '/' } as ListingEntryExtended)"
          @drop="onDrop($event, { type: 'folder', fullPath: path || '/' } as ListingEntryExtended)"
        >
          <ui3n-icon
            icon="round-system-update-alt"
            :width="48"
            :height="48"
            :rotate="-90"
            color="var(--color-icon-control-accent-default)"
          />
        </div>
      </template>

      <template #no-data>
        <div
          v-if="isCurrentTableForTrashFolder || isCurrentTableForSystemFolder"
          :class="$style.noData"
        >
          <div :class="$style.trashNoData">
            {{ $tr('table.folder.empty.shorttext') }}
          </div>
        </div>
      </template>
    </ui3n-table>

    <div
      v-if="isInSplitMode"
      :class="$style.path"
    >
      <ui3n-tooltip
        :content="pathInfo"
        position-strategy="fixed"
        placement="top"
      >
        <span><b>[{{ currentFs?.name }}]</b> {{ pathInfo.replaceAll('/', ' / ') }}</span>
      </ui3n-tooltip>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins' as mixins;

  .fsTable {
    --dragging-content: '';

    position: relative;
    width: 100%;
    height: 100%;

    & > div:first-child {
      & > div:last-child {
        height: calc(100% - 36px);
      }
    }

    &.fsTableShort > div:first-child {
      & > div:last-child {
        height: calc(100% - 84px);
      }
    }
  }

  .fsTableInSplitMode {
    padding-bottom: 24px;

    & > div:first-child {
      & > div:last-child {
        height: calc(100% - 60px);
      }
    }

    &.fsTableShort > div:first-child {
      & > div:last-child {
        height: calc(100% - 108px);
      }
    }
  }

  .fsTableActive {
    & > div {
      --ui3n-table-header-bg-color: var(--color-bg-table-header-pressed);
    }
  }

  .noData {
    position: relative;
    width: 100%;
    height: 100%;

    & > div:first-child {
      div {
        h3 {
          display: none;
        }
      }
    }
  }

  .noDataText {
    font-size: var(--font-12);
    font-weight: 500;
    line-height: var(--font-16);
    color: var(--color-text-control-secondary-default);
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--space-xs);

    span {
      display: inline-block;
      user-select: none;
    }
  }

  .trashNoData {
    padding-top: var(--spacing-xxl);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    font-size: var(--font-12);
    font-weight: 500;
    color: var(--color-text-control-secondary-default);
  }

  .path {
    position: absolute;
    left: 0;
    width: 100%;
    bottom: 0;
    height: var(--spacing-ml);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 var(--spacing-s);
    border-top: 1px solid var(--color-border-table-primary-default);

    span {
      font-size: var(--font-11);
      color: var(--color-text-control-primary-default);
      @include mixins.text-overflow-ellipsis();
    }
  }

  .droppablePlace {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: all 0.2s ease-in-out;
    background-color: transparent;
  }

  .droppablePlaceShow {
    opacity: 1;
    transition: all 0.2s ease-in-out;
    background-color: var(--color-bg-control-primary-hover);
  }
</style>
