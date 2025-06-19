<script lang="ts" setup>
  import { computed, inject } from 'vue';
  import size from 'lodash/size';
  import { I18N_KEY } from '@v1nt1248/3nclient-lib/plugins';
  import { Ui3nButton } from '@v1nt1248/3nclient-lib';
  import ConfirmationDialog from './confirmation-dialog.vue';

  const props = withDefaults(defineProps<{
    entityNames: string[];
  }>(), {
    entityNames: () => [],
  });
  const emits = defineEmits(['close', 'select', 'confirm']);

  const { $tr } = inject(I18N_KEY)!;

  const mainText = computed(() => size(props.entityNames) > 1
    ? $tr('fs.entity.restore.plural.main.text', { name: props.entityNames.join(', ') })
    : $tr('fs.entity.restore.single.main.text', { name: props.entityNames[0] })
  );
  const questionText = computed(() => size(props.entityNames) > 1
    ? $tr('fs.entity.restore.plural.question')
    : $tr('fs.entity.restore.single.question')
  );

  function processClick(action: 'keep' | 'replace') {
    emits('select', action);
    emits('confirm');
  }
</script>

<template>
  <div :class="$style.restoreFsEntitiesDialog">
    <confirmation-dialog
      :dialog-text="mainText"
      :additional-dialog-text="questionText"
    />

    <div :class="$style.dialogActions">
      <ui3n-button
        type="secondary"
        @click.stop.prevent="emits('close')"
      >
        {{ $tr('dialog.cancel.button.default') }}
      </ui3n-button>

      <div :class="$style.actionsBlock">
        <ui3n-button
          type="secondary"
          @click.stop.prevent="processClick('keep')"
        >
          {{ $tr('fs.entity.restore.keep.button') }}
        </ui3n-button>

        <ui3n-button @click.stop.prevent="processClick('replace')">
          {{ $tr('fs.entity.restore.replace.button') }}
        </ui3n-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
  .restoreFsEntitiesDialog {
    position: relative;
  }

  .dialogActions {
    display: flex;
    width: 100%;
    padding: var(--spacing-m);
    justify-content: space-between;
    align-items: center;
  }

  .actionsBlock {
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: var(--spacing-s);
  }
</style>
