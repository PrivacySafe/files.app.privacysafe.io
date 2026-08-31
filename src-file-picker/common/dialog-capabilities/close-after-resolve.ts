import { sleep } from '@shared/utils/processes/sleep';

/**
 * Closes the picker window on the next tick, not the same tick as
 * dialogRequest.resolve(). Gives the RPC transport a chance to finish
 * sending the resolved value across the forOneConnectionOnly channel
 * before the window tears down.
 */
export async function closeAfterResolve(): Promise<void> {
  await sleep(0);
  w3n.closeSelf!();
}
