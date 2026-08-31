<script setup lang="ts">
  import { computed, inject } from 'vue';
  import { Ui3nTable, Ui3nProgressCircular } from '@v1nt1248/3nclient-lib';
  import type { Ui3nTableSort } from '@v1nt1248/3nclient-lib';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { usePickerTable } from '@picker/common/composables/usePickerTable';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge.ts';
  import PickerTableRow from './picker-table-row.vue';
  import type { PickerTableRow as RowType } from '@picker/common/types';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  const picker = usePickerState();

  const dialogRequest = inject(DIALOG_REQUEST_KEY);
  const { prepareTableData } = usePickerTable();

  const commonLoading = computed(() => picker.currentWindow.value.status === 'loading');

  const tableData = computed(() =>
    prepareTableData(
      picker.currentWindow.value.entries,
      dialogRequest?.multiSelections ?? false,
      picker.currentWindow.value.sortBy,
      picker.currentWindow.value.sortOrder,
    ),
  );

  function handleSelectRow(rows: RowType[]) {
    if (dialogRequest?.mode === 'saveFile') {
      // Only files populate the save-name field; a folder appearing in the
      // selection (user clicked it, will likely dblclick to navigate) shouldn't
      // overwrite whatever filename is already typed/selected.
      const fileRow = rows.find(r => !r.isFolder);
      if (fileRow) picker.saveFileName.value = fileRow.name;
      return;
    }
    picker.setSelectedIds(rows.map(r => r.id));
  }

  function handleNavigate(id: string) {
    picker.navigateToFolder(id);
  }
  function handleSortChange(sort: Ui3nTableSort<RowType>) {
    picker.setSort(sort.field as string, sort.direction);
  }
</script>

<template>
  <div :class="$style.fileListPanel">
    <div
      v-if="picker.currentWindow.value.status === 'error'"
      :class="$style.statusMessage"
    >
      {{ t('file_picker.message_status.load_error') }}
      <!-- {{ t('file_picker.message_status.loading') }} -->
    </div>

    <div
      v-else
      :class="$style.tableWrapper"
    >
      <ui3n-table
        :config="tableData.config"
        :head="tableData.head"
        :body="tableData.body"
        @select:row="handleSelectRow"
        @change:sort="handleSortChange"
      >
        <template #row="{ row, rowIndex, isRowSelected, columnStyle, events }">
          <picker-table-row
            :row="row"
            :row-index="rowIndex"
            :is-row-selected="isRowSelected"
            :column-style="columnStyle"
            :events="events"
            :class="$style.parentRow"
            @navigate="handleNavigate"
          />
        </template>
      </ui3n-table>

      <div
        v-if="commonLoading"
        :class="$style.loader"
      >
        <ui3n-progress-circular
          indeterminate
          size="100"
        />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
  .fileListPanel {
    color: var(--color-text-control-primary-default);
    height: 100%;
    overflow-y: auto;
  }
  .statusMessage {
    color: var(--color-text-control-secondary-default, #888);
    padding: 12px 0;
  }
  .tableWrapper {
    position: relative;
    height: 100%;
  }
  .loader {
    position: absolute;
    inset: 0;
    z-index: 10;
    background-color: var(--black-12);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }
  .parentRow {
    display: flex;
    align-items: center;
    min-height: 28px;
    padding: 3px 0px 3px 15px;
  }
</style>
