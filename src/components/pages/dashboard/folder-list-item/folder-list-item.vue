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
  import { computed } from 'vue';
  import { Ui3nIcon } from '@v1nt1248/3nclient-lib';
  import startsWith from 'lodash/startsWith';
  import type { RootFsFolderView } from '@/types';

  const props = defineProps<{
    folder: RootFsFolderView;
    isSelected?: boolean;
    disabled?: boolean;
  }>();
  const emits = defineEmits<{
    (event: 'select', value: RootFsFolderView): void;
  }>();

  const isItemSystemFolder = computed(() => startsWith(props.folder?.id, 'system'));
</script>

<template>
  <div
    :class="[
      $style.folderListItem,
      isItemSystemFolder && $style.systemFolderListItem,
      isSelected && $style.selected,
      (folder.disabled || disabled) && $style.disabled,
    ]"
    @click="emits('select', folder)"
  >
    <ui3n-icon
      :icon="folder.icon"
      :width="16"
      :height="16"
      :color="isSelected
        ? 'var(--color-icon-control-accent-default)'
        : 'var(--color-icon-control-secondary-default)'
      "
    />

    <span :class="$style.name">
      {{ $tr(folder.name) }}
    </span>
  </div>
</template>

<style lang="scss" module>
  .folderListItem {
    display: flex;
    width: 100%;
    height: var(--spacing-l);
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    padding: 0 var(--spacing-s);
    border-radius: var(--spacing-xs);
    cursor: pointer;
    margin-bottom: calc(var(--spacing-xs) / 2);

    &.systemFolderListItem {
      .name {
        font-size: var(--font-11);
      }
    }

    &:hover {
      color: var(--color-text-control-primary-hover);
      background-color: var(--color-bg-control-primary-hover);

      & > div {
        color: var(--color-text-control-accent-default) !important;
      }
    }
  }

  .selected {
    color: var(--color-text-control-primary-hover);
    background-color: var(--color-bg-control-primary-hover);

    & > div {
      color: var(--color-text-control-accent-default) !important;
    }
  }

  .disabled {
    pointer-events: none;
    cursor: default;

    div, span {
      opacity: 0.5;
    }
  }

  .name {
    font-size: var(--font-13);
    font-weight: 600;
    color: var(--color-text-control-primary-default);
  }
</style>
