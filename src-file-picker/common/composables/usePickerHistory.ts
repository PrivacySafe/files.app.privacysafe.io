import { watch, onBeforeUnmount } from 'vue';
import type { PickerStateApi } from '@picker/common/composables/usePickerState';
import type { PickerSource } from '@picker/common/types';

interface HistoryEntry {
  tab: PickerSource;
  path: string;
}

/**
 * Mirrors picker navigation (tab + path) into window.history so Android's
 * WebView back button (canGoBack()/goBack()) retraces navigation one level
 * at a time...same as the breadcrumb's back arrow...instead of immediately
 * falling through to Android's Activity-level back handling.
 *
 * Uses replaceState (not pushState) on mount: labels the existing history
 * entry instead of adding a new one, so a user who hasn't navigated
 * anywhere yet gets an immediate exit-attempt on the first back press,
 * not a wasted no-op press before the real exit.
 *
 * Mobile-only for now. Not wired into desktop.
 */
export function usePickerHistory(picker: PickerStateApi) {
  let restoring = false; // guards popstate-driven changes from re-pushing

  history.replaceState({ tab: picker.activeTab.value, path: '' } satisfies HistoryEntry, '');

  const stopWatch = watch(
    () => [picker.activeTab.value, picker.currentWindow.value.currentPath] as const,
    ([tab, path]) => {
      if (restoring) return; // change came FROM popstate, don't re-push
      history.pushState({ tab, path } satisfies HistoryEntry, '');
    },
  );

  function onPopState(e: PopStateEvent) {
    const entry = e.state as HistoryEntry | null;
    if (!entry) return; // at root already — nothing left for us to handle

    restoring = true;
    if (entry.tab !== picker.activeTab.value) {
      picker.switchTab(entry.tab);
    }
    picker.navigateToFolder(entry.path);
    restoring = false;
  }

  window.addEventListener('popstate', onPopState);

  onBeforeUnmount(() => {
    window.removeEventListener('popstate', onPopState);
    stopWatch();
  });
}
