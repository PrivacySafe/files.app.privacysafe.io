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
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import get from 'lodash/get';
  import { type Nullable, Ui3nCheckbox, Ui3nEditable, Ui3nIcon } from '@v1nt1248/3nclient-lib';
  import { getFileExtension, formatFileSize } from '@v1nt1248/3nclient-lib/utils';
  import { useDblClickHandler } from '@/components/composables/useDblClickHandler';
  import type { ListingEntryExtended } from '@/types';
  import { FsTableRowProps, FsTableRowEmits } from './types';
  import FileType from '@/components/common/file-type/file-type.vue';

  const props = defineProps<FsTableRowProps<keyof ListingEntryExtended>>();
  const emits = defineEmits<FsTableRowEmits>();

  const { handleDblClick } = useDblClickHandler(onClick, onDblClick);

  const editNameMode = ref<boolean>(false);

  const fileExtension = computed(() => {
    if (props.row.type !== 'file') {
      return '';
    }

    return getFileExtension(props.row.name).toLowerCase();
  });

  function onDblClick() {
    if (props.row.type === 'folder') {
      emits('action', { event: 'go', payload: props.row.fullPath });
    }
  }

  function onClick(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    emits('action', { event: 'open:info', payload: { row: props.row } });
  }

  function selectRow() {
    props.events?.select(props.row)
  }

  function getFieldStyle(field: keyof ListingEntryExtended): Record<string, string> {
    const style = get(props.columnStyle, [field], { width: 'auto' });
    return { width: style.width, minWidth: style.width };
  }

  function updateName(name: Nullable<string>): void {
    emits('action', { event: 'rename', payload: { row: props.row, newName: name } });
  }

  function updateFavorite() {
    console.log('updateFavorite: ', props.row);
    if (props.row?.type !== 'folder') {
      return;
    }

    emits('action', { event: 'update:favorite', payload: { row: props.row } });
  }
  //
  // function onDragstart(ev: DragEvent, row: ListingEntryExtended) {
  //   if (ev.dataTransfer) {
  //     ev.dataTransfer.setData('text/plain', JSON.stringify(row));
  //     ev.dataTransfer.effectAllowed = 'copyMove';
  //   }
  // }
  //
  // function isDroppable(ev: DragEvent, row: ListingEntryExtended): void {
  //   console.log('isDroppable: ', ev.dataTransfer?.types, row);
  //   if (row.type === 'folder') {
  //     console.log('----- YES -----');
  //     ev.preventDefault();
  //   }
  // }
  //
  // function onDrop(ev: DragEvent, row: ListingEntryExtended): void {
  //   console.log('onDrop: ', ev.dataTransfer);
  //   const sourceAsString = ev.dataTransfer?.getData('text/plain');
  //   const source = sourceAsString ? JSON.parse(sourceAsString) : '';
  //   console.log('SOURCE: ', source);
  //   console.log('TARGET: ', row);
  //   ev.preventDefault();
  // }
</script>

<template>
  <!--  @dragstart="onDragstart($event, row)"-->
  <!--  @dragenter="isDroppable($event, row)"-->
  <!--  @dragover="isDroppable($event, row)"-->
  <!--  @drop="onDrop($event, row)"-->
  <div
    :class="[
      $style.fsTableRow,
      (disabled || readonly) && $style.fsTableRowDisabled,
      isDroppable && $style.droppable
    ]"
    :draggable="!editNameMode"
    @click="handleDblClick"
  >
    <div
      :class="$style.name"
      :style="getFieldStyle('name')"
    >
      <div
        :class="$style.icon"
        @click.stop.prevent="selectRow"
      >
        <ui3n-checkbox
          v-if="isRowSelected"
          :model-value="true"
        />

        <ui3n-icon
          v-else
          :icon="row.type === 'folder' ? 'round-folder' : 'round-subject'"
          color="var(--color-icon-table-secondary-default)"
        />
      </div>

      <ui3n-editable
        :model-value="row.name"
        disallow-empty-value
        :disabled="disabled || readonly"
        @toggle:edit-mode="editNameMode = $event"
        @update:model-value="updateName"
      />
    </div>

    <div
      :class="$style.type"
      :style="getFieldStyle('type')"
    >
      <file-type
        v-if="row.type !== 'folder'"
        :file-type="fileExtension"
      />

      <span v-else />
    </div>

    <div
      :class="$style.size"
      :style="getFieldStyle('size')"
    >
      {{ row.size ? formatFileSize(row.size) : '' }}
    </div>

    <div
      :class="$style.date"
      :style="getFieldStyle('displayingCTime')"
    >
      {{ row.displayingCTime }}
    </div>

    <ui3n-icon
      v-if="row.type === 'folder' && !disabled"
      icon="round-bookmark"
      width="12"
      height="12"
      :color="row.favoriteId ? 'var(--color-icon-table-accent-selected)' : 'var(--color-icon-table-accent-unselected)'"
      :class="[$style.favoriteIcon, row.favoriteId && $style.favoriteIconSelected]"
      @click.stop="updateFavorite"
    />
  </div>
</template>

<style lang="scss" module>
  .fsTableRow {
    --fsTableRow-height: 28px;

    position: relative;
    width: 100%;
    height: var(--fsTableRow-height);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-left: var(--spacing-m);
    font-size: var(--font-12);
    font-weight: 400;
    color: var(--color-text-table-primary-default);

    &:not(.fsTableRowDisabled):hover {
      .favoriteIcon {
        opacity: 1;
        cursor: pointer;
      }
    }

    &:hover {
      .name {
        & > div {
          color: var(--color-icon-table-accent-hover) !important;
        }
      }
    }
  }

  .droppable {
    position: relative;
    background-color: lightgreen;
  }

  .favoriteIcon {
    position: absolute;
    left: 2px;
    top: var(--spacing-s);
    z-index: 2;

    &:not(.favoriteIconSelected) {
      opacity: 0;
    }

    &.favoriteIconSelected {
      opacity: 1;
    }
  }

  .name {
    position: relative;
    flex-grow: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    user-select: none;
  }

  .icon {
    position: relative;
    min-width: var(--spacing-m);
    width: var(--spacing-m);
    height: var(--spacing-m);
  }

  .type {
    display: flex;
    padding: 0 var(--spacing-xs);
    justify-content: flex-start;
    align-items: center;
  }
</style>

