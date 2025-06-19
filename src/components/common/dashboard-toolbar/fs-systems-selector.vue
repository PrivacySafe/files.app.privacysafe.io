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
  import { computed, ref } from 'vue';
  import { Ui3nButton, Ui3nMenu } from '@v1nt1248/3nclient-lib';
  import type { FsListItem } from '@/types';

  const props = defineProps<{
    modelValue: string;
    fileSystems: FsListItem[];
  }>();

  const emits = defineEmits<{
    (event: 'update:modelValue', value: string): void;
  }>();

  const isMenuOpen = ref(false);

  const selectedFileSystems = computed(() => props.fileSystems.find(fs => fs.fsId === props.modelValue));

  function selectItem(item: FsListItem) {
    if (item.fsId !== props.modelValue) {
      emits('update:modelValue', item.fsId);
    }
  }
</script>

<template>
  <ui3n-menu
    v-model="isMenuOpen"
    :offset-x="-4"
    :offset-y="4"
  >
    <ui3n-button
      type="custom"
      color="var(--color-bg-control-secondary-default)"
      text-color="var(--color-text-control-primary-default)"
      :icon="isMenuOpen ? 'round-keyboard-arrow-up': 'round-keyboard-arrow-down'"
      icon-color="var(--color-icon-button-tritery-default)"
      icon-position="right"
      :class="$style.fsSystemsSelector"
    >
      {{ selectedFileSystems?.name.trim() }}
    </ui3n-button>

    <template #menu>
      <div
        v-for="item in fileSystems"
        :key="item.fsId"
        :class="[$style.item, item.fsId === modelValue && $style.selected]"
        @click="selectItem(item)"
      >
        {{ item.name }}
      </div>
    </template>
  </ui3n-menu>
</template>

<style lang="scss" module>
  .fsSystemsSelector {
    --selector-width: 210px;

    position: relative;
    justify-content: space-between !important;
    width: var(--selector-width) !important;
    padding-left: var(--spacing-s) !important;
    font-size: var(--font-11) !important;
  }

  .item {
    display: flex;
    height: var(--spacing-l);
    width: 210px;
    justify-content: flex-start;
    align-items: center;
    padding: 0 var(--spacing-s);
    font-size: var(--font-13);

    &:hover {
      background-color: var(--color-bg-control-primary-hover);
      color: var(--color-text-control-accent-default);
      cursor: pointer;
    }
  }

  .selected {
    color: var(--color-text-control-accent-default);
  }
</style>
