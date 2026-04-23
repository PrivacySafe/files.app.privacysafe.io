/*
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
*/
import { computed, defineAsyncComponent, inject, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import hasIn from 'lodash/hasIn';
import isEmpty from 'lodash/isEmpty';
import { useAppStore, useFsStore, useSyncQueueStore } from '@/store';
import { DIALOGS_KEY, VUEBUS_KEY, type DialogsPlugin, type VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
import type { Ui3nResizeCbArg } from '@v1nt1248/3nclient-lib';
import { SystemSettings } from '@/utils/ui-settings';
import { makeServiceCaller } from '@shared/utils/ipc/ipc-service-caller';
import { AppGlobalEvents, StorageEvent, StorageUpdateQueueEvent } from '@shared/types';
import type { StorageService } from '../../src-deno/storage-deno';

export function useAppView() {
  const { t } = useI18n();
  const { $emitter } = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $openDialog } = inject<DialogsPlugin>(DIALOGS_KEY)!;

  const fsStore = useFsStore();

  const appStore = useAppStore();
  const { appVersion, user: me, connectivityStatus, commonLoading, customLogoSrc } = storeToRefs(appStore);
  const {
    getAppStorageSettings,
    getAppConfig,
    getAppVersion,
    getUser,
    getConnectivityStatus,
    setLang,
    setColorTheme,
    setAppWindowSize,
    setCustomLogo,
  } = appStore;

  const {
    synchronizationQueueInitialProcess,
    onUpdateQueue,
    upsertProcess,
    removeProcess,
    getRootFolderSyncStatus,
  } = useSyncQueueStore();

  const appElement = ref<HTMLDivElement | null>(null);

  const isFillingUpSyncQueue = ref(false);

  const connectivityTimerId = ref<ReturnType<typeof setInterval> | undefined>();

  const connectivityStatusText = computed(() =>
    connectivityStatus.value === 'online' ? 'app.status.online' : 'app.status.offline',
  );

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { contentRect, target } = entry;
      const { className } = target;
      const { width, height } = contentRect;
      if (className === 'app') {
        setAppWindowSize({ width, height });
      }
    }
  });

  async function appExit() {
    w3n.closeSelf!();
  }

  async function openAppSettings() {
    const component = defineAsyncComponent(() => import('@/components/dialogs/app-settings.vue'));
    await $openDialog<undefined>(component, {
      dialogProps: {
        title: `${t('app.title')} ${t('app.settings.title')}`,
        icon: {
          icon: 'outline-settings',
          size: 16,
        },
        width: 560,
        cssStyle: { borderRadius: '24px', maxHeight: '95%' },
        contentCssStyle: { borderRadius: '24px' },
        confirmButton: false,
        cancelButton: false,
        closeOnClickOverlay: false,
      },
    });
  }

  function onResize(value: Ui3nResizeCbArg) {
    setAppWindowSize({ width: value.width, height: value.contentHeight });
  }

  onBeforeMount(async () => {
    try {
      await fsStore.initializeFsItems();

      await getAppVersion();
      await getUser();
      await getAppConfig();
      await getConnectivityStatus();
      await getAppStorageSettings();

      connectivityTimerId.value = setInterval(getConnectivityStatus, 60000);

      const config = await SystemSettings.makeResourceReader();
      config.watchConfig({
        next: appConfig => {
          const { lang, colorTheme, customLogo } = appConfig;
          setLang(lang);
          setColorTheme(colorTheme);
          setCustomLogo(customLogo);
        },
      });

      const storageSrvConnection = await w3n.rpc!.thisApp!('AppStorageInternal');
      const storageSrv = makeServiceCaller(storageSrvConnection, [], ['watchEvent']) as StorageService;
      storageSrv.watchEvent({
        next: async eventObj => {
          console.log('🔔 WATCH EVENT FROM DENO => ', eventObj);
          const { event, payload } = eventObj;
          const path = hasIn(payload, 'path')
            ? (payload as Exclude<StorageEvent['payload'], StorageUpdateQueueEvent['payload']>).path === '.'
              ? ''
              : (payload as Exclude<StorageEvent['payload'], StorageUpdateQueueEvent['payload']>).path.replace(
                  './',
                  '',
                )
            : null;

          switch (event) {
            case 'initial-sync:start': {
              isFillingUpSyncQueue.value = true;
              break;
            }

            case 'initial-sync:end': {
              isFillingUpSyncQueue.value = false;
              break;
            }

            case 'queue:update': {
              onUpdateQueue(payload);
              if (isEmpty(payload)) {
                isFillingUpSyncQueue.value = false;
              }
              break;
            }

            case 'upload:start': {
              upsertProcess({ action: 'upload', path: path!, value: 0 });
              break;
            }

            case 'upload:progress': {
              upsertProcess({ action: 'upload', path: path!, value: payload.progress });
              break;
            }
            case 'upload:end': {
              removeProcess({ action: 'upload', path: path! });
              if (!path && typeof path === 'string') {
                await getRootFolderSyncStatus('root');
              } else if (path && path === fsStore.trashFolderName) {
                await getRootFolderSyncStatus('trash');
              }
              break;
            }

            case 'download:start': {
              upsertProcess({ action: 'download', path: path!, value: 0 });
              break;
            }

            case 'download:progress': {
              upsertProcess({ action: 'download', path: path!, value: payload.progress });
              break;
            }

            case 'download:end': {
              removeProcess({ action: 'download', path: path! });
              break;
            }

            case 'adoptRemote:start': {
              upsertProcess({ action: 'adoptRemote', path: path!, value: true });
              break;
            }

            case 'adoptRemote:end': {
              removeProcess({ action: 'adoptRemote', path: path! });
              if (!path && typeof path === 'string') {
                await getRootFolderSyncStatus('root');
              } else if (path && path === fsStore.trashFolderName) {
                await getRootFolderSyncStatus('trash');
              }
              if (payload.isNecessaryReread) {
                $emitter.emit('refresh:data', { path: path! });
              }
              break;
            }

            case 'arose:conflict': {
              if (!path && typeof path === 'string') {
                await getRootFolderSyncStatus('root');
              } else if (path && path === fsStore.trashFolderName) {
                await getRootFolderSyncStatus('trash');
              }

              if ((!path && typeof path === 'string') || (path && path === fsStore.trashFolderName)) {
                const component = defineAsyncComponent(
                  () => import('@/components/dialogs/resolve-conflicts-dialog/resolve-conflicts-dialog.vue'),
                );
                await $openDialog<boolean>(component, {
                  paths: [path || ''],
                  dialogProps: {
                    title: '',
                    width: 960,
                    cssStyle: { borderRadius: '24px' },
                    contentCssStyle: { borderRadius: '24px' },
                    confirmButton: false,
                    cancelButton: false,
                    closeOnClickOverlay: false,
                  },
                });
                $emitter.emit('refresh:data', { path: '', withoutVerify: true });
              }

              break;
            }

            case 'sync:error': {
              console.log('🔥 ERROR EVENT FROM DENO => ', payload);
              break;
            }
          }
        },
        error: e => w3n.log('error', '🔥 Error watching storage events. ', e),
        complete: () => storageSrvConnection.close(),
      });

      if (connectivityStatus.value === 'online') {
        synchronizationQueueInitialProcess().then(() => {
          $emitter.emit('complete:sync-srv-init', void 0);
        });
      }
    } catch (e) {
      console.error('🔥 Error while mounted the app. ', e);
      throw e;
    }
  });

  onMounted(() => {
    if (appElement.value) {
      const { width, height } = appElement.value.getBoundingClientRect();
      setAppWindowSize({ width, height });
      resizeObserver.observe(appElement.value as Element);
    }
  });

  onBeforeUnmount(() => {
    if (connectivityTimerId.value) {
      clearInterval(connectivityTimerId.value);
    }
  });

  return {
    appElement,
    appVersion,
    me,
    customLogoSrc,
    connectivityStatusText,
    commonLoading,
    isFillingUpSyncQueue,
    onResize,
    openAppSettings,
    appExit,
  };
}
