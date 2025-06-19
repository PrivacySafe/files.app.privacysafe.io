<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import isEmpty from 'lodash/isEmpty';
  import { I18N_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nSwitch, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useAbilities } from '@/composables/useAbilities';
  import { FS_TABLE_BULK_ACTIONS } from '@/constants';
  import { FsTableBulkActionsProps, FsTableBulkActionsEmits } from './types';

  const props = withDefaults(defineProps<FsTableBulkActionsProps>(), {
    window: 1,
    selectedRows: () => [],
  });
  const emits = defineEmits<FsTableBulkActionsEmits>();

  const { $tr } = inject(I18N_KEY)!;

  const isSelectedEmpty = computed(() => isEmpty(props.selectedRows));
  const currentTableWindow = computed(() => `${props.window}` as '1' | '2');

  const { canRestore, canDelete, canDeleteCompletely, canCopyMove } = useAbilities(currentTableWindow);
</script>

<template>
  <div :class="$style.fsHomeTableBulkActions">
    <div :class="$style.actionsBlock">
      <!--
      <ui3n-tooltip
        v-if="canSetUnsetFavorite"
        :content="FS_TABLE_BULK_ACTIONS['set:favorite']?.tooltip || ''"
        :disabled="!FS_TABLE_BULK_ACTIONS['set:favorite']?.tooltip"
        position-strategy="fixed"
        placement="top-start"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="FS_TABLE_BULK_ACTIONS['set:favorite']?.icon"
          :icon-color="FS_TABLE_BULK_ACTIONS['set:favorite']?.iconColor ?? 'var(--color-icon-table-primary-default)'"
          :disabled="disabled || isSelectedEmpty"
          @click.stop.prevent="emits('action', { action: 'set:favorite' })"
        />
      </ui3n-tooltip>
      -->

      <ui3n-tooltip
        :content="FS_TABLE_BULK_ACTIONS['download']?.tooltip || ''"
        :disabled="!FS_TABLE_BULK_ACTIONS['download']?.tooltip"
        position-strategy="fixed"
        placement="top-start"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="FS_TABLE_BULK_ACTIONS['download']!.icon"
          :icon-color="FS_TABLE_BULK_ACTIONS['download']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
          :disabled="disabled || isSelectedEmpty"
          @click.stop.prevent="emits('action', { action: 'download' })"
        />
      </ui3n-tooltip>

      <ui3n-tooltip
        v-if="canRestore"
        :content="FS_TABLE_BULK_ACTIONS['restore']?.tooltip || ''"
        :disabled="!FS_TABLE_BULK_ACTIONS['restore']?.tooltip"
        position-strategy="fixed"
        placement="top-start"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="FS_TABLE_BULK_ACTIONS['restore']!.icon"
          :icon-color="FS_TABLE_BULK_ACTIONS['restore']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
          :disabled="disabled || isSelectedEmpty"
          @click.stop.prevent="emits('action', { action: 'restore' })"
        />
      </ui3n-tooltip>

      <ui3n-tooltip
        v-if="canDelete"
        :content="FS_TABLE_BULK_ACTIONS['delete']?.tooltip || ''"
        :disabled="!FS_TABLE_BULK_ACTIONS['delete']?.tooltip"
        position-strategy="fixed"
        placement="top-start"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="FS_TABLE_BULK_ACTIONS['delete']!.icon"
          :icon-color="FS_TABLE_BULK_ACTIONS['delete']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
          :disabled="disabled || isSelectedEmpty"
          @click.stop.prevent="emits('action', { action: 'delete' })"
        />
      </ui3n-tooltip>

      <ui3n-tooltip
        v-if="canDeleteCompletely"
        :content="FS_TABLE_BULK_ACTIONS['delete:completely']?.tooltip || ''"
        :disabled="!FS_TABLE_BULK_ACTIONS['delete:completely']?.tooltip"
        position-strategy="fixed"
        placement="top-start"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="FS_TABLE_BULK_ACTIONS['delete:completely']!.icon"
          :icon-color="FS_TABLE_BULK_ACTIONS['delete:completely']!.iconColor ?? 'var(--color-icon-table-primary-default)'"
          :disabled="disabled || isSelectedEmpty"
          @click.stop.prevent="emits('action', { action: 'delete:completely' })"
        />
      </ui3n-tooltip>
    </div>

    <div
      v-if="canCopyMove"
      :class="$style.actionsBlock"
    >
      <span>{{ $tr('fs.entity.copy') }}</span>

      <ui3n-tooltip
        :content="FS_TABLE_BULK_ACTIONS['copy/move']?.tooltip || ''"
        :disabled="!FS_TABLE_BULK_ACTIONS['copy/move']?.tooltip"
        position-strategy="fixed"
        placement="top-end"
      >
        <ui3n-switch
          :model-value="!!isMoveMode"
          :class="$style.copyMoveSwitcher"
          @update:model-value="emits('update:move-mode', $event)"
        />
      </ui3n-tooltip>

      <span>{{ $tr('fs.entity.move') }}</span>
    </div>
  </div>
</template>

<style lang="scss" module>
  .fsHomeTableBulkActions {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: space-between;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .actionsBlock {
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);
    font-size: var(--font-12);
    color: var(--color-text-control-primary-default);
  }

  .copyMoveSwitcher {
    --ui3n-switch-off-color: var(--success-content-default) !important;
  }
</style>
