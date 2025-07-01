<!--
 Copyright (C) 2024 - 2025 3NSoft Inc.

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
-->
<script lang="ts" setup>
  import { computed, inject, ref, watch } from 'vue';
  import dayjs from 'dayjs';
  import isEmpty from 'lodash/isEmpty';
  import { type Nullable, Ui3nButton, Ui3nChip, Ui3nIcon, Ui3nProgressCircular } from '@v1nt1248/3nclient-lib';
  import { I18N_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import { formatFileSize, isFileImage, isFileVideo } from '@v1nt1248/3nclient-lib/utils';
  import { useFsEntryStore } from '@/store';
  import type { FsSEntityInfoProps, FsSEntityInfoEmits } from './types';
  import type { ListingEntryExtended } from '@/types';
  import { createThumbnail } from '@/utils';

  const props = defineProps<FsSEntityInfoProps>();
  const emits = defineEmits<FsSEntityInfoEmits>();

  const { $tr } = inject(I18N_KEY)!;
  const { getEntityStats } = useFsEntryStore();

  const isLoading = ref(false);
  const entityStats = ref<Nullable<ListingEntryExtended & { thumbnail?: string }>>(null);

  const iconStyle = computed(() => !entityStats.value?.thumbnail
    ? { backgroundColor: 'var(--color-bg-control-secondary-default)' }
    : { backgroundImage: `url(${entityStats.value!.thumbnail})` },
  );

  const entityType = computed(() => {
    if (!entityStats.value) {
      return '';
    }

    return $tr(`fs.entity.info.type.${entityStats.value!.type}`);
  });

  const entityPath = computed(() => {
    if (!entityStats.value) {
      return '';
    }

    const arr = entityStats.value!.fullPath.split('/');
    return arr.join(' / ');
  });

  const entitySize = computed(() => {
    if (!entityStats.value || !entityStats.value!.type || entityStats.value!.type === 'folder') {
      return '-';
    }

    return formatFileSize(entityStats.value!.size);
  });

  const entityDate = computed(() => {
    if (!entityStats.value || !entityStats.value?.ctime) {
      return '';
    }

    return dayjs(entityStats.value!.ctime).format('YYYY-MM-DD HH:mm');
  });

  const entityChanges = computed(() => {
    if (!entityStats.value || !entityStats.value?.mtime) {
      return '';
    }

    return dayjs(entityStats.value!.mtime).format('YYYY-MM-DD HH:mm');
  });

  const entityTags = computed(() => {
    if (!entityStats.value || isEmpty(entityStats.value?.tags)) {
      return [];
    }

    return entityStats.value!.tags;
  });

  async function loadEntityStats(fullPath: string) {
    try {
      isLoading.value = true;
      entityStats.value = await getEntityStats({ fsId: props.fsId, fullPath }) || null;
    } finally {
      isLoading.value = false;
    }
  }

  watch(
    () => props.path,
    async (val, oVal) => {
      if (val && val !== oVal) {
        await loadEntityStats(val);

        const { type, thumbnail, ext } = entityStats.value!;
        if (
          type === 'file' && !thumbnail && (
            isFileImage({ fullName: props.path.toLowerCase() })
            || isFileVideo({ fullName: props.path.toLowerCase() })
            || ext === 'pdf'
          )
        ) {
          createThumbnail(props.fsId, props.path).then((val) => {
            if (val) {
              entityStats.value!.thumbnail = val;
            }
          });
        }
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div :class="$style.fsEntityInfo">
    <div
      :class="$style.header"
      @click="emits('close')"
    >
      <span :title="entityStats?.name">
        {{ entityStats?.name }}
      </span>

      <ui3n-button
        type="icon"
        size="small"
        color="transparent"
        icon="vertical-align-top"
        icon-color="var(--color-icon-control-primary-default)"
      />
    </div>

    <div :class="$style.iconBlock">
      <ui3n-icon
        v-if="entityStats?.favoriteId"
        icon="round-bookmark"
        width="16"
        height="16"
        color="var(--color-icon-table-accent-selected)"
        :class="$style.favorite"
      />

      <div
        :class="$style.iconWrapper"
        :style="iconStyle"
      >
        <ui3n-icon
          v-if="!entityStats?.thumbnail"
          :icon="entityStats?.type === 'folder' ? 'round-folder' : 'round-subject'"
          width="100"
          height="100"
          color="var(--color-icon-table-secondary-default)"
        />
      </div>
    </div>

    <div :class="$style.row">
      <span>{{ $tr('fs.entity.info.type') }}</span>
      <div>{{ entityType }}</div>
    </div>

    <div :class="$style.row">
      <span>{{ $tr('fs.entity.info.path') }}</span>
      <div>{{ entityPath }}</div>
    </div>

    <div :class="$style.row">
      <span>{{ $tr('fs.entity.info.size') }}</span>
      <div>{{ entitySize }}</div>
    </div>

    <div :class="$style.row">
      <span>{{ $tr('fs.entity.info.date') }}</span>
      <div>{{ entityDate }}</div>
    </div>

    <div :class="$style.row">
      <span>{{ $tr('fs.entity.info.changes') }}</span>
      <div>{{ entityChanges }}</div>
    </div>

    <div :class="$style.row">
      <span>{{ $tr('fs.entity.info.tags') }}</span>
      <div>
        <Ui3nChip
          v-for="tag in entityTags"
          :key="tag"
          :round="false"
          height="14"
          text-size="9"
          color="'var(--color-bg-control-secondary-default)'"
          text-color="var(--color-text-control-primary-default)"
        >
          {{ tag }}
        </Ui3nChip>
      </div>
    </div>

    <div
      v-if="isLoading"
      :class="$style.loader"
    >
      <ui3n-progress-circular
        indeterminate
        size="80"
      />
    </div>
  </div>
</template>

<style lang="scss" module>
  @use '../../../assets/styles/mixins' as mixins;

  .fsEntityInfo {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .header {
    display: flex;
    width: 100%;
    height: 36px;
    padding: 0 var(--spacing-m);
    justify-content: space-between;
    align-items: center;
    column-gap: var(--spacing-s);
    border-bottom: 1px solid var(--color-border-block-primary-default);
    font-size: var(--font-14);
    font-weight: 600;
    color: var(--color-text-table-primary-default);

    span {
      display: block;
      @include mixins.text-overflow-ellipsis();
    }

    button {
      transform-origin: center;
      transform: rotate(90deg);
    }
  }

  .iconBlock {
    position: relative;
    width: 100%;
    padding: var(--spacing-ml) 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .iconWrapper {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--spacing-m);
    border: 1px solid var(--color-border-block-primary-default);
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  .favorite {
    position: absolute;
    top: var(--spacing-m);
    right: var(--spacing-m);
  }

  .row {
    display: flex;
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-m);
    justify-content: flex-start;
    align-items: flex-start;
    column-gap: var(--spacing-s);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-12);
    line-height: var(--font-16);

    span {
      display: block;
      position: relative;
      width: 64px;
      min-width: 64px;
      font-weight: 600;
      color: var(--color-text-table-secondary-default);
    }

    div {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: var(--spacing-xs);
      align-items: center;
      font-weight: 400;
      color: var(--color-text-table-primary-default);
    }
  }

  .loader {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
