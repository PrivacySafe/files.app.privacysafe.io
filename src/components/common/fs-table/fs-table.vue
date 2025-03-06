<script lang="ts" setup>
  import { computed, inject, nextTick, onBeforeMount, onBeforeUnmount, ref, watch, useCssModule } from 'vue';
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
    type Nullable,
  } from '@v1nt1248/3nclient-lib';
  import { cloudFileSystemSrv } from '@/services/services-provider';
  import { useFsEntryStore } from '@/store';
  import { prepareFolderDataTable } from '@/utils';
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

  const $cssVars = useCssModule();
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
  const ghostEl = ref<Nullable<HTMLElement>>(null);

  const isNoDataInFolder = computed(() => isEmpty(folderData.value?.body?.content));

  // @ts-ignore
  const selectedFsEntities = computed(() => tableComponent.value?.selectedRowsArray as ListingEntryExtended[]);

  const sortConfig = computed(() => folderData.value?.config?.sortOrder || { field: 'name', direction: 'desc' });

  const pathInfo = computed(() => props.path
    ? `${props.basePath.title} / ${props.path.replaceAll('/', ' / ')}`
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

  function prepareDragImage(row: ListingEntryExtended, size: number): HTMLCanvasElement {
    // const canvas = document.createElement('canvas');
    // canvas.height = 20;
    // canvas.width = 200;
    // const ctx = canvas.getContext('2d');
    //
    // if (ctx) {
    //   console.log('CTX: ', ctx);
    //   ctx.font = '12px Manrope';
    //   const text = size === 1 ? `${row.name}` : `${row.name} (+ ${size - 1})`;
    //
    //   ctx.fillText(text, 4, 4);
    // }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 50;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 4;
      ctx.moveTo(0, 0);
      ctx.lineTo(50, 50);
      ctx.moveTo(0, 50);
      ctx.lineTo(50, 0);
      ctx.stroke();
    }

    return canvas;
  }

  function onDragstart(ev: DragEvent, row: ListingEntryExtended) {
    if (ev.dataTransfer) {
      const data = size(selectedFsEntities.value) > 1
        ? JSON.stringify(selectedFsEntities.value)
        : JSON.stringify(row);
      draggedRows.value = size(selectedFsEntities.value) > 1
        ? selectedFsEntities.value.map(r => r.fullPath)
        : [row.fullPath];

      ev.dataTransfer.setData('text/plain', data);
      ev.dataTransfer.effectAllowed = 'copyMove';

      const dragEl = ev.target as HTMLElement;
      ghostEl.value = dragEl.cloneNode(true) as HTMLElement;
      ghostEl.value.classList.add($cssVars.dragging);
      document.body.appendChild(ghostEl.value);
    }
  }

  function onDragend(ev: DragEvent, row: ListingEntryExtended) {
    console.log('onDragend: ', ev, row);
    droppableRow.value = null;
    draggedRows.value = [];

    if (ghostEl.value) {
      ghostEl.value.remove();
      ghostEl.value = null;
    }
  }

  function isDroppable(evName: string, ev: DragEvent, row: ListingEntryExtended): void {
    console.log('isDroppable: ', evName, ev.dataTransfer, row.name);
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
    console.log('onDrop: ', ev.dataTransfer);
    const sourceAsString = ev.dataTransfer?.getData('text/plain');
    const source = sourceAsString ? JSON.parse(sourceAsString) : '';
    droppableRow.value = null;
    draggedRows.value = [];
    console.log('SOURCE: ', source);
    console.log('TARGET: ', row);
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
          @dragend="onDragend($event, row)"
          @dragenter="isDroppable('- dragenter -', $event, row)"
          @dragover="isDroppable('- dragover -', $event, row)"
          @dragleave="onDragleave($event, row)"
          @drop="onDrop($event, row)"
        />
      </template>

      <template #unused-place>
        <div
          v-if="!isTrashFolder && isNoDataInFolder"
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
      {{ pathInfo }}
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
    @include mixins.text-overflow-ellipsis();
  }

  .dragging {
    position: fixed;
    left: -9999px;
    border: 1px dashed;
  }
</style>
