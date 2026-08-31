<script lang="ts" setup>
  import { inject, ref, defineAsyncComponent } from 'vue';
  import { useI18n } from 'vue-i18n';

  import {
    DIALOGS_KEY,
    NOTIFICATIONS_KEY,
    NotificationsPlugin,
    type DialogsPlugin,
  } from '@v1nt1248/3nclient-lib/plugins';

  import { providePickerState } from '@picker/common/composables/usePickerState';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge';
  import { settleDialog } from '@picker/common/capability-bridge/settle-dialog';
  import pickerSidebar from '@picker/desktop/components/file-picker/picker-sidebar.vue';
  import pickerBreadcrumb from '@picker/desktop/components/file-picker/picker-breadcrumb.vue';
  import pickerFooter from '@picker/desktop/components/file-picker/picker-footer.vue';
  import PickerFileList from '@picker/desktop/components/file-picker/picker-file-list.vue';
  import { usePickerFS } from '@picker/common/composables/pickerFS';

  import size from 'lodash/size';

  const dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;
  const { t } = useI18n();
  const dialogRequest = inject(DIALOG_REQUEST_KEY);

  if (!dialogRequest) {
    throw new Error('DialogRequestState not provided...is main.ts wiring app.provide(DIALOG_REQUEST_KEY, ...)?');
  }
  const picker = providePickerState(dialogRequest);
  const pendingSaveName = ref('');

  const notifications = inject<NotificationsPlugin>(NOTIFICATIONS_KEY)!;

  async function handleSelect() {
    if (!dialogRequest?.resolve) {
      return;
    }
    if (dialogRequest.mode === 'saveFile') {
      await handleSaveConfirm();
      return;
    }

    // openFile mode: if exactly one folder is selected (and nothing else),
    // treat Select as "go there" instead of "resolve this as a file".
    // navigateToFolder() already clears picker.selected, so the highlight
    // won't carry over into the folder we land in.
    const selectedIds = Array.from(picker.selected.value);
    if (selectedIds.length === 1) {
      const entry = picker.currentWindow.value.entries.find(e => e.id === selectedIds[0]);
      if (entry?.isFolder) {
        picker.navigateToFolder(entry.id);
        return;
      }
    }

    try {
      const files = await picker.resolveSelectedFiles();
      settleDialog(dialogRequest, files);
    } catch (err) {
      console.error('🔥 ERROR RESOLVING SELECTED FILES. ', err);
      settleDialog(dialogRequest, undefined);
    }
  }

  async function handleSaveConfirm() {
    const name = picker.saveFileName.value.trim();
    if (!name) {
      return;
    }

    if (!picker.isSaveFileNameValid(name)) {
      notifications.$createNotice({
        type: 'error',
        withIcon: false,
        content: t('file_picker.notification.error.invalid_filename'),
        duration: 4000,
      });
      return;
    }

    if (picker.checkFileNameCollision(name)) {
      pendingSaveName.value = name;
      await openSaveFileDialog();
      return;
    }

    await writeAndClose();
  }

  async function writeAndClose() {
    try {
      const file = await picker.resolveSaveFile();
      settleDialog(dialogRequest!, file);
    } catch (err) {
      console.error('🔥 ERROR RESOLVING SAVE FILE. ', err);
      settleDialog(dialogRequest!, undefined);
    }
  }

  async function handleCancel() {
    picker.clearSelection();
    if (dialogRequest) {
      settleDialog(dialogRequest, undefined);
    }
  }

  async function openSaveFileDialog() {
    const component = defineAsyncComponent(() => import('@picker/desktop/dialogs/file-collision-dialog.vue'));

    const result = await dialogs.$openDialog(component, {
      data: pendingSaveName.value,
      dialogProps: {
        title: t('dialog.file_exist.title'),
        cssStyle: { maxHeight: '95%' },
        closeOnClickOverlay: false,
        confirmButton: false,
        cancelButton: false,
      },
    });

    if (result?.event !== 'confirm') {
      // cancel / close / click-overlay -> no-op, user still in picker,
      // filename input free to edit
      return;
    }

    if (result.data) {
      // user picked "Rename" then "Change" -> re-run collision check
      // against the new name (it could collide too)
      picker.saveFileName.value = result.data as string;
      await handleSaveConfirm();
      return;
    }

    // "Overwrite" was chosen
    await writeAndClose();
  }

  const { userDeviceFsFolders } = usePickerFS();
</script>

<template>
  <div :class="$style.filePickerDialog">
    <header :class="$style.customTitle">
      <h3>
        {{
          dialogRequest?.title ||
          (dialogRequest?.mode === 'saveFile'
            ? t('file_picker.header.save_file')
            : t('file_picker.header.select_file'))
        }}
      </h3>
    </header>

    <div :class="$style.mainContent">
      <aside :class="$style.sidebar">
        <div v-if="size(userDeviceFsFolders)">
          <picker-sidebar :folders="userDeviceFsFolders" />
        </div>
      </aside>

      <section :class="$style.workspace">
        <picker-breadcrumb />

        <div :class="$style.content">
          <picker-file-list />
        </div>
      </section>
    </div>

    <div :class="$style.actionPanel">
      <picker-footer
        @confirm="handleSelect"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  .filePickerDialog {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .customTitle {
    padding: 16px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border-block-primary-default);

    h3 {
      margin: 0;
      font-size: var(--font-14);
      color: var(--color-text-control-primary-default);
    }
  }

  .mainContent {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .sidebar {
    width: 213px;
    flex-shrink: 0;
    border-right: 1px solid var(--color-border-block-primary-default);
    overflow: hidden;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .actionPanel {
    flex-shrink: 0;
    border-top: 1px solid var(--color-border-block-primary-default);
  }
</style>
