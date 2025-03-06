<script lang="ts" setup>
  import { computed } from 'vue';
  import isEmpty from 'lodash/isEmpty';
  import { Ui3nButton, Ui3nTitle } from '@v1nt1248/3nclient-lib';
  import type { FsTableBulkActionsProps, FsTableBulkActionsEmits, FsTableBulkActionName } from './types';

  const vUi3nTitle = Ui3nTitle;

  const props = withDefaults(defineProps<FsTableBulkActionsProps>(), {
    config: () => ({}),
    selectedRows: () => [],
  });
  const emits = defineEmits<FsTableBulkActionsEmits>();

  const isAvailableMarkAsFavorite = computed(() => !props.selectedRows.some((entity) => entity.type !== 'folder'));
  const isSelectedEmpty = computed(() => isEmpty(props.selectedRows));

  function isActionAvailable(actionName: FsTableBulkActionName): boolean {
    return !!props.config[actionName];
  }
</script>

<template>
  <div :class="$style.fsHomeTableBulkActions">
    <ui3n-button
      v-if="isActionAvailable('set:favorite')"
      v-ui3n-title="{
        text: config['set:favorite']?.tooltip ?? '',
        disabled: !config['set:favorite']?.tooltip,
        placement: 'top-start',
      }"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      :icon="config['set:favorite']!.icon"
      :icon-color="config['set:favorite']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
      :disabled="disabled || !isAvailableMarkAsFavorite || isSelectedEmpty"
      @click.stop.prevent="emits('action', { action: 'set:favorite' })"
    />

    <ui3n-button
      v-if="isActionAvailable('download')"
      v-ui3n-title="{
        text: config['download']?.tooltip ?? '',
        disabled: !config['download']?.tooltip,
        placement: 'top-start',
      }"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      :icon="config['download']!.icon"
      :icon-color="config['download']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
      :disabled="disabled || isSelectedEmpty"
      @click.stop.prevent="emits('action', { action: 'download' })"
    />

    <ui3n-button
      v-if="isActionAvailable('restore')"
      v-ui3n-title="{
        text: config['restore']?.tooltip ?? '',
        disabled: !config['restore']?.tooltip,
        placement: 'top-start',
      }"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      :icon="config['restore']!.icon"
      :icon-color="config['restore']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
      :disabled="disabled || isSelectedEmpty"
      @click.stop.prevent="emits('action', { action: 'restore' })"
    />

    <ui3n-button
      v-if="isActionAvailable('delete')"
      v-ui3n-title="{
        text: config['delete']?.tooltip ?? '',
        disabled: !config['delete']?.tooltip,
        placement: 'top-start',
      }"
      type="icon"
      color="var(--color-bg-block-primary-default)"
      :icon="config['delete']!.icon"
      :icon-color="config['delete']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
      :disabled="disabled || isSelectedEmpty"
      @click.stop.prevent="emits('action', { action: 'delete' })"
    />
  </div>
</template>

<style lang="scss" module>
  .fsHomeTableBulkActions {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
  }
</style>
