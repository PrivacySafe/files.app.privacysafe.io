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
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { storeToRefs } from 'pinia';
  import size from 'lodash/size';
  import {
    Ui3nButton,
    Ui3nCheckbox,
    Ui3nDialog,
    Ui3nIcon,
    Ui3nProgressCircular,
    Ui3nTooltip,
    type Nullable,
    type Ui3nDialogComponentProps,
    type Ui3nDialogEvent,
  } from '@v1nt1248/3nclient-lib';
  import { getFileExtension } from '@v1nt1248/3nclient-lib/utils';
  import { useFsStore, useSyncQueueStore } from '@/store';
  import { executeFunc } from '@shared/utils/execute-function';
  import { appStorageSrv } from '@/services/services-provider';
  import { AUTOMATIC_DOWNLOAD_FILE_LIMIT_SIZE, USER_FS } from '@shared/constants';
  import { getParentFolderPathFromEntityFullPath } from '../../../../src-deno/fs-service/utils';
  import type { ListingEntryExtended } from '@shared/types';
  import EntityDataBlock from '@/components/dialogs/resolve-conflicts-dialog/entity-data-block.vue';
  import FolderCompareBlock from '@/components/dialogs/resolve-conflicts-dialog/folder-compare-block.vue';

  const props = defineProps<{
    paths: string[];
    dialogProps?: Ui3nDialogComponentProps<boolean>;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: { event: Ui3nDialogEvent, data: boolean }): void;
  }>();

  const { t } = useI18n();

  const fsStore = useFsStore();
  const { getFs, getEntityStats, getSyncedStatus } = fsStore;
  const { trashFolderName } = storeToRefs(fsStore);
  const { getRootFolderSyncStatus } = useSyncQueueStore();

  const applyToAllObjects = ref(false);
  const currentResolvingPathIndex = ref(0);
  const currentResolvingPath = computed(() => props.paths[currentResolvingPathIndex.value]);

  const showCompareFolderTable = ref(false);
  const totalResolvingItems = computed(() => size(props.paths));

  const syncStatus = ref<web3n.files.SyncStatus | undefined>(undefined);
  const statsLocal = ref<Nullable<ListingEntryExtended & { thumbnail?: string }> | undefined>(null);
  const statsRemote = ref<Nullable<ListingEntryExtended & { thumbnail?: string }> | undefined>(null);
  const parentFolder = ref<Nullable<string>>(null);

  const isProcessOngoing = ref(false);

  async function getCurrentEntityInfo() {
    if (typeof currentResolvingPath.value !== 'string') {
      return;
    }

    syncStatus.value = await getSyncedStatus({ fsId: USER_FS, fullPath: currentResolvingPath.value });
    statsLocal.value = await getEntityStats({ fsId: USER_FS, fullPath: currentResolvingPath.value });
    statsRemote.value = await getEntityStats({ fsId: USER_FS, fullPath: currentResolvingPath.value, version: syncStatus.value!.remote!.latest! });
    const currentParentFolder = getParentFolderPathFromEntityFullPath(currentResolvingPath.value);
    parentFolder.value = currentParentFolder
      ? `Home / ${currentParentFolder.replaceAll('/', ' / ')}`
      : 'Home ';
    console.log('SYNC STATUS => ', syncStatus.value);
    console.log('STAT LOCAL => ', statsLocal.value);
    console.log('STAT REMOTE => ', statsRemote.value);
  }

  async function toggleFolderCompareDisplaying() {
    showCompareFolderTable.value = !showCompareFolderTable.value;
  }

  async function actionAfterResolveEnd() {
    if (!currentResolvingPath.value && typeof currentResolvingPath.value === 'string') {
      await getRootFolderSyncStatus('root');
      await getRootFolderSyncStatus('trash');
    } else if (currentResolvingPath.value === trashFolderName.value) {
      await getRootFolderSyncStatus('trash');
    }

    if (currentResolvingPathIndex.value === (props.paths.length - 1)) {
      emits('action', { event: 'confirm', data: true });
    } else {
      currentResolvingPathIndex.value += 1;
      await getCurrentEntityInfo();
    }
  }

  async function keepLocal() {
    if (!syncStatus.value?.remote?.latest) {
      return;
    }

    try {
      isProcessOngoing.value = true;

      if (statsLocal.value?.type === 'file') {
        await appStorageSrv.startSyncUpload(currentResolvingPath.value, { uploadVersion: syncStatus.value.remote.latest + 1 });
      } else {
        await appStorageSrv.syncUpload(currentResolvingPath.value, { uploadVersion: syncStatus.value.remote.latest + 1 });
      }

      await actionAfterResolveEnd();
    } finally {
      isProcessOngoing.value = false;
    }
  }

  async function keepCloud() {
    if (!syncStatus.value?.remote?.latest) {
      return;
    }

    try {
      isProcessOngoing.value = true;

      const fs = getFs(USER_FS);
      if (statsLocal.value?.type === 'file') {
        await appStorageSrv.adoptRemote(currentResolvingPath.value, { remoteVersion: syncStatus.value.remote.latest });
        const stats = await executeFunc({
          fn: fs.stat,
          fnArgs: [currentResolvingPath.value],
        });

        if (
          stats.versionSyncBranch === 'synced' &&
          stats.size && stats.size <= AUTOMATIC_DOWNLOAD_FILE_LIMIT_SIZE &&
          stats.version
        ) {
          await appStorageSrv.startSyncDownload(currentResolvingPath.value, stats.version);
        }
      } else {
        await appStorageSrv.adoptRemote(currentResolvingPath.value, { remoteVersion: syncStatus.value.remote.latest });
      }

      await actionAfterResolveEnd();
    } finally {
      isProcessOngoing.value = false;
    }
  }

  async function keepBothFile() {
    try {
      isProcessOngoing.value = true;

      const fs = getFs(USER_FS);
      const currentFileParentFolder = getParentFolderPathFromEntityFullPath(currentResolvingPath.value);
      const currentFileFullName = currentResolvingPath.value.replace(`${currentFileParentFolder}/`, '');
      const currentFileExt = getFileExtension(currentFileFullName);
      const currentFileName = currentFileExt ? currentFileFullName.replace(`.${currentFileExt}`, '') : currentFileFullName;
      const newItemName = `${currentFileName}_[ keep ]${currentFileExt ? `.${currentFileExt}` : ''}`;

      await executeFunc({
        fn: fs.v!.sync!.adoptRemoteFolderItem,
        fnArgs: [currentFileParentFolder, currentFileFullName, { newItemName }],
      });
      await appStorageSrv.syncUpload(currentFileParentFolder);
      const stats = await executeFunc({
        fn: fs.stat,
        fnArgs: [currentResolvingPath.value],
      });

      if (
        stats.versionSyncBranch === 'synced' &&
        stats.size && stats.size <= AUTOMATIC_DOWNLOAD_FILE_LIMIT_SIZE &&
        stats.version
      ) {
        await executeFunc({
          fn: appStorageSrv.startSyncDownload,
          fnArgs: [currentResolvingPath.value, stats.version],
        });
      }

      await actionAfterResolveEnd();
    } finally {
      isProcessOngoing.value = false;
    }
  }

  async function absorbRemoteFolderChanges() {
    if (!syncStatus.value?.remote?.latest) {
      return;
    }

    try {
      isProcessOngoing.value = true;

      const fs = getFs(USER_FS);
      await executeFunc({
        fn: fs.v!.sync!.absorbRemoteFolderChanges,
        fnArgs: [currentResolvingPath.value, { postfixForNameOverlaps: '_[ keep ]' }],
      });
      await appStorageSrv.syncUpload(currentResolvingPath.value, { uploadVersion: syncStatus.value!.remote!.latest + 1 });
      await actionAfterResolveEnd();
    } finally {
      isProcessOngoing.value = false;
    }
  }

  onMounted(async () => {
    await getCurrentEntityInfo();
  });
</script>

<template>
  <ui3n-dialog v-bind="dialogProps">
    <template #header>
      <div :class="$style.header">
        <ui3n-icon
          icon="shield-check-outline"
          size="12"
          color="var(--info-outline-default)"
        />

        <span>{{ t('dialog.resolve.title') }}</span>
        <span v-if="totalResolvingItems > 1">&nbsp;({{ currentResolvingPathIndex }}/{{ totalResolvingItems }})</span>
      </div>
    </template>

    <template #body>
      <div :class="[$style.body, (showCompareFolderTable || totalResolvingItems < 2) && $style.bodyExpanded]">
        <div :class="$style.block">
          <entity-data-block
            branch="cloud"
            :stats="statsRemote"
            :parent-folder="parentFolder"
          />
        </div>

        <div :class="$style.block">
          <entity-data-block
            branch="local"
            :stats="statsLocal"
            :parent-folder="parentFolder"
          />
        </div>

        <div
          v-if="showCompareFolderTable"
          :class="$style.folderCompareBlock"
        >
          <folder-compare-block
            :path="paths[currentResolvingPathIndex]"
            :parent-folder="parentFolder!"
            :sync-status="syncStatus"
            :stats-local="statsLocal!"
            :stats-remote="statsRemote!"
          />
        </div>
      </div>
    </template>

    <template #actions>
      <div :class="[$style.actions, (showCompareFolderTable || totalResolvingItems < 2) && $style.actionsNarrow]">
        <ui3n-checkbox
          v-if="totalResolvingItems > 1 && !showCompareFolderTable"
          v-model="applyToAllObjects"
          :class="$style.applyFlag"
        >
          {{ t('dialog.resolve.checkbox_text') }}
        </ui3n-checkbox>

        <div :class="$style.btnsBlock">
          <ui3n-button
            v-if="statsLocal?.type === 'folder'"
            type="secondary"
            @click.stop.prevent="toggleFolderCompareDisplaying"
          >
            {{ showCompareFolderTable ? t('dialog.resolve.btn.back') : t('dialog.resolve.btn.compare') }}
          </ui3n-button>
        </div>

        <div :class="$style.btnsBlock">
          <ui3n-button
            type="secondary"
            @click.stop.prevent="keepCloud"
          >
            {{ t('dialog.resolve.btn.keep_cloud') }}
          </ui3n-button>

          <ui3n-button
            type="secondary"
            @click.stop.prevent="keepLocal"
          >
            {{ t('dialog.resolve.btn.keep_local') }}
          </ui3n-button>


          <ui3n-button
            v-if="statsLocal?.type === 'file'"
            @click.stop.prevent="keepBothFile"
          >
            {{ t('dialog.resolve.btn.keep_both') }}
          </ui3n-button>

          <template v-if="statsLocal?.type === 'folder'">
            <ui3n-button :disabled="true">
              {{ t('dialog.resolve.btn.merge') }}
            </ui3n-button>

            <ui3n-tooltip
              :content="t('dialog.resolve.btn.absorb_tooltip')"
              position-strategy="fixed"
              placement="top-end"
            >
              <ui3n-button @click.stop.prevent="absorbRemoteFolderChanges">
                {{ t('dialog.resolve.btn.absorb') }}
              </ui3n-button>
            </ui3n-tooltip>
          </template>
        </div>
      </div>
    </template>

    <template #loading>
      <ui3n-progress-circular
        v-if="isProcessOngoing"
        indeterminate
        size="80"
      />
    </template>
  </ui3n-dialog>
</template>

<style lang="scss" module>
  @use '../../../assets/styles/mixins' as mixins;

  .header {
    display: flex;
    width: 100%;
    height: 48px;
    padding: 0 var(--spacing-m);
    border-bottom: 1px solid var(--color-border-block-primary-default);
    border-top-left-radius: var(--spacing-ml);
    border-top-right-radius: var(--spacing-ml);
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-xs);
    font-size: var(--font-12);
    font-weight: 500;
  }

  .closeBtn {
    position: absolute;
    right: 4px;
    top: 12px;
    z-index: 5;
  }

  .body {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 224px;
    justify-content: space-between;
    align-items: stretch;

    &.bodyExpanded {
      height: 368px;
    }
  }

  .folderCompareBlock {
    position: absolute;
    inset: 0;
    background-color: var(--color-bg-block-primary-default);
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .actions {
    position: relative;
    display: flex;
    width: 100%;
    padding: var(--spacing-ml) var(--spacing-m) 0 var(--spacing-m);
    height: 88px;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--color-border-block-primary-default);

    &.actionsNarrow {
      height: 64px;
      padding-top: 0;
    }
  }

  .applyFlag {
    position: absolute;
    left: var(--spacing-m);
    top: var(--spacing-m);
  }

  .btnsBlock {
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);
  }

  .block {
    position: relative;
    width: 100%;
    height: 50%;
  }
</style>
