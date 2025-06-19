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
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/store';
import type { Ui3nResizeCbArg } from '@v1nt1248/3nclient-lib';
import { UISettings } from '@/utils/ui-settings';

export function useAppView() {
  const appStore = useAppStore();
  const { appVersion, user: me, connectivityStatus, commonLoading } = storeToRefs(appStore);
  const {
    getAppConfig,
    getAppVersion,
    getUser,
    getConnectivityStatus,
    setLang,
    setColorTheme,
    setSystemFoldersDisplaying,
    setAppWindowSize,
  } = appStore;

  const appElement = ref<Element | null>(null);

  const connectivityTimerId = ref<ReturnType<typeof setInterval> | undefined>();

  const connectivityStatusText = computed(() =>
    connectivityStatus.value === 'online' ? 'app.status.connected.online' : 'app.status.connected.offline',
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

  function onResize(value: Ui3nResizeCbArg) {
    setAppWindowSize({ width: value.width, height: value.contentHeight });
  }

  onBeforeMount(async () => {
    try {
      await getAppVersion();
      await getUser();
      await getAppConfig();
      await getConnectivityStatus();

      connectivityTimerId.value = setInterval(getConnectivityStatus, 60000);

      const config = await UISettings.makeResourceReader();
      config.watchConfig({
        next: appConfig => {
          const { lang, colorTheme, systemFoldersDisplaying } = appConfig;
          setLang(lang);
          setColorTheme(colorTheme);
          setSystemFoldersDisplaying(!!systemFoldersDisplaying);
        },
      });
    } catch (e) {
      console.error('Error while mounted the app. ', e);
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
    connectivityStatusText,
    commonLoading,
    onResize,
    appExit,
  };
}
