import type { DialogRequestState, DialogResult } from '@picker/common/types';
import { closeAfterResolve } from '@picker/common/dialog-capabilities/close-after-resolve';

/**
 * Single place that settles the picker's capability Promise and closes
 * the window. Guards against:
 *  - resolve() itself throwing (e.g. RPC transport failure serializing
 *    the result)...caught so it can't leave the window stuck open.
 *  - resolve() being called twice...nulled out immediately so a second
 *    call (from any code path) is a safe no-op instead of a duplicate
 *    settle attempt.
 *
 * Used by both file-picker-dialog.vue (normal confirm/cancel/error flows)
 * and main.ts's init-failure catch block, so there's one implementation
 * instead of two copies drifting apart.
 */
export function settleDialog(dialogRequest: DialogRequestState, result: DialogResult) {
  const resolve = dialogRequest.resolve;
  dialogRequest.resolve = null;

  try {
    resolve?.(result);
  } catch (err) {
    console.error('🔥 ERROR RESOLVING DIALOG REQUEST. ', err);
    // Nothing more we can do here — if resolve() itself is broken, the
    // capability Promise may be left unsettled on the caller's side.
    // We still guarantee the picker window closes rather than hanging.
  }

  closeAfterResolve();
}
