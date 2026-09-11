import { onBeforeMount, onBeforeUnmount } from 'vue';
import { useAppStore } from '@/store';
import { SystemSettings } from '@/utils/ui-settings';

/**
 * Loads app config (lang, theme) and subscribes to live changes.
 */
export function useInitSetup() {
  const appStore = useAppStore();
  const { setLang, setColorTheme, getAppConfig } = appStore;

  let unwatch: (() => void) | undefined;

  onBeforeMount(async () => {
    try {
      await getAppConfig();
    } catch (e) {
      // UI settings are non-fatal for the picker. Keep the current/default
      // configuration and allow file selection to remain available.
      console.error('🔥 Error while loading picker app config. ', e);
    }

    try {
      const config = await SystemSettings.makeResourceReader();
      // watchConfig's return value IS the unsubscribe fn...not a
      // subscription object. See shared/types/app.types.ts AppConfigs.
      unwatch = config.watchConfig({
        next: appConfig => {
          const { lang, colorTheme } = appConfig;
          setLang(lang);
          setColorTheme(colorTheme);
        },
      });
    } catch (e) {
      // Live theme/language updates are also non-fatal. The picker can keep
      // using whichever configuration is already active.
      console.error('🔥 Error while watching picker app config. ', e);
    }
  });

  onBeforeUnmount(() => {
    unwatch?.();
  });
}
