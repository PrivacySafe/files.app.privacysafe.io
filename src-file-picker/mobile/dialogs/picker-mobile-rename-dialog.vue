<script setup lang="ts">
  import { ref, computed } from 'vue';
  import {
    Ui3nDialog,
    Ui3nIcon,
    Ui3nInput,
    type Ui3nDialogComponentProps,
    type Ui3nDialogEvent,
  } from '@v1nt1248/3nclient-lib';
  import { isValidFileName } from '@picker/common/utils/validate-filename';
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n();

  const props = defineProps<{
    dialogProps?: Ui3nDialogComponentProps<boolean>;
    data: string;
  }>();

  const emits = defineEmits<{
    (event: 'action', value: { event: Ui3nDialogEvent; data?: unknown }): void;
  }>();

  const newName = ref(props.data);

  const hasChanged = computed(() => {
    const trimmed = newName.value.trim();
    return trimmed.length > 0 && trimmed !== props.data && isValidFileName(trimmed);
  });

  function handleConfirm() {
    if (!hasChanged.value) return;
    emits('action', { event: 'confirm', data: newName.value.trim() });
  }

  function handleClose() {
    emits('action', { event: 'cancel' });
  }
</script>

<template>
  <ui3n-dialog
    v-bind="dialogProps"
    @action="emits('action', $event)"
  >
    <template #body>
      <div :class="$style.body">
        <ui3n-input
          v-model="newName"
          :placeholder="t('dialog.file_exist.placeholder.new_name')"
          clearable
          :class="$style.nameInput"
          @enter="handleConfirm"
        />
      </div>
      <div :class="$style.actionRow">
        <ui3n-icon
          icon="round-close"
          :size="25"
          color="var(--error-content-default)"
          :class="$style.actionIcon"
          @click="handleClose"
        />
        <ui3n-icon
          icon="round-check"
          :size="25"
          :color="hasChanged ? 'var(--success-content-default)' : 'var(--color-icon-control-secondary-default)'"
          :class="[$style.actionIcon, { [$style.disabled]: !hasChanged }]"
          @click="handleConfirm"
        />
      </div>
    </template>
  </ui3n-dialog>
</template>

<style lang="scss" module>
  .body {
    padding: 7px 17px;
  }
  .nameInput {
    width: 100%;
    padding-bottom: 0px;
  }
  .actionRow {
    display: flex;
    gap: var(--spacing-m);
    justify-content: flex-end;
    padding: 14px;
  }
  .actionIcon {
    cursor: pointer;
  }
  .disabled {
    cursor: not-allowed;
    pointer-events: none;
    opacity: 0.5;
  }
</style>
