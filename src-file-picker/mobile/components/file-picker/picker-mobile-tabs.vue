<script lang="ts" setup>
  import { computed } from 'vue';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import type { RootFsFolderView } from '@shared/types';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const props = defineProps<{
    folders: RootFsFolderView[];
  }>();

  const picker = usePickerState();

  // Same band-aid as desktop's picker-sidebar.vue folder computed
  // worth refactoring both together later.
  const deviceFolder = computed(() => ({
    name: props.folders[0]?.name ?? 'File System',
  }));
</script>

<template>
  <nav :class="$style.tabs">
    <button
      :class="[$style.tab, { [$style.active]: picker.activeTab.value === '3n-storage' }]"
      @click="picker.switchTab('3n-storage')"
    >
      {{ t('file_picker.tab_3n_storage') }}
    </button>
    <button
      :class="[$style.tab, { [$style.active]: picker.activeTab.value === 'filesystem' }]"
      @click="picker.switchTab('filesystem')"
    >
      {{ deviceFolder.name }}
    </button>
  </nav>
</template>

<style lang="scss" module>
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }
  .tab {
    flex: 1;
    padding: 10px 0;
    background: none;
    border: none;
    font-size: var(--font-14);
    color: var(--color-text-control-secondary-default);
    cursor: pointer;

    &.active {
      color: var(--color-text-block-accent-default);
      font-weight: 600;
      border-bottom: 2px solid var(--color-text-block-accent-default);
    }
  }
</style>
