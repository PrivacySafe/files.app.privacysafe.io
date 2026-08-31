<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import { Ui3nButton, Ui3nEditable, type Nullable } from '@v1nt1248/3nclient-lib';
  import { NOTIFICATIONS_KEY, NotificationsPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge';
  import { isValidFileName } from '@picker/common/utils/validate-filename';
  import { useI18n } from 'vue-i18n';

  const emit = defineEmits<{
    confirm: [];
    cancel: [];
  }>();
  const { t } = useI18n();
  const picker = usePickerState();
  const dialogRequest = inject(DIALOG_REQUEST_KEY);
  const notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;
  const isSaveMode = computed(() => dialogRequest?.mode === 'saveFile');

  const hasSelection = computed(() => (isSaveMode.value ? true : picker.selected.value.size > 0));
  const confirmLabel = computed(() =>
    isSaveMode.value ? t('file_picker.button.save') : dialogRequest?.btnLabel || t('file_picker.button.select'),
  );

  function updateSaveFileName(newName: Nullable<string>) {
    if (!newName) {
      return;
    }
    const trimmed = newName.trim();
    if (isValidFileName(trimmed)) {
      picker.saveFileName.value = trimmed;
      return;
    }
    notifications.$createNotice({
      type: 'error',
      withIcon: false,
      content: t('file_picker.notification.error.invalid_filename'),
      duration: 4000,
    });
  }
</script>

<template>
  <div :class="$style.footerPanel">
    <div
      v-if="!isSaveMode"
      :class="$style.selectedBox"
    >
      <span>{{ picker.selected.value.size }} {{ t('file_picker.selected_items') }}</span>
    </div>

    <div
      v-else
      :class="$style.selectedBox"
    >
      <span :class="$style.saveAsLabel">{{ t('file_picker.footer.save_as') }}</span>
      <ui3n-editable
        :model-value="picker.saveFileName.value"
        disallow-empty-value
        :class="$style.nameEditable"
        @update:model-value="updateSaveFileName"
      />
    </div>

    <div :class="$style.actionBox">
      <ui3n-button
        type="custom"
        color="var(--color-bg-button-tritery-default)"
        @click="emit('cancel')"
      >
        {{ t('file_picker.button.cancel') }}
      </ui3n-button>
      <ui3n-button
        :disabled="!hasSelection"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </ui3n-button>
    </div>
  </div>
</template>

<style lang="scss" module>
  .footerPanel {
    display: flex;
    padding: 0 16px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    align-content: center;
    height: 64px;
  }
  .selectedBox {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;

    span {
      font-size: var(--font-12);
      color: var(--color-text-control-primary-default);
    }
  }
  .saveAsLabel {
    flex-shrink: 0;
  }
  .nameEditable {
    min-width: 0;
  }
  .actionBox {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }
</style>
