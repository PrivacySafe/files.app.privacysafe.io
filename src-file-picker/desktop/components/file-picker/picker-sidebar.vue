<script lang="ts" setup>
  import { computed } from 'vue';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { Ui3nIcon } from '@v1nt1248/3nclient-lib';
  import type { RootFsFolderView } from '@shared/types';
  import { useI18n } from 'vue-i18n';

  const picker = usePickerState();
  const { t } = useI18n();

  const props = defineProps<{
    folders: RootFsFolderView[];
  }>();

  // TODO:
  // Band aid...refactor this soon
  const folder = computed(() => {
    const first = props.folders[0];
    return first ? { name: first.name, icon: first.icon } : null;
  });
</script>

<template>
  <nav :class="$style.sidebar">
    <div :class="$style.sectionTitle">
      {{ t('file_picker.sidebar_title') }}
    </div>

    <div
      v-if="folder"
      :class="[$style.navItem, { [$style.active]: picker.activeTab.value === 'filesystem' }]"
      @click="picker.switchTab('filesystem')"
    >
      <ui3n-icon
        :icon="folder.icon"
        width="22"
        height="22"
        color="var(--color-icon-control-secondary-default)"
      />
      <span>{{ folder.name }}</span>
    </div>

    <div
      :class="[$style.navItem, { [$style.active]: picker.activeTab.value === '3n-storage' }]"
      @click="picker.switchTab('3n-storage')"
    >
      <ui3n-icon
        icon="outline-cloud"
        width="22"
        height="22"
        color="var(--color-icon-control-secondary-default)"
      />
      <span>{{ t('file_picker.tab_3n_storage') }}</span>
    </div>
  </nav>
</template>

<style lang="scss" module>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 7px;
  }

  .sectionTitle {
    margin-bottom: 12px;
    padding: 0 8px;
    font-size: var(--font-14);
    font-weight: 600;
    color: var(--color-text-control-secondary-default);
  }

  .navItem {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--font-13);
    padding: 10px 12px;
    border-radius: 5px;

    cursor: pointer;
    user-select: none;

    color: var(--color-text-control-primary-default);

    transition:
      background-color 0.15s,
      color 0.15s;

    &:hover {
      background-color: color-mix(in srgb, var(--color-bg-control-primary-hover) 30%, transparent);
    }

    &.active {
      background-color: var(--color-bg-control-primary-hover);
    }
  }
</style>
