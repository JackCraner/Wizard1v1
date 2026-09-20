/** Domain snapshots contain only JSON values; works on Hermes, web, and Node. */
export function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
