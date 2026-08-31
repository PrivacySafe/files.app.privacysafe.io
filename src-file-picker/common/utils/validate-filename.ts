/**
 * Validates a name intended for use as a single file/folder name...not
 * a path. Used by both the save-filename field (usePickerState.ts) and
 * the collision-rename dialog (file-collision-dialog.vue), which can't
 * share a composable directly since it renders outside the picker's
 * provide/inject tree.
 */
export function isValidFileName(name: string): boolean {
  const trimmed = name.trim();

  if (!trimmed) {
    return false;
  }

  if (/[\\/]/.test(trimmed)) {
    return false;
  }

  return true;
}
