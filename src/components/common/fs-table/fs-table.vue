<script lang="ts" setup>
  import { computed, inject, nextTick, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
  import size from 'lodash/size';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY, I18nPlugin, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import {
    Ui3nDropFiles,
    Ui3nInputFile,
    Ui3nTable,
    Ui3nTitle,
    type Ui3nTableProps,
    type Ui3nTableSort,
    type Nullable, Ui3nIcon,
  } from '@v1nt1248/3nclient-lib';
  import { cloudFileSystemSrv } from '@/services/services-provider';
  import { useFsEntryStore } from '@/store';
  import { prepareFolderDataTable } from '@/utils';
  import { getGhostElementText } from './utils';
  import type { AppGlobalEvents, ListingEntryExtended } from '@/types';
  import { FsTableRowEvents, FsTableRowProps } from '@/components/common/fs-table-row/types';
  import type { FsTableProps, FsTableEmits, FsTableSlots } from './types';
  import FsTableRow from '@/components/common/fs-table-row/fs-table-row.vue';

  const vUi3nTitle = Ui3nTitle;

  const props = withDefaults(defineProps<FsTableProps>(), {
    basePath: () => ({ fullPath: '', title: 'Home' }),
  });
  const emits = defineEmits<FsTableEmits>();
  defineSlots<FsTableSlots>();

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const { getFolderContentFilledList, saveFileBaseOnOsFileSystemFile } = cloudFileSystemSrv;
  const { setFolderAsFavorite, unsetFolderAsFavorite, renameEntity } = useFsEntryStore();

  const table = ref<Nullable<HTMLDivElement>>(null);
  const tableComponent = ref<Nullable<typeof Ui3nTable>>(null);
  const folderData = ref<Ui3nTableProps<ListingEntryExtended> | null>(null);
  const sortedFolderDataBody = ref<{ content: ListingEntryExtended[] }>({ content: [] });

  const draggedRows = ref<string[]>([]);
  const droppableRow = ref<Nullable<string>>(null);
  const ghostEl = ref<Nullable<HTMLDivElement>>(null);

  const isNoDataInFolder = computed(() => isEmpty(folderData.value?.body?.content));

  // @ts-ignore
  const selectedFsEntities = computed(() => tableComponent.value?.selectedRowsArray as ListingEntryExtended[]);

  const sortConfig = computed(() => folderData.value?.config?.sortOrder || { field: 'name', direction: 'desc' });

  const pathInfo = computed(() => props.path
    ? `${props.basePath.title}/${props.path}`
    : `${props.basePath.title}`,
  );

  function sortTableRows() {
    sortedFolderDataBody.value = {
      content: (folderData.value?.body?.content || []).sort((a, b) => {
        const { field, direction } = sortConfig.value;
        const sortingField = (field === 'displayingCTime' ? 'ctime' : field) as keyof ListingEntryExtended;
        return a[sortingField]! > b[sortingField]!
          ? (direction === 'desc' ? 1 : -1)
          : (direction === 'desc' ? -1 : 1);
      }),
    };
  }

  function changeSort(val: Ui3nTableSort<ListingEntryExtended>) {
    folderData.value!.config.sortOrder = val;
    sortTableRows();
  }

  async function onFilesSelect(value: File[] | FileList) {
    try {
      emits('loading', true);
      const files = [...value] as File[];
      for (const file of files) {
        await saveFileBaseOnOsFileSystemFile(file, props.path, true);
      }
      bus.$emitter.emit('upload:file', { fullPath: props.path });
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
        if (props.isTrashFolder) return;

        const { row, newName } = payload as { row: ListingEntryExtended, newName: string };
        await renameEntity(row.fullPath, newName);
        await loadFolderData();
        break;
      }
      case 'update:favorite': {
        if (props.isTrashFolder) return;

        const { favoriteId, fullPath } = (payload as { row: ListingEntryExtended }).row;
        if (favoriteId) {
          await unsetFolderAsFavorite(favoriteId, fullPath);
        } else {
          await setFolderAsFavorite(fullPath);
        }
        await loadFolderData();
        break;
      }
      case 'open:info': {
        if (props.isTrashFolder) return;

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
      const data = await getFolderContentFilledList(`${props.path}`, props.basePath.fullPath);
      folderData.value = prepareFolderDataTable(data, props.name, $tr, folderData.value?.config?.sortOrder);
      // @ts-ignore
      tableComponent.value && tableComponent.value!.closeGroupActionsRow();

      nextTick(() => {
        sortTableRows();
      });
    } catch (error) {
      console.error(error);
    } finally {
      emits('loading', false);
    }
  }

  function onDragstart(ev: DragEvent, row: ListingEntryExtended) {
    if (ev.dataTransfer) {
      const data = size(selectedFsEntities.value) > 1
        ? JSON.stringify(selectedFsEntities.value)
        : JSON.stringify([row]);
      draggedRows.value = size(selectedFsEntities.value) > 1
        ? selectedFsEntities.value.map(r => r.fullPath)
        : [row.fullPath];

      const ghostElText = getGhostElementText(selectedFsEntities.value);

      ghostEl.value = document.getElementById('home-dragging-ghost')!.cloneNode(true) as HTMLDivElement;
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
    const data = sourceAsString ? JSON.parse(sourceAsString) : null;
    const target = !draggedRows.value.includes(row.fullPath) ? row : null;
    emits('drag:end', { data, target });
    droppableRow.value = null;
    draggedRows.value = [];
    ev.preventDefault();
  }

  onBeforeMount(async () => {
    await loadFolderData();

    bus.$emitter.on('create:folder', loadFolderData);
    bus.$emitter.on('upload:file', loadFolderData);
    bus.$emitter.on('refresh:data', loadFolderData);
  });

  onBeforeUnmount(() => {
    bus.$emitter.off('create:folder', loadFolderData);
    bus.$emitter.off('upload:file', loadFolderData);
    bus.$emitter.off('refresh:data', loadFolderData);
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
    () => props.path,
    async (val, oVal) => {
      if (val !== oVal) {
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
      :config="folderData.config"
      :head="folderData.head"
      :body="sortedFolderDataBody"
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
          :is-droppable="!!droppableRow && row.fullPath === droppableRow && !draggedRows.includes(row.fullPath)"
          :column-style="columnStyle"
          :events="events"
          :disabled="isTrashFolder"
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
          v-if="!isTrashFolder && isNoDataInFolder && !isInDraggingMode"
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
          v-if="!isTrashFolder && isInSplitMode && !isActive"
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
          v-if="isTrashFolder"
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
      v-ui3n-title="{
        text: pathInfo,
        placement: 'top-start',
      }"
      :class="$style.path"
    >
      {{ pathInfo.replaceAll('/', ' / ') }}
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
    font-size: var(--font-11);
    color: var(--color-text-control-primary-default);
    border-top: 1px solid var(--color-border-table-primary-default);
    @include mixins.text-overflow-ellipsis();
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
