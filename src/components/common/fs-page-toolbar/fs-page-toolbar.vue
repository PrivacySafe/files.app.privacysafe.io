<!--
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
-->
<script lang="ts" setup>
  import { computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import isEmpty from 'lodash/isEmpty';
  import size from 'lodash/size';
  import { Ui3nBreadcrumb, Ui3nBreadcrumbs } from '@v1nt1248/3nclient-lib';
  import type { FsPathObject, FsPageToolbarProps, FsPageToolbarEmits, FsPageToolbarSlots } from './types';

  const props = withDefaults(defineProps<FsPageToolbarProps>(), {
    basePath: () => ({ fullPath: '', title: 'Home' }),
    isSplitMode: false,
    activeWindow: 'left',
  });
  const emits = defineEmits<FsPageToolbarEmits>();
  defineSlots<FsPageToolbarSlots>();

  const route = useRoute();

  const currentProcessedPaths = computed(() => {
    const { path = '', path2 = '' } = route.query as { path?: string; path2?: string };
    return {
      first: decodeURI(path),
      second: decodeURI(path2),
    };
  });

  const arrayOfProcessedPath = computed(() => {
    const path = !props.isSplitMode || (props.isSplitMode && props.activeWindow === 'left')
      ? currentProcessedPaths.value.first
      : currentProcessedPaths.value.second;

    if (isEmpty(path)) {
      return [{
        fullPath: '',
        title: props.basePath.title,
      }];
    }

    const res = path.split('/').reduce((res, item, index) => {
      const val = {
        fullPath: index === 0 ? item : `${res[index - 1].fullPath}/${item}`,
        title: item,
      };
      res.push(val);
      return res;
    }, [] as FsPathObject[]);

    res.unshift({
      fullPath: '',
      title: props.basePath.title,
    });
    return res;
  });

  function isBreadcrumbActive(index: number): boolean {
    return index !== size(arrayOfProcessedPath.value) - 1;
  }

  function go(item: FsPathObject) {
    emits('go', item.fullPath);
  }

  watch(
    () => currentProcessedPaths.value,
    () => emits('change:paths', currentProcessedPaths.value),
    { immediate: true },
  );
</script>

<template>
  <div :class="$style.fsPageToolbar">
    <ui3n-breadcrumbs>
      <ui3n-breadcrumb
        v-for="(item, index) in arrayOfProcessedPath"
        :key="item.fullPath"
        :is-active="isBreadcrumbActive(index)"
        v-on="isBreadcrumbActive(index) ? { click: () => go(item) } : {}"
      >
        {{ item.title }}
      </ui3n-breadcrumb>
    </ui3n-breadcrumbs>

    <div :class="$style.fsPageToolbarActions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" module>
  .fsPageToolbar {
    --fs-page-toolbar-height: calc(var(--spacing-l) * 2);
    --breadcrumb-inactive-color: var(--color-text-control-primary-default);
    --breadcrumb-active-color: var(--color-text-control-accent-default);
    --breadcrumb-separator-font-size: var(--font-18);

    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: var(--spacing-m);
    width: 100%;
    height: var(--header-height);
    padding: 0 var(--spacing-m);
    border-bottom: 1px solid var(--color-border-block-primary-default);
  }

  .fsPageToolbarActions {
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-m);
  }
</style>
