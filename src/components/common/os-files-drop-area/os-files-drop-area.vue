<script lang="ts" setup>
  import { inject } from 'vue';
  import { VUEBUS_KEY, VueBusPlugin } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nDropFiles, Ui3nInputFile } from '@v1nt1248/3nclient-lib';
  import type { AppGlobalEvents } from '@/types';
  import { useFsEntryStore } from '@/store';

  const props = defineProps<{
    fsId: string;
    path: string;
    isEmptyFolderMode?: boolean;
  }>();
  const emits = defineEmits<{
    (event: 'loading', value: boolean): void;
  }>();

  const bus = inject<VueBusPlugin<AppGlobalEvents>>(VUEBUS_KEY)!;

  const { saveFileBaseOnOsFileSystemFile } = useFsEntryStore();

  async function onFilesSelect(value: File[] | FileList) {
    try {
      emits('loading', true);
      const files = [...value] as File[];
      for (const file of files) {
        await saveFileBaseOnOsFileSystemFile({
          fsId: props.fsId,
          uploadedFile: file,
          folderPath: props.path,
          withThumbnail: true,
        });
      }
      bus.$emitter.emit('upload:file', { fsId: props.fsId, fullPath: props.path });
    } finally {
      emits('loading', false);
    }
  }
</script>

<template>
  <div :class="$style.osFilesDropArea">
    <ui3n-drop-files
      :class="!isEmptyFolderMode && $style.withoutIcon"
      title=""
      permanent-display
      @select="onFilesSelect"
    >
      <template
        v-if="isEmptyFolderMode"
        #additional-text
      >
        <div :class="$style.noDataText">
          <span>{{ $tr('table.folder.empty.text') }}</span>&nbsp;
          <ui3n-input-file
            multiple
            :button-text="$tr('app.upload.file.text')"
            @update:model-value="onFilesSelect"
          />
        </div>
      </template>
    </ui3n-drop-files>
  </div>
</template>

<style lang="scss" module>
  .osFilesDropArea {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .withoutIcon {
    div:first-child {
      div {
        display: none;
      }
    }
  }

  .noDataText {
    font-size: var(--font-12);
    font-weight: 500;
    line-height: var(--font-16);
    color: var(--color-text-control-secondary-default);
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--space-xs);

    span {
      display: inline-block;
      user-select: none;
    }
  }
</style>
