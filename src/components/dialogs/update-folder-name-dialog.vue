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
import { I18N_KEY } from '@v1nt1248/3nclient-lib/plugins';
import { Ui3nInput } from '@v1nt1248/3nclient-lib';

const props = defineProps<{
  name: string;
}>();
const emits = defineEmits(['select', 'validate', 'close', 'confirm']);

const { $tr } = inject(I18N_KEY)!;

const inp = ref();
const data = ref({ oldName: props.name, newName: props.name });
const isValid = ref(false);

const isFolderNameValid = computed(() => inp.value?.isDirty && isValid.value);

function checkRequired(text?: unknown): boolean | string {
  return !!text || $tr('validation.text.required');
}

function checkEquality(text?: unknown): boolean | string {
  return text !== data.value.oldName || $tr('validation.text.equality');
}

function onValidUpdate(val: boolean) {
  isValid.value = val;
}

function updateByKeyboard() {
  if (data.value.newName && isFolderNameValid.value) {
    emits('select', data.value);
    emits('confirm');
  }
}

function updateFolderName() {
  emits('select', data.value);
}

watch(
  () => isFolderNameValid.value,
  (val) => {
    emits('validate', val);
  },
  { immediate: true },
);
</script>

<template>
  <div :class="$style.updateFolderName">
    <ui3n-input
      ref="inp"
      v-model="data.newName"
      :autofocus="true"
      :rules="[checkRequired, checkEquality]"
      :placeholder="$tr('update.folder.name.input.placeholder')"
      @escape="emits('close')"
      @enter="updateByKeyboard"
      @update:valid="onValidUpdate"
      @update:model-value="updateFolderName"
    />
  </div>
</template>

<style lang="scss" module>
.updateFolderName {
  position: relative;
  width: 100%;
  height: calc(var(--base-size) * 5);
  padding: var(--spacing-m) var(--spacing-m) 0 var(--spacing-m);
}
</style>
