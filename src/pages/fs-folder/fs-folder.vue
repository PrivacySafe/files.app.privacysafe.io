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
  import TableView from '@/components/common/table-view/table-view.vue';
  import TileView from '@/components/common/tile-view/tile-view.vue';

  defineProps<{
    window: 1 | 2;
    tileView?: boolean;
  }>();
</script>

<template>
  <div :class="$style.fsFolder">
    <tile-view
      v-if="tileView"
      :window="window"
    />

    <table-view
      v-else
      :window="window"
    />
  </div>
</template>

<style lang="scss" module>
  .fsFolder {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
