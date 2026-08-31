<script lang="ts" setup>
  import { inject, ref, defineAsyncComponent } from 'vue';
  import { DIALOGS_KEY, type DialogsPlugin } from '@v1nt1248/3nclient-lib/plugins';

  const dialogs = inject<DialogsPlugin>(DIALOGS_KEY)!;

  import { providePickerState } from '@picker/common/composables/usePickerState';
  import { usePickerHistory } from '@picker/common/composables/usePickerHistory';
  import { DIALOG_REQUEST_KEY } from '@picker/common/capability-bridge/dialog-request-bridge.ts';
  import pickerBreadcrumb from '@picker/desktop/components/file-picker/picker-breadcrumb.vue';
  import { usePickerFS } from '@picker/common/composables/pickerFS';
  import { settleDialog } from '@picker/common/capability-bridge/settle-dialog';

  import pickerMobileHeader from './picker-mobile-header.vue';
  import pickerMobileTabs from './picker-mobile-tabs.vue';
  import pickerMobileFileList from './picker-mobile-file-list.vue';
  import pickerMobileFooter from './picker-mobile-footer.vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const dialogRequest = inject(DIALOG_REQUEST_KEY);

  if (!dialogRequest) {
    throw new Error(
      'DialogRequestState not provided...is picker-mobile-main.ts wiring app.provide(DIALOG_REQUEST_KEY, ...)?',
    );
  }

  const picker = providePickerState(dialogRequest);
  usePickerHistory(picker);
  const { userDeviceFsFolders } = usePickerFS();

  const pendingSaveName = ref('');

  // const nameEditable = ref(false);

  async function handleConfirm() {
    if (!dialogRequest?.resolve) return;

    if (dialogRequest.mode === 'saveFile') {
      await handleSaveConfirm();
      return;
    }

    try {
      // Folders never land in "selected" on mobile...a tap on a folder
      // navigates immediately (see picker-mobile-row.vue)...so whatever's
      // selected here is guaranteed to be files only. No folder-vs-file
      // branch needed, unlike desktop's handleSelect.
      const files = await picker.resolveSelectedFiles();
      settleDialog(dialogRequest, files);
    } catch (err) {
      console.error('🔥 ERROR RESOLVING SELECTED FILES. ', err);
      settleDialog(dialogRequest, undefined);
    }
  }

  async function handleSaveConfirm() {
    const name = picker.saveFileName.value.trim();
    if (!name) return;

    if (picker.checkFileNameCollision(name)) {
      // nameEditable.value = true;
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

  function handleCancel() {
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

    if (result?.event !== 'confirm') return;

    if (result.data) {
      picker.saveFileName.value = result.data as string;
      await handleSaveConfirm();
      return;
    }

    await writeAndClose();
  }
</script>

<template>
  <div :class="$style.filePickerMobileDialog">
    <picker-mobile-header @cancel="handleCancel" />
    <picker-mobile-tabs :folders="userDeviceFsFolders" />
    <picker-breadcrumb />

    <div :class="$style.content">
      <picker-mobile-file-list />
    </div>

    <picker-mobile-footer @confirm="handleConfirm" />
  </div>
</template>

<style lang="scss" module>
  .filePickerMobileDialog {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
