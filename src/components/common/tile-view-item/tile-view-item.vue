<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import dayjs from 'dayjs';
  import { type Nullable, Ui3nEditable, Ui3nIcon, Ui3nProgressLinear } from '@v1nt1248/3nclient-lib';
  import { getFileExtension, isFileImage, isFileVideo, type TaskRunnerInstance } from '@v1nt1248/3nclient-lib/utils';
  import type { FsFolderEntityEvent, ListingEntryExtended } from '@/types';
  import { useDblClickHandler } from '@/composables/useDblClickHandler';
  import { useAbilities } from '@/composables/useAbilities';
  import { createThumbnail as _createThumbnail } from '@/utils';
  import FileType from '@/components/common/file-type/file-type.vue';


  const props = defineProps<{
    window: 1 | 2;
    fsId: string;
    rootFolderId: string;
    taskRunner: TaskRunnerInstance;
    item: ListingEntryExtended;
    isSelected?: boolean;
    isDroppable?: boolean;
  }>();
  const emits = defineEmits<{
    (event: 'action', value: { event: FsFolderEntityEvent; payload?: unknown }): void;
    (event: 'select', value: ListingEntryExtended): void;
    (event: 'select:multiple'): void;
  }>();

  const editNameMode = ref<boolean>(false);
  const thumbnail = ref<Nullable<string>>(null);
  const isThumbnailCreationProcessGoingOn = ref(false);

  const fileExtension = computed(() => {
    if (props.item.type !== 'file') {
      return '';
    }

    return getFileExtension(props.item.name).toLowerCase();
  });

  const displayingCTime = computed(() => props.item.ctime ? dayjs(props.item.ctime).format('YYYY-MM-DD') : '');

  const iconStyle = computed(() => !(props.item?.thumbnail || thumbnail.value)
    ? { backgroundColor: 'var(--color-bg-control-secondary-default)' }
    : { backgroundImage: `url(${props.item.thumbnail || thumbnail.value})` },
  );

  const { canRename, canSetUnsetFavorite, canCopyMove } = useAbilities();

  const { handleDblClick } = useDblClickHandler(onClick, onDblClick);

  function onClick(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    emits('action', { event: 'open:info', payload: { entity: props.item } });
  }

  function onDblClick() {
    if (props.item.type === 'folder') {
      emits('action', { event: 'go', payload: props.item.fullPath });
    }
  }

  function selectItem(ev: MouseEvent) {
    const { shiftKey } = ev;
    if (shiftKey) {
      emits('select:multiple');
    } else {
      emits('select', props.item);
    }
  }

  function updateName(name: Nullable<string>): void {
    emits('action', { event: 'rename', payload: { entity: props.item, newName: name } });
  }

  function updateFavorite() {
    if (props.item?.type !== 'folder') {
      return;
    }

    emits('action', { event: 'update:favorite', payload: { entity: props.item } });
  }

  async function createThumbnail() {
    const { type, thumbnail: itemThumbnail, ext = '', fullPath } = props.item;

    if (
      type === 'file' && !itemThumbnail && (
        isFileImage({ fullName: fullPath.toLowerCase() })
        || isFileVideo({ fullName: fullPath.toLowerCase() })
        || ext.toLowerCase() === 'pdf'
      )
    ) {
      isThumbnailCreationProcessGoingOn.value = true;

      props.taskRunner.addTask(
        async () => {
          await _createThumbnail(props.fsId, fullPath).then((val) => {
            if (val) {
              thumbnail.value = val;
            }
          }).finally(() => {
            isThumbnailCreationProcessGoingOn.value = false;
          });
        }
      )
    }
  }

  createThumbnail();
</script>

<template>
  <div
    :class="[
      $style.tileViewItem,
      isSelected && $style.selected,
      isDroppable && $style.droppable
    ]"
    :draggable="!editNameMode && canCopyMove(rootFolderId)"
    @click="handleDblClick"
  >
    <div :class="$style.header">
      <ui3n-icon
        v-if="item.type === 'folder' && canSetUnsetFavorite(fsId, rootFolderId)"
        icon="round-bookmark"
        width="12"
        height="12"
        :color="item.favoriteId ? 'var(--color-icon-table-accent-selected)' : 'var(--color-icon-table-accent-unselected)'"
        :class="[$style.favoriteIcon, item.favoriteId && $style.favoriteIconSelected]"
        @click.stop="updateFavorite"
      />

      <div
        :class="$style.icon"
        @click.stop.prevent="selectItem"
      >
        <ui3n-icon
          v-if="isSelected"
          icon="round-check-box"
          :width="20"
          :height="20"
          color="var(--color-icon-control-accent-default)"
        />

        <template v-else>
          <template v-if="isDroppable">
            <ui3n-icon
              icon="round-system-update-alt"
              :rotate="-90"
              color="var(--color-icon-control-accent-default)"
            />
          </template>

          <template v-else>
            <ui3n-icon
              :class="$style.iconCheck"
              icon="round-check-box-outline-blank"
              :width="20"
              :height="20"
              color="var(--color-icon-control-accent-default)"
            />

            <ui3n-icon
              :class="$style.iconType"
              :icon="item.type === 'folder' ? 'round-folder' : 'round-subject'"
              :width="20"
              :height="20"
              color="var(--color-icon-table-secondary-default)"
            />
          </template>
        </template>
      </div>

      <ui3n-editable
        :model-value="item.name"
        disallow-empty-value
        :disabled="!canRename(fsId, rootFolderId)"
        @toggle:edit-mode="editNameMode = $event"
        @update:model-value="updateName"
      />
    </div>

    <div
      :class="$style.body"
      :style="iconStyle"
    >
      <ui3n-icon
        v-if="!(item?.thumbnail || thumbnail)"
        :icon="item?.type === 'folder' ? 'round-folder' : 'round-subject'"
        width="100"
        height="100"
        color="var(--color-icon-table-secondary-default)"
      />

      <ui3n-progress-linear
        v-if="isThumbnailCreationProcessGoingOn"
        :class="$style.loader"
        indeterminate
      />
    </div>

    <div :class="$style.footer">
      <file-type
        v-if="item.type === 'file'"
        :file-type="fileExtension"
      />
      <span v-else>&nbsp;</span>

      <span :class="$style.date">{{ displayingCTime }}</span>
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/_mixins' as mixins;

  .tileViewItem {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background-color: var(--color-bg-table-d-cell-default);
    border-radius: var(--spacing-s);
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    row-gap: var(--spacing-s);
    cursor: pointer;

    &.selected {
      background-color: var(--color-bg-control-primary-hover);
    }

    &:hover {
      background-color: var(--color-bg-control-primary-hover);

      .favoriteIcon {
        opacity: 1;
        cursor: pointer;
      }

      .iconCheck {
        display: block !important;
      }

      .iconType {
        display: none !important;
      }
    }
  }

  .droppable {
    position: relative;
    background-color: var(--color-bg-control-primary-hover);
  }

  .header {
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    height: var(--spacing-ml);
    padding-left: var(--spacing-ml);
  }

  .name {
    font-size: var(--font-13);
    font-weight: 600;
    color: var(--color-text-control-primary-default);
    @include mixins.text-overflow-ellipsis();
  }

  .favoriteIcon {
    position: absolute;
    left: -14px;
    top: 6px;
    z-index: 2;

    &:not(.favoriteIconSelected) {
      opacity: 0;
    }

    &.favoriteIconSelected {
      opacity: 1;
    }
  }

  .icon {
    position: absolute;
    min-width: 20px;
    width: 20px;
    height: 20px;
    left: 0;
    top: 2px;
    cursor: pointer;
  }

  .iconCheck {
    position: relative;
    display: none !important;
  }

  .iconType {
    position: relative;
  }

  .body {
    position: relative;
    flex-grow: 1;
    background-color: var(--color-bg-block-primary-default);
    border-radius: var(--spacing-xs);
    display: flex;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  .loader {
    position: absolute !important;
    left: 0;
    bottom: 0;
    width: 100%;
  }

  .footer {
    display: flex;
    width: 100%;
    height: 20px;
    justify-content: space-between;
    align-items: center;
  }

  .date {
    font-size: var(--font-14);
    font-weight: 400;
    color: var(--color-text-table-primary-default);
  }
</style>
