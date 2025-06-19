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
  import { useDblClickHandler } from '@/composables/useDblClickHandler';
  import { useAbilities } from '@/composables/useAbilities';
  import type { ListingEntryExtended } from '@/types';
  import { FsTableRowProps, FsTableRowEmits } from './types';
  import FileType from '@/components/common/file-type/file-type.vue';

  const props = defineProps<FsTableRowProps<keyof ListingEntryExtended>>();
  const emits = defineEmits<FsTableRowEmits>();

  const { handleDblClick } = useDblClickHandler(onClick, onDblClick);

  const editNameMode = ref<boolean>(false);

  const currentTableWindow = computed(() => `${props.window}` as '1' | '2');

  const fileExtension = computed(() => {
    if (props.row.type !== 'file') {
      return '';
    }

    return getFileExtension(props.row.name).toLowerCase();
  });

  const { canRename, canSetUnsetFavorite, canCopyMove } = useAbilities(currentTableWindow);

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
    if (props.row?.type !== 'folder') {
      return;
    }

    emits('action', { event: 'update:favorite', payload: { row: props.row } });
  }
</script>

<template>
  <div
    :class="[
      $style.fsTableRow,
      (disabled || readonly) && $style.fsTableRowDisabled,
      isDroppable && $style.droppable
    ]"
    :draggable="isRowSelected && !editNameMode && canCopyMove"
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

        <template v-else>
          <template v-if="isDroppable">
            <ui3n-icon
              icon="round-system-update-alt"
              :rotate="-90"
              color="var(--color-icon-control-accent-default)"
            />
          </template>

          <template v-else>
            <ui3n-icon
              :class="$style.iconCheck"
              icon="round-check-box-outline-blank"
              :width="20"
              :height="20"
              color="var(--color-icon-control-accent-default)"
            />

            <ui3n-icon
              :class="$style.iconType"
              :icon="row.type === 'folder' ? 'round-folder' : 'round-subject'"
              color="var(--color-icon-table-secondary-default)"
            />
          </template>
        </template>
      </div>

      <ui3n-editable
        :model-value="row.name"
        disallow-empty-value
        :disabled="!canRename || disabled || readonly"
        @toggle:edit-mode="editNameMode = $event"
        @update:model-value="updateName"
      />
    </div>

    <div
      :class="$style.type"
      :style="getFieldStyle('type')"
    >
      <file-type
        v-if="row.type === 'file'"
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
      v-if="row.type === 'folder' && !disabled && canSetUnsetFavorite"
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
    --fs-table-row-height: 28px;

    position: relative;
    width: 100%;
    height: var(--fs-table-row-height);
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

      .iconCheck {
        display: block !important;
      }

      .iconType {
        display: none !important;
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

  .fsTableRowDisabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: default;
  }

  .droppable {
    position: relative;
    background-color: var(--color-bg-control-primary-hover);
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

  .iconCheck {
    position: relative;
    left: -2px;
    top: -2px;
    display: none !important;
  }

  .iconType {
    position: relative;
  }

  .type {
    display: flex;
    padding: 0 var(--spacing-xs);
    justify-content: flex-start;
    align-items: center;
  }
</style>

