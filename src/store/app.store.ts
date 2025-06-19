/*
 Copyright (C) 2024-2025 3NSoft Inc.

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
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { UISettings } from '@/utils/ui-settings';
import type { Nullable } from '@v1nt1248/3nclient-lib';
import type { AvailableLanguage, AvailableColorTheme, ConnectivityStatus, AppConfigs } from '@/types';

export const useAppStore = defineStore('app', () => {
  const appVersion = ref<string>('');
  const connectivityStatus = ref<string>('offline');
  const user = ref<Nullable<string>>(null);
  const lang = ref<AvailableLanguage>('en');
  const colorTheme = ref<AvailableColorTheme>('default');
  const appWindowSize = ref<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  // @ts-ignore
  const operatingSystem = ref<'macos' | 'linux' | 'windows'>(navigator.userAgentData?.platform.toLowerCase());
  const areSystemFoldersShowing = ref(false);
  const commonLoading = ref<boolean>(false);

  const trashFolderName = computed(() => `.trash-folder-${user.value || ''}`);

  async function getAppVersion() {
    const v = await w3n.myVersion();
    if (v) {
      appVersion.value = v;
    }
  }

  async function getConnectivityStatus() {
    const status = await w3n.connectivity!.isOnline();
    if (status) {
      const parsedStatus = status.split('_');
      connectivityStatus.value = parsedStatus[0] as ConnectivityStatus;
    }
  }

  async function getUser() {
    user.value = await w3n.mailerid!.getUserId();
  }

  function setAppWindowSize({ width = 0, height = 0 }) {
    appWindowSize.value = {
      ...appWindowSize.value,
      ...(width && { width }),
      ...(height && { height }),
    };
  }

  function setCommonLoading(value: boolean) {
    commonLoading.value = value;
  }

  function setLang(value: AvailableLanguage) {
    lang.value = value;
  }

  function setColorTheme(theme: AvailableColorTheme) {
    colorTheme.value = theme;
    const htmlEl = document.querySelector('html');
    if (!htmlEl) return;

    const prevColorThemeCssClass = theme === 'default' ? 'dark-theme' : 'default-theme';
    const curColorThemeCssClass = theme === 'default' ? 'default-theme' : 'dark-theme';
    htmlEl.classList.remove(prevColorThemeCssClass);
    htmlEl.classList.add(curColorThemeCssClass);
  }

  function setSystemFoldersDisplaying(value: boolean) {
    areSystemFoldersShowing.value = value;
  }

  async function getAppConfig(): Promise<AppConfigs | undefined> {
    try {
      const config = await UISettings.makeResourceReader();
      const langVal = await config.getCurrentLanguage();
      const colorTheme = await config.getCurrentColorTheme();
      const systemFoldersDisplaying = await config.getSystemFoldersDisplaying();
      setLang(langVal);
      setColorTheme(colorTheme);
      setSystemFoldersDisplaying(systemFoldersDisplaying);

      return config;
    } catch (e) {
      console.error('Load the app config error: ', e);
    }
  }

  return {
    appVersion,
    operatingSystem,
    connectivityStatus,
    user,
    lang,
    colorTheme,
    appWindowSize,
    areSystemFoldersShowing,
    commonLoading,
    trashFolderName,
    getAppVersion,
    getConnectivityStatus,
    getUser,
    setAppWindowSize,
    setCommonLoading,
    setLang,
    setColorTheme,
    setSystemFoldersDisplaying,
    getAppConfig,
  };
});
