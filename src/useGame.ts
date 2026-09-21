import { COMBAT_TICK_MS, PLAYBACK_CONFIG, nextCombatBeat, type CombatBeat } from './game/playback';
import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import type { Command, Difficulty, GameGateway, Session } from './game/model';

export function useGame(gateway: GameGateway) {
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<'menu' | 'game' | 'guide'>('menu');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [frame, setFrameState] = useState(0);
  const [beat,setBeat]=useState<CombatBeat>('cast');
  function setFrame(value:number|((previous:number)=>number)){setFrameState(value);setBeat(value===0?'cast':'hold');}
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_CONFIG.defaultSpeed);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const locked = useRef(false);
  const playback = useRef({key:'',remaining:1});
  const battle = session?.battle;
  const finished = !!battle && frame === battle.frames.length - 1;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'menu') return false;
      setScreen('menu');
      return true;
    });
    return () => subscription.remove();
  }, [screen]);

  useEffect(() => {
    const key=`${session?.id}-${session?.round}-${frame}-${beat}`;
    if(playback.current.key!==key)playback.current={key,remaining:1};
    if (paused || !active || screen !== 'game' || !battle || finished) return;
    if(beat==='hold'){setBeat('cast');return;}
    const started=Date.now(),duration=COMBAT_TICK_MS/speed;
    const timer = setTimeout(() => {const next=nextCombatBeat(frame,beat,battle.frames.length-1);setFrameState(next.frame);setBeat(next.beat);}, playback.current.remaining*duration);
    return () => {clearTimeout(timer);playback.current.remaining=Math.max(0,playback.current.remaining-(Date.now()-started)/duration);};
  }, [paused, active, screen, battle, finished, frame, beat, speed]);

  async function request(operation: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try { await operation(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.'); }
    finally { locked.current = false; setBusy(false); }
  }

  function start(difficulty?:Difficulty) {
    return request(async () => {
      setSession(await gateway.start(difficulty));
      setFrame(0); setPaused(false);
      setScreen('game');
    });
  }

  function act(command: Command) {
    return request(async () => {
      if (!session) return;
      const next = await gateway.execute(session.id, session.revision, command);
      if (command.type === 'fight' || command.type === 'next') {setFrame(0);setPaused(false);}
      setSession(next);
    });
  }

  function step(delta:number) {setPaused(true);setFrame(value=>Math.max(0,Math.min((battle?.frames.length??1)-1,value+delta)));}
  return { beat, paused, setPaused, step, active, session, screen, setScreen, busy, error, frame, setFrame, speed, setSpeed, battle, finished, start, act };
}
