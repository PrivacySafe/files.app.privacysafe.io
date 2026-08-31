<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import { Ui3nIcon } from '@v1nt1248/3nclient-lib';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge';
  import { formatFileSize } from '@v1nt1248/3nclient-lib/utils';
  import type { PickerTableRow } from '@picker/common/types';

  const props = defineProps<{
    row: PickerTableRow;
    isSelected: boolean;
  }>();

  const picker = usePickerState();
  const dialogRequest = inject(DIALOG_REQUEST_KEY);

  const sizeLabel = computed(() => (props.row.isFolder ? '' : formatFileSize(props.row.size)));

  function handleTap() {
    if (props.row.isFolder) {
      // Single tap navigates...dblclick is disabled on mobile.
      picker.navigateToFolder(props.row.id);
      return;
    }

    if (dialogRequest?.mode === 'saveFile') {
      // Same rule as desktop: tapping a file in save mode fills the
      // filename field rather than adding to "selected".
      picker.saveFileName.value = props.row.name;
      picker.setSelectedIds([props.row.id]);
      return;
    }

    picker.toggleSelect(props.row.id);
  }
</script>

<template>
  <div
    :class="[$style.row, isSelected && $style.selected]"
    @click="handleTap"
  >
    <ui3n-icon
      :icon="row.isFolder ? 'round-folder' : 'round-subject'"
      :size="20"
      color="var(--color-icon-table-secondary-default)"
    />

    <div :class="$style.main">
      <span :class="$style.name">{{ row.name }}</span>
      <span
        v-if="sizeLabel"
        :class="$style.size"
      >
        {{ sizeLabel }}
      </span>
    </div>

    <span :class="$style.date">{{ row.displayingDate }}</span>
  </div>
</template>

<style lang="scss" module>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border-block-primary-default);

    &.selected {
      background-color: var(--color-bg-control-primary-hover);
    }
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name {
    font-size: var(--font-13);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .size {
    font-size: var(--font-11);
    color: var(--color-text-control-secondary-default);
  }
  .date {
    flex-shrink: 0;
    font-size: var(--font-11);
    color: var(--color-text-control-secondary-default);
  }
</style>
