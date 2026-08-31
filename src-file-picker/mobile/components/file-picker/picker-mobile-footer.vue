<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import { Ui3nButton } from '@v1nt1248/3nclient-lib';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge';

  const emit = defineEmits<{ confirm: [] }>();

  const picker = usePickerState();
  const dialogRequest = inject(DIALOG_REQUEST_KEY);
  const isSaveMode = computed(() => dialogRequest?.mode === 'saveFile');

  const hasSelection = computed(() =>
    isSaveMode.value ? picker.saveFileName.value.trim().length > 0 : picker.selected.value.size > 0,
  );

  const confirmLabel = computed(() => (isSaveMode.value ? 'Save' : dialogRequest?.btnLabel || 'Select'));
</script>

<template>
  <div :class="$style.footerPanel">
    <ui3n-button
      :class="$style.confirmBtn"
      :disabled="!hasSelection"
      @click="emit('confirm')"
    >
      {{ confirmLabel }}
    </ui3n-button>
  </div>
</template>

<style lang="scss" module>
  .footerPanel {
    padding: 12px 16px;
    border-top: 1px solid var(--color-border-block-primary-default);
  }
  .confirmBtn {
    width: 100%;
    border-radius: 24px !important;
    height: 48px;
  }
</style>
