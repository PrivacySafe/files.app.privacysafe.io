<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { usePickerState } from '@picker/common/composables/usePickerState';
  import { Ui3nButton, Ui3nBreadcrumb, Ui3nBreadcrumbs } from '@v1nt1248/3nclient-lib';

  const picker = usePickerState();
  const isTileView = ref(true);
  const segments = computed(() => picker.currentWindow.value.currentPath.split('/').filter(Boolean));

  function goToSegment(index: number) {
    const newPath = segments.value.slice(0, index + 1).join('/');
    picker.navigateToFolder(newPath);
  }

  function goBack() {
    const parts = segments.value.slice(0, -1);
    picker.navigateToFolder(parts.join('/'));
  }

  function handleClick(index: number) {
    goToSegment(index);
  }
</script>

<template>
  <div :class="$style.breadcrumbPanel">
    <div :class="$style.leftPanel">
      <div :class="$style.navigation">
        <ui3n-button
          type="icon"
          icon="round-arrow-back"
          color="var(--color-bg-block-primary-default)"
          icon-color="var(--color-text-control-primary-default)"
          icon-size="25"
          square
          :class="$style.navButtons"
          :disabled="!segments.length"
          @click="goBack"
        />
        <div :class="$style.crumbsHolder">
          <div :class="$style.crumbs">
            <ui3n-breadcrumbs>
              <ui3n-breadcrumb
                v-for="(seg, index) in segments"
                :key="index"
                :is-active="index < segments.length - 1"
                @click="handleClick(index)"
              >
                {{ seg }}
              </ui3n-breadcrumb>
            </ui3n-breadcrumbs>
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.rightPanel">
      <ui3n-button
        type="icon"
        color="var(--color-bg-block-primary-default)"
        :icon="isTileView ? 'rectangles-two' : 'squares-four'"
        icon-color="var(--color-text-control-primary-default)"
        square
        :class="$style.navButtons"
        @click="
          () => {
            console.log('Toggle for different view not implemented yet');
          }
        "
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  .breadcrumbPanel {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 16px;
    color: var(--color-text-control-primary-default);
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }
  .leftPanel {
    display: flex;
    gap: 12px;

    .navigation {
      display: flex;
      gap: 12px;
    }

    .crumbsHolder {
      font-size: var(--font-14);
      margin-top: 6px;
      .crumbs {
        display: flex;
        gap: 5px;
      }
    }
  }
  .navButtons {
    border: 1px solid var(--color-border-block-primary-default) !important;
  }
</style>
