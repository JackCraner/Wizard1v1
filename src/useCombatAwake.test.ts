import { beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  effect: undefined as undefined | (() => void | (() => void)),
  change: undefined as undefined | (() => void),
  activate: vi.fn<() => Promise<void>>(),
  deactivate: vi.fn<() => Promise<void>>(),
  available: vi.fn<() => Promise<boolean>>(),
  state: { currentState: 'active' },
  remove: vi.fn(),
}));
vi.mock('react', () => ({ useId: () => 'test', useEffect: (fn: () => void) => { mock.effect = fn; } }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' }, AppState: {
  get currentState() { return mock.state.currentState; },
  addEventListener: (_event: string, fn: () => void) => { mock.change = fn; return { remove: mock.remove }; },
} }));
vi.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: mock.activate, deactivateKeepAwake: mock.deactivate, isAvailableAsync: mock.available }));
import { useCombatAwake } from './useCombatAwake';

beforeEach(() => {
  vi.clearAllMocks();
  mock.state.currentState = 'active';
  mock.activate.mockResolvedValue(); mock.deactivate.mockResolvedValue(); mock.available.mockResolvedValue(true);
});
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function mount(enabled = true) { useCombatAwake(enabled); return mock.effect?.(); }

it('holds a lock during combat and releases it on leaving', async () => {
  const cleanup = mount(); await settle();
  expect(mock.activate).toHaveBeenCalledTimes(1);
  cleanup?.(); await settle();
  expect(mock.deactivate.mock.calls).toEqual(mock.activate.mock.calls);
  expect(mock.remove).toHaveBeenCalledOnce();
});
it('does not acquire outside combat or on unsupported platforms', async () => {
  mount(false); await settle(); expect(mock.activate).not.toHaveBeenCalled();
  mock.available.mockResolvedValue(false); const cleanup = mount(); await settle();
  expect(mock.activate).not.toHaveBeenCalled(); cleanup?.();
});
it('reacquires after returning from the background and tolerates denial', async () => {
  const cleanup = mount(); await settle();
  mock.state.currentState = 'background'; mock.change?.(); await settle();
  expect(mock.deactivate).toHaveBeenCalledOnce();
  mock.state.currentState = 'active'; mock.change?.(); await settle();
  expect(mock.activate).toHaveBeenCalledTimes(2);
  cleanup?.(); await settle();
  mock.activate.mockRejectedValueOnce(new Error('Denied'));
  const deniedCleanup = mount(); await settle(); deniedCleanup?.();
});
it('releases late requests without releasing a newer combat lock', async () => {
  let resolve!: () => void;
  mock.activate.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
  const first = mount(); await settle(); first?.();
  const second = mount(); await settle();
  resolve(); await settle();
  expect(mock.activate.mock.calls[0]).not.toEqual(mock.activate.mock.calls[1]);
  expect(mock.deactivate.mock.calls).toEqual([mock.activate.mock.calls[0]]);
  second?.(); await settle();
  expect(mock.deactivate).toHaveBeenCalledTimes(2);
});
