import { computed, type ComputedRef, defineAsyncComponent, inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';
import isEmpty from 'lodash/isEmpty';
import { DIALOGS_KEY, I18N_KEY, NOTIFICATIONS_KEY, VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
import { useNavigation } from '@/composables/useNavigation';
import { useFsWindowState } from '@/composables/useFsWindowState';
import { useAppStore, useFsEntryStore, useRunModeInfoStore } from '@/store';
import { type AppGlobalEvents, FsFolderEntityEvent, ListingEntryExtended } from '@/types';
import type { FsTableBulkActionName } from '@/components/common/fs-table-bulk-actions/types';

export function useFsFolder(fsFolderWindow: ComputedRef<'1' | '2'>) {
  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;
  const { $tr } = inject(I18N_KEY)!;
  const dialogs = inject(DIALOGS_KEY)!;
  const notifications = inject(NOTIFICATIONS_KEY)!;

  const appStore = useAppStore();
  const { setCommonLoading } = appStore;

  const runModeInfoStore = useRunModeInfoStore();
  const { deleteSelectedEntities } = runModeInfoStore;

  const { downloadEntities, restoreEntities } = useFsEntryStore();

  const {
    isSplittedMode,
    window1FsId,
    window1FolderPath,
    window2FsId,
    window2FolderPath,
    navigateToRouteSingle,
    navigateToRouteDouble,
  } = useNavigation();

  const {
    currentWindowFsId,
    currentWindowRootFolderBasePath,
    isTrashFolderInCurrentWindow,
    isSystemFolderInCurrentWindow,
  } = useFsWindowState(fsFolderWindow);

  const { getFolderContentFilledList, setFolderAsFavorite, unsetFolderAsFavorite, renameEntity } = useFsEntryStore();

  const fsFolderData = ref<ListingEntryExtended[]>([]);
  const selectedEntities = ref<ListingEntryExtended[]>([]);
  const showToolbar = ref(false);

  const isNoDataInFolder = computed(() => isEmpty(selectedEntities.value));

  async function getFsFolderData(window: '1' | '2', basePath = ''): Promise<ListingEntryExtended[]> {
    const fsId = window === '1' ? window1FsId.value! : window2FsId.value!;
    const path = window === '1' ? window1FolderPath.value : window2FolderPath.value!;
    return getFolderContentFilledList({ fsId, path, basePath });
  }

  async function loadFolderData() {
    try {
      setCommonLoading(true);
      fsFolderData.value = await getFsFolderData(fsFolderWindow.value, currentWindowRootFolderBasePath.value);
    } finally {
      setCommonLoading(false);
    }
  }

  async function changeSort(val: { field: keyof ListingEntryExtended; direction: 'asc' | 'desc' }) {
    if (isSplittedMode.value) {
      await navigateToRouteDouble({
        query: {
          ...(fsFolderWindow.value === '1' && {
            sortBy: val.field,
            sortOrder: val.direction,
          }),
          ...(fsFolderWindow.value === '2' && {
            sort2By: val.field,
            sort2Order: val.direction,
          }),
        },
      });
    } else {
      await navigateToRouteSingle({
        query: {
          sortBy: val.field,
          sortOrder: val.direction,
        },
      });
    }
  }

  function sortFolderData(
    a: ListingEntryExtended,
    b: ListingEntryExtended,
    field: keyof ListingEntryExtended,
    direction: 'asc' | 'desc',
  ): -1 | 1 {
    const aFieldValue = field === 'ext' && a.type === 'file' ? `${a.ext}-${a.name}` : a[field]!;
    const aFieldValueProcessed = typeof aFieldValue === 'string' ? aFieldValue.toLowerCase() : aFieldValue;

    const bFieldValue = field === 'ext' && a.type === 'file' ? `${b.ext}-${b.name}` : b[field]!;
    const bFieldValueProcessed = typeof bFieldValue === 'string' ? bFieldValue.toLowerCase() : bFieldValue;

    return aFieldValueProcessed > bFieldValueProcessed
      ? direction === 'desc'
        ? 1
        : -1
      : direction === 'desc'
        ? -1
        : 1;
  }

  function isEntitySelected(entity: ListingEntryExtended): boolean {
    return !!selectedEntities.value.find(e => e.id === entity.id!);
  }

  function selectEntity(entity: ListingEntryExtended) {
    const currentEntitySelectedIndex = selectedEntities.value.findIndex(e => e.id === entity.id!);
    if (currentEntitySelectedIndex === -1) {
      selectedEntities.value.push(entity);
    } else {
      selectedEntities.value.splice(currentEntitySelectedIndex, 1);
    }
  }

  function clearSelection() {
    selectedEntities.value = [];
    showToolbar.value = false;
  }

  async function handleActions(action: { event: FsFolderEntityEvent; payload?: unknown }) {
    const { event, payload } = action;
    switch (event) {
      case 'go': {
        const path = currentWindowRootFolderBasePath.value
          ? (payload as string).replace(`${currentWindowRootFolderBasePath.value}/`, '')
          : (payload as string);

        if (isSplittedMode.value) {
          return navigateToRouteDouble({
            query: {
              ...(fsFolderWindow.value === '1' && { path }),
              ...(fsFolderWindow.value === '2' && { path2: path }),
            },
          });
        }

        return navigateToRouteSingle({
          params: { fsId: currentWindowFsId.value },
          query: { path },
        });
      }

      case 'rename': {
        if (isTrashFolderInCurrentWindow.value || isSystemFolderInCurrentWindow.value) return;

        const { entity, newName } = payload as { entity: ListingEntryExtended; newName: string };
        await renameEntity({ fsId: currentWindowFsId.value, entity, newName });
        await loadFolderData();
        return;
      }

      case 'update:favorite': {
        if (isTrashFolderInCurrentWindow.value || isSystemFolderInCurrentWindow.value) return;

        const { favoriteId, fullPath } = (payload as { entity: ListingEntryExtended }).entity;
        if (favoriteId) {
          await unsetFolderAsFavorite({ fsId: currentWindowFsId.value, id: favoriteId, fullPath });
        } else {
          await setFolderAsFavorite({ fsId: currentWindowFsId.value, fullPath });
        }
        await loadFolderData();
        return;
      }
    }
  }

  async function handleBulkActions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { action, payload }: { action: FsTableBulkActionName; payload?: unknown },
    entities: ListingEntryExtended[],
  ) {
    switch (action) {
      case 'delete':
        await deleteSelectedEntities({ fsId: currentWindowFsId.value, entities, completely: false });
        break;

      case 'delete:completely': {
        const component = defineAsyncComponent(() => import('@/components/dialogs/confirmation-dialog.vue'));
        dialogs.$openDialog<typeof component>({
          component,
          componentProps: {
            dialogText: $tr('fs.entity.delete.permanently.warning1'),
            additionalDialogText: $tr('fs.entity.delete.permanently.warning2'),
          },
          dialogProps: {
            title: $tr('fs.entity.delete.permanently.title'),
            confirmButtonText: $tr('fs.entity.delete.permanently.confirm,button'),
            confirmButtonBackground: 'var(--error-content-default)',
            confirmButtonColor: 'var(--error-fill-default)',
            onConfirm: async () => {
              try {
                await deleteSelectedEntities({ fsId: currentWindowFsId.value, entities, completely: true });

                notifications.$createNotice({
                  type: 'info',
                  withIcon: true,
                  content:
                    entities.length > 1
                      ? $tr('fs.entity.delete.plural.message.success', { count: `${entities.length}` })
                      : $tr('fs.entity.delete.single.message.success'),
                });
              } catch (err) {
                w3n.log('error', err as string);

                notifications.$createNotice({
                  type: 'error',
                  withIcon: true,
                  content:
                    entities.length > 1
                      ? $tr('fs.entity.delete.plural.message.error', { count: `${entities.length}` })
                      : $tr('fs.entity.delete.single.message.error'),
                });
              }
            },
          },
        });
        break;
      }

      case 'restore': {
        let res;
        try {
          res = await restoreEntities({ fsId: currentWindowFsId.value, entities });
          if (res && res > 0) {
            bus.$emitter.emit('refresh:data', void 0);
            notifications.$createNotice({
              type: 'success',
              withIcon: true,
              content:
                res > 1
                  ? $tr('fs.entity.restore.plural.message.success', { count: `${res}` })
                  : $tr('fs.entity.restore.single.message.success'),
            });
          }
        } catch (err) {
          w3n.log('error', err as string);
          notifications.$createNotice({
            type: 'error',
            withIcon: true,
            content:
              res && res > 1
                ? $tr('fs.entity.restore.plural.message.error', { count: `${res}` })
                : $tr('fs.entity.restore.single.message.error'),
          });
        }
        break;
      }

      case 'download':
        await downloadEntities({ fsId: currentWindowFsId.value, entities });
        break;
    }
  }

  onBeforeMount(() => {
    bus.$emitter.on('create:folder', loadFolderData);
    bus.$emitter.on('upload:file', loadFolderData);
    bus.$emitter.on('refresh:data', loadFolderData);
    bus.$emitter.on('drag:end', clearSelection);
  });

  onBeforeUnmount(() => {
    bus.$emitter.off('create:folder', loadFolderData);
    bus.$emitter.off('upload:file', loadFolderData);
    bus.$emitter.off('refresh:data', loadFolderData);
    bus.$emitter.off('drag:end', clearSelection);
  });

  return {
    fsFolderData,
    selectedEntities,
    showToolbar,
    isNoDataInFolder,

    loadFolderData,
    changeSort,
    sortFolderData,
    isEntitySelected,
    selectEntity,
    clearSelection,
    handleActions,
    handleBulkActions,
  };
}
