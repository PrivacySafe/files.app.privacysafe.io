<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { I18N_KEY, I18nPlugin } from '@v1nt1248/3nclient-lib/plugins';
import { Ui3nInput } from '@v1nt1248/3nclient-lib';

const props = defineProps<{
  name: string;
}>();
const emits = defineEmits(['select', 'validate', 'close', 'confirm']);

const { $tr } = inject<I18nPlugin>(I18N_KEY)!;

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
