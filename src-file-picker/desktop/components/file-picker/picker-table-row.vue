<script lang="ts" setup>
  import { Ui3nIcon } from '@v1nt1248/3nclient-lib';
  import { formatFileSize } from '@v1nt1248/3nclient-lib/utils';
  import FileType from './file-type/file-type.vue';

  import type { PickerTableRow } from '@picker/common/types';

  const props = defineProps<{
    row: PickerTableRow;
    isRowSelected?: boolean;
    columnStyle?: Record<string, Record<string, string>>;
    events?: { select: (row: PickerTableRow, withoutEvents?: boolean) => void };
  }>();

  const emit = defineEmits<{ navigate: [id: string] }>();

  const getFieldStyle = (key: string) => props.columnStyle?.[key] ?? {};

  function handleClick() {
    props.events?.select(props.row);
  }

  function handleDblClick() {
    if (props.row.isFolder) {
      emit('navigate', props.row.id);
    }
  }
</script>

<template>
  <div
    :class="[$style.row, isRowSelected && $style.selected]"
    @click="handleClick"
    @dblclick="handleDblClick"
  >
    <div
      :class="$style.name"
      :style="getFieldStyle('name')"
    >
      <ui3n-icon
        :icon="row.isFolder ? 'round-folder' : 'round-subject'"
        :size="20"
        color="var(--color-icon-table-secondary-default)"
      />
      <span :title="row.name">{{ row.name }}</span>
    </div>

    <div
      :class="$style.type"
      :style="getFieldStyle('type')"
    >
      <file-type
        v-if="row.type"
        :file-type="row.type"
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
      :style="getFieldStyle('displayingDate')"
    >
      {{ row.displayingDate }}
    </div>
  </div>
</template>

<style lang="scss" module>
  .row {
    display: contents;
    cursor: pointer;
    font-size: 12px;
  }

  .name,
  .type,
  .size,
  .date {
    min-width: 0;
    overflow: hidden;
  }

  .name {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .type,
  .size,
  .date {
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--ui3n-table-cell-font-size, 12px);
    color: var(--ui3n-table-row-color);
  }

  .selected .name,
  .selected .type,
  .selected .size,
  .selected .date {
    background-color: var(--color-bg-control-primary-hover);
  }
</style>
