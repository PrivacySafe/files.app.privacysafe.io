import { reactive, type InjectionKey } from 'vue';
import type { DialogRequestState, DialogMode, DialogResultMap } from '@picker/common/types';

/**
 * Injection key for the shared {@link DialogRequestState} instance.
 * Provided once in `main.ts` (`app.provide(DIALOG_REQUEST_KEY, dialogRequest)`)
 * and injected by any component or composable that needs to read the
 * active dialog's config (mode, title, filters...) or call `resolve()`.
 */
export const DIALOG_REQUEST_KEY: InjectionKey<DialogRequestState> = Symbol('dialog-request');

/**
 * Creates the reactive state bridging a fileDialog capability call
 * (e.g. `openFileDialog`) and the picker UI. A capability handler sets
 * `mode`/`title`/`filters`/etc. and stores its `resolve`; the UI reads
 * those to render itself, then calls `resolve()` on confirm/cancel to
 * settle the original capability Promise.
 *
 * One instance is created per picker window and lives for its whole
 * lifetime (`forOneConnectionOnly`), shared via `DIALOG_REQUEST_KEY`.
 */
export function createDialogRequestState(): DialogRequestState {
  return reactive({
    mode: null,
    title: '',
    btnLabel: '',
    multiSelections: false,
    filters: undefined,
    defaultPath: undefined,
    resolve: null,
  });
}

interface DialogRequestOpts {
  title: string;
  btnLabel: string;
  multiSelections?: boolean;
  filters?: web3n.shell.files.FileTypeFilter[];
  defaultPath?: string;
}

/**
 * Single place where a mode-specific 'resolve' is narrowed into
 * DialogRequestState's wider DialogResult union. 'M' pins resolve's
 * parameter type to match 'mode' at each call site, so the cast below
 * is locally provable...callers (open-file-handler.ts etc.) need no
 * cast of their own.
 */
export function beginDialogRequest<M extends DialogMode>(
  dialogRequest: DialogRequestState,
  mode: M,
  resolve: (result: DialogResultMap[M] | undefined) => void,
  opts: DialogRequestOpts,
) {
  dialogRequest.mode = mode;
  dialogRequest.title = opts.title;
  dialogRequest.btnLabel = opts.btnLabel;
  dialogRequest.multiSelections = opts.multiSelections ?? false;
  dialogRequest.filters = opts.filters;
  dialogRequest.defaultPath = opts.defaultPath;
  dialogRequest.resolve = resolve as DialogRequestState['resolve'];
}
