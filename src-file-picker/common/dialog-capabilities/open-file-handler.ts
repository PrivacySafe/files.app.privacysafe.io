import type { DialogRequestState } from '@picker/common/types';
import { beginDialogRequest } from '@picker/common/capability-bridge/dialog-request-bridge';
/**
 * Factory for the openFileDialog capability handler.
 * Mutates the shared dialogRequest state.
 */
export function createOpenFileHandler(dialogRequest: DialogRequestState): web3n.shell.files.OpenFileDialog {
  return (title, btnLabel, multiSelections, filters) =>
    new Promise<web3n.files.ReadonlyFile[] | undefined>(resolve => {
      beginDialogRequest(dialogRequest, 'openFile', resolve, { title, btnLabel, multiSelections, filters });
    });
}
