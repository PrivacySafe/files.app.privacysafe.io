<script setup lang="ts">
  import { computed, inject } from 'vue';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { usePickerTable } from '@picker/common/composables/usePickerTable';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge.ts';
  import PickerMobileRow from './picker-mobile-row.vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  const picker = usePickerState();
  const dialogRequest = inject(DIALOG_REQUEST_KEY);
  const { prepareTableData } = usePickerTable();

  // Reusing prepareTableData purely for its sort (folders-first, by
  // sortBy/sortOrder) and row shape...the `config`/`head` fields are
  // Ui3nTable-specific and unused here.
  const rows = computed(
    () =>
      prepareTableData(
        picker.currentWindow.value.entries,
        dialogRequest?.multiSelections ?? false,
        picker.currentWindow.value.sortBy,
        picker.currentWindow.value.sortOrder,
      ).body.content,
  );
</script>

<template>
  <div :class="$style.listPanel">
    <div
      v-if="picker.currentWindow.value.status === 'loading'"
      :class="$style.statusMessage"
    >
      {{ t('file_picker.message_status.loading') }}
    </div>
    <div
      v-else-if="picker.currentWindow.value.status === 'error'"
      :class="$style.statusMessage"
    >
      {{ t('file_picker.message_status.load_error') }}
    </div>
    <div v-else>
      <picker-mobile-row
        v-for="row in rows"
        :key="row.id"
        :row="row"
        :is-selected="picker.selected.value.has(row.id)"
      />
    </div>
  </div>
</template>

<style module lang="scss">
  .listPanel {
    height: 100%;
    overflow-y: auto;
    color: var(--color-text-control-primary-default);
  }
  .statusMessage {
    color: var(--color-text-control-secondary-default, #888);
    padding: 12px 16px;
  }
</style>
