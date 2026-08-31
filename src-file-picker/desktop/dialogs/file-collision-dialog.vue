<script setup lang="ts">
  import { ref } from 'vue';
  import {
    Ui3nDialog,
    Ui3nButton,
    Ui3nInput,
    type Ui3nDialogComponentProps,
    type Ui3nDialogEvent,
  } from '@v1nt1248/3nclient-lib';
  import { useI18n } from 'vue-i18n';

  import { isValidFileName } from '@picker/common/utils/validate-filename';

  const props = defineProps<{
    dialogProps?: Ui3nDialogComponentProps<boolean>;
    data: string;
  }>();

  const emits = defineEmits<{
    (event: 'action', value: { event: Ui3nDialogEvent; data?: unknown }): void;
  }>();

  const mode = ref<'confirm' | 'rename'>('confirm');
  const newName = ref(props.data);
  const { t } = useI18n();

  function handleOverwrite() {
    emits('action', { event: 'confirm' });
  }

  function toggleRenameInput() {
    if (mode.value === 'confirm') {
      mode.value = 'rename';
    } else {
      mode.value = 'confirm';
    }
  }

  function handleChange() {
    const trimmed = newName.value.trim();
    if (!trimmed || trimmed === props.data || !isValidFileName(trimmed)) {
      return;
    }
    emits('action', { event: 'confirm', data: trimmed });
  }

  function handleCancel() {
    emits('action', { event: 'cancel' });
  }
</script>

<template>
  <ui3n-dialog
    v-bind="dialogProps"
    @action="emits('action', $event)"
  >
    <template #body>
      <div :class="$style.modalBody">
        <span>"{{ props.data }}" {{ t('dialog.file_exist.warning') }}</span>
      </div>
    </template>
    <template #actions>
      <div
        v-if="mode === 'confirm'"
        :class="$style.actionRow"
      >
        <ui3n-button
          type="custom"
          color="var(--color-bg-button-tritery-default)"
          @click="handleCancel"
        >
          {{ t('dialog.file_exist.button.cancel') }}
        </ui3n-button>
        <ui3n-button
          type="custom"
          color="var(--color-bg-button-tritery-default)"
          @click="toggleRenameInput"
        >
          {{ t('dialog.file_exist.button.rename') }}
        </ui3n-button>
        <ui3n-button @click="handleOverwrite">
          {{ t('dialog.file_exist.button.overwrite') }}
        </ui3n-button>
      </div>

      <div
        v-else
        :class="$style.renameRow"
      >
        <ui3n-input
          v-model="newName"
          :placeholder="t('dialog.file_exist.placeholder.new_name')"
          clearable
          :class="$style.nameInput"
          @enter="handleChange"
        />
        <ui3n-button
          type="custom"
          color="var(--color-bg-button-tritery-default)"
          @click="toggleRenameInput"
        >
          {{ t('dialog.file_exist.button.cancel') }}
        </ui3n-button>
        <ui3n-button
          :disabled="!newName.trim() || newName.trim() === props.data || !isValidFileName(newName.trim())"
          @click="handleChange"
        >
          {{ t('dialog.file_exist.button.change') }}
        </ui3n-button>
      </div>
    </template>
  </ui3n-dialog>
</template>

<style lang="scss" module>
  .modalBody {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    padding: 17px;
    color: var(--color-text-control-primary-default);
  }

  .actionRow,
  .renameRow {
    display: flex;
    gap: var(--spacing-s);
    justify-content: flex-end;
    padding: 14px;
  }

  .nameInput {
    flex: 1;
  }
</style>
