<!--
 Copyright (C) 2025 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
-->
<script lang="ts" setup>
  import { computed } from 'vue';
  import { storeToRefs } from 'pinia';
  import { Ui3nButton, Ui3nTooltip } from '@v1nt1248/3nclient-lib';
  import { useNavigation } from '@/composables/useNavigation';
  import { useAppStore, useFsStore, useRunModeInfoStore } from '@/store';
  import FsSystemsSelector from '@/components/common/dashboard-toolbar/fs-systems-selector.vue';
  import FolderPath from '@/components/common/dashboard-toolbar/folder-path.vue';

  const { isTileView, isSplittedMode, activeWindow, navigateToRouteSingle, navigateToRouteDouble } = useNavigation();

  const { areSystemFoldersShowing } = storeToRefs(useAppStore());
  const { fsList } = storeToRefs(useFsStore());

  const runModeInfoStore = useRunModeInfoStore();
  const { processedPath, currentFsId, isCurrentRootFsFolderTrash } = storeToRefs(runModeInfoStore);
  const { toggleMode } = runModeInfoStore;

  const availableFileSystems = computed(() => Object.values(fsList.value).filter(fs => {
    if (areSystemFoldersShowing.value) {
      return true;
    }

    return !fs.fsId.includes('system-');
  }));

  function changeFs(id: string) {
    if (isSplittedMode.value) {
      return navigateToRouteDouble({
        params: {
          ...(activeWindow.value === '1' && { fsId: id, folderId: `${id}-root` }),
          ...(activeWindow.value === '2' && { fs2Id: id, folder2Id: `${id}-root` }),
        },
        query: {
          view: isTileView.value ? 'tile' : 'table',
          ...(activeWindow.value === '1' && { path: '' }),
          ...(activeWindow.value === '2' && { path2: '' }),
        },
      });
    }

    return navigateToRouteSingle({
      params: { fsId: id, folderId: `${id}-root` },
      query: { view: isTileView.value ? 'tile' : 'table' },
    });
  }
</script>

<template>
  <div :class="$style.dashboardToolbar">
    <div :class="[$style.block, $style.breadcrumbsBlock, isCurrentRootFsFolderTrash && $style.breadcrumbsBlockLong]">
      <fs-systems-selector
        :model-value="currentFsId"
        :file-systems="availableFileSystems"
        @update:model-value="changeFs"
      />

      <div :class="$style.path">
        <folder-path
          :current-fs-id="currentFsId"
          :path="processedPath"
        />
      </div>
    </div>

    <div :class="$style.block">
      <ui3n-tooltip
        :content="isTileView ? $tr('dashboard.toolbar.table.view.tooltip') : $tr('dashboard.toolbar.tile.view.tooltip')"
        position-strategy="fixed"
        placement="top-end"
      >
        <ui3n-button
          type="icon"
          color="var(--color-bg-block-primary-default)"
          :icon="isTileView ? 'rectangles-two' : 'squares-four'"
          icon-color="var(--color-icon-button-secondary-default)"
          :disabled="true"
        />
      </ui3n-tooltip>

      <template v-if="!isCurrentRootFsFolderTrash">
        <ui3n-tooltip
          :content="isSplittedMode ? $tr('dashboard.toolbar.simple.mode.tooltip') : $tr('dashboard.toolbar.split.mode.tooltip')"
          position-strategy="fixed"
          placement="top-end"
        >
          <ui3n-button
            type="icon"
            color="var(--color-bg-block-primary-default)"
            :icon="isSplittedMode ? 'round-check-box-outline-blank' : 'splitscreen-right'"
            icon-color="var(--color-icon-button-secondary-default)"
            @click="toggleMode"
          />
        </ui3n-tooltip>
      </template>
    </div>
  </div>
</template>

<style lang="scss" module>
  .dashboardToolbar {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    padding: 0 var(--spacing-m);
    column-gap: var(--spacing-s);
  }

  .block {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 100%;

    button[disabled] {
      opacity: 0.5;
    }
  }

  .breadcrumbsBlock {
    width: calc(100% - 64px);
  }

  .breadcrumbsBlockLong {
    width: calc(100% - 32px);
  }

  .path {
    position: relative;
    width: calc(100% - 220px);
    height: 100%;
    margin-left: var(--spacing-xs);
  }
</style>
