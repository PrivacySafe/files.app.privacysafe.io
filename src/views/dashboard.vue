<!--
 Copyright (C) 2024 - 2025 3NSoft Inc.

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
  import { computed, defineAsyncComponent, inject, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRouter, useRoute } from 'vue-router';
  import {
    DialogsPlugin,
    DIALOGS_KEY,
    I18nPlugin,
    I18N_KEY,
    VueBusPlugin,
    VUEBUS_KEY,
  } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton, Ui3nIcon, Ui3nMenu } from '@v1nt1248/3nclient-lib';
  import { cloudFileSystemSrv } from '@/services/services-provider';
  import { useAppStore, useFavoriteStore } from '@/store';
  import { SYSTEM_FOLDERS } from '@/constants';
  import type { AppGlobalEvents, FavoriteFolder, SystemFolderView } from '@/types';
  import FavoriteListItem from '@/components/views/dashboard/favorite-list-item/favorite-list-item.vue';

  const dialog = inject<DialogsPlugin>(DIALOGS_KEY)!;
  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

  const { setCommonLoading } = useAppStore();
  const favoriteStore = useFavoriteStore();
  const { processedFavoriteFolders } = storeToRefs(favoriteStore);
  const { getFavoriteFolderList } = favoriteStore;
  const { makeFolder, saveFileBaseOnOsFileSystemFile } = cloudFileSystemSrv;

  const router = useRouter();
  const route = useRoute();

  const selectedFolder = computed(() => route.path);
  const isCreateDisabled = computed(() => {
    const { name } = route;
    return name !== 'folder-home';
  });

  const processedPath = computed(() => {
    const { path = '', path2 = '', activePath = '1' } = route.query as {
      path?: string;
      path2?: string;
      activePath?: string
    };
    const parentPath = activePath === '1' ? path : path2;
    return decodeURI(parentPath);
  });

  function selectFolder(folder: SystemFolderView) {
    router.push(folder.route);
  }

  function createFolder() {
    const component = defineAsyncComponent(() => import('../components/dialogs/update-folder-name-dialog.vue'));
    dialog.$openDialog<typeof component>({
      component,
      componentProps: {
        name: '',
      },
      dialogProps: {
        title: $tr('create.folder.dialog.title'),
        confirmButtonText: $tr('create.dialog.confirm.button'),
        onConfirm: async (data) => {
          const { newName } = data as unknown as { oldName: string; newName: string };
          if (newName) {
            const newFolderPath = `${processedPath.value}/${newName}`;
            await makeFolder(newFolderPath);
            bus.$emitter.emit('create:folder', { fullPath: newFolderPath });
          }
        },
      },
    });
  }

  function uploadFile() {
    const component = defineAsyncComponent(() => import('../components/dialogs/upload-files-dialog.vue'));
    dialog.$openDialog<typeof component>({
      component,
      componentProps: {
        currentFolder: processedPath.value,
      },
      dialogProps: {
        title: '',
        cssStyle: {
          width: '95%',
          height: '90%',
        },
        confirmButton: false,
        cancelButton: false,
        closeOnClickOverlay: false,
        onConfirm: async (files) => {
          try {
            setCommonLoading(true);

            for (const file of (files as File[])) {
              await saveFileBaseOnOsFileSystemFile(file, processedPath.value, true);
            }

            bus.$emitter.emit('upload:file', { fullPath: processedPath.value });
          } finally {
            setCommonLoading(false);
          }
        },
      },
    });
  }

  async function go(favoriteFolder: FavoriteFolder) {
    const rootFolder = SYSTEM_FOLDERS.find((folder) => folder.name === 'Home');
    bus.$emitter.emit('go:favorite', void 0);
    await router.push({ path: rootFolder!.route, query: { path: favoriteFolder.fullPath } });
  }

  onBeforeMount(async () => {
    await getFavoriteFolderList();
  });
</script>

<template>
  <div :class="$style.dashboard">
    <div :class="$style.list">
      <div :class="$style.actions">
        <ui3n-menu
          :disabled="isCreateDisabled"
          :offset-y="4"
        >
          <ui3n-button
            icon="outline-arrow-drop-down"
            icon-size="16"
            icon-color="var(--color-icon-button-primary-default)"
            icon-position="right"
            :disabled="isCreateDisabled"
          >
            {{ $tr('app.create') }}
          </ui3n-button>

          <template #menu>
            <div :class="$style.createContent">
              <div
                :class="$style.createContentItem"
                @click="createFolder"
              >
                <ui3n-icon
                  icon="outline-folder"
                  :width="16"
                  :height="16"
                  color="var(--color-icon-control-primary-default)"
                />
                {{ $tr('app.create.folder.text') }}
              </div>

              <div
                :class="$style.createContentItem"
                @click="uploadFile"
              >
                <ui3n-icon
                  icon="outline-file-upload"
                  :width="16"
                  :height="16"
                  color="var(--color-icon-control-primary-default)"
                />
                {{ $tr('app.upload.file.text') }}
              </div>
            </div>
          </template>
        </ui3n-menu>
      </div>

      <div
        v-for="folder in SYSTEM_FOLDERS"
        :key="folder.route"
        :class="[
          $style.folder,
          folder.route === selectedFolder && $style.folderSelected,
          folder.disabled && $style.folderDisabled,
        ]"
        @click="selectFolder(folder)"
      >
        <ui3n-icon
          :icon="folder.icon"
          :width="16"
          :height="16"
          :color="folder.route === selectedFolder
            ? 'var(--color-icon-control-accent-default)'
            : 'var(--color-icon-control-secondary-default)'
          "
        />
        <span :class="$style.folderName">
          {{ folder.name }}
        </span>
      </div>

      <div :class="$style.favorites">
        <div :class="$style.favoritesTitle">
          <span>{{ $tr('app.favorites.title') }}</span>
          <ui3n-icon
            icon="round-bookmark"
            :width="16"
            :height="16"
            color="var(--color-icon-control-secondary-default)"
          />
        </div>

        <div :class="$style.favoritesContent">
          <FavoriteListItem
            v-for="item in processedFavoriteFolders"
            :key="item.id"
            :item="item"
            @go="go"
          />
        </div>
      </div>
    </div>

    <div :class="$style.body">
      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          v-if="Component"
        />
      </router-view>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '../assets/styles/mixins' as mixins;

  .dashboard {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
  }

  .list {
    position: relative;
    width: calc(var(--column-size) * 2);
    border-right: 1px solid var(--color-border-block-primary-default);
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }

  .actions {
    position: relative;
    width: 100%;
    padding: var(--spacing-s) var(--spacing-s) var(--spacing-m) var(--spacing-s);
  }

  .create {
    text-transform: capitalize;
  }

  .createContent {
    background-color: var(--color-bg-control-secondary-default);
    padding: var(--spacing-xs);
    border-radius: var(--spacing-xs);
    width: max-content;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    @include mixins.elevation(1);
  }

  .createContentItem {
    display: flex;
    height: var(--spacing-l);
    justify-content: flex-start;
    align-items: center;
    gap: var(--spacing-s);
    text-transform: capitalize;
    padding: 0 var(--spacing-s);
    font-size: var(--font-13);
    color: var(--color-text-control-primary-default);

    &:hover {
      color: var(--color-text-control-primary-hover);
      background-color: var(--color-bg-control-primary-hover);
      cursor: pointer;

      & > div {
        color: var(--color-text-control-accent-default) !important;
      }
    }
  }

  .body {
    position: relative;
    width: calc(100% - calc(var(--column-size) * 2) - 1px);
    display: flex;
    justify-content: flex-start;
    align-items: stretch;
  }

  .folder {
    display: flex;
    width: 100%;
    height: var(--spacing-l);
    justify-content: flex-start;
    align-items: center;
    column-gap: var(--spacing-s);
    padding: 0 var(--spacing-s);
    border-radius: var(--spacing-xs);
    font-size: var(--font-13);
    color: var(--color-text-control-primary-default);
    cursor: pointer;
    margin-bottom: calc(var(--spacing-xs) / 2);

    &:hover {
      color: var(--color-text-control-primary-hover);
      background-color: var(--color-bg-control-primary-hover);

      & > div {
        color: var(--color-text-control-accent-default) !important;
      }
    }
  }

  .folderSelected {
    color: var(--color-text-control-primary-hover);
    background-color: var(--color-bg-control-primary-hover);

    & > div {
      color: var(--color-text-control-accent-default) !important;
    }
  }

  .folderDisabled {
    pointer-events: none;
    cursor: default;

    div, span {
      opacity: 0.5;
    }
  }

  .folderName {
    font-size: var(--font-13);
    font-weight: 600;
    color: var(--black-90);
  }

  .favorites {
    position: relative;
    height: auto;
    flex-grow: 1;
    padding: var(--spacing-m) var(--spacing-s) 0 var(--spacing-s);
  }

  .favoritesTitle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-12);
    line-height: var(--font-16);
    font-weight: 600;
    color: var(--color-text-control-secondary-default);
    text-transform: uppercase;
    margin-bottom: var(--spacing-s);
  }

  .favoritesContent {
    position: relative;
    height: calc(100% - 88px);
    overflow-y: auto;
  }
</style>
