import type { Domain } from '../config/catalogue';
import { cloneSnapshot } from './clone';
import { CARDS } from '../config/catalogue';
import settings from '../config/rules.json';
import statuses from '../config/statuses.json';
import type { Battle, ManaEvent, CombatNotice, CastEvent, DamageEvent, HealingEvent, Effect, EquipmentModifier, Fighter, Spell, SpellId, Stats } from './model';

export const RULES = settings;
export const SPELLS: Record<SpellId, Spell> = Object.fromEntries(CARDS.map(card => [card.id, { ...card, price: card.stars, description: card.rules }]));
export const PLAYABLE_SPELLS = CARDS.filter(card => card.combat?.effects && !card.combat.blockedReason && card.mana !== null && card.castTicks !== null).map(card => card.id);
export function deckDomains(spells: SpellId[]) { return [...new Set(spells.map(id => SPELLS[id]?.domain).filter(Boolean))]; }
export function canAddSpell(spells: SpellId[], id: SpellId) { return !!SPELLS[id] && deckDomains([...spells,id]).length <= RULES.maxDomains; }
export function validateDeck(spells: SpellId[]) {
  if (!spells.length || spells.some(id => !PLAYABLE_SPELLS.includes(id))) throw new Error('Loadout contains an unavailable catalogue spell.');
  if (spells.length > RULES.slots) throw new Error('Your spellbook is full.');
  if (deckDomains(spells).length > RULES.maxDomains) throw new Error('A deck can contain spells from at most 2 domains.');
}
// Count the entire linear group, including copies before and after this card.
export function channelPower(spells: SpellId[], index: number) {
  const id=spells[index]; if(!id || !SPELLS[id]?.keywords.includes('channel')) return 1;
  let first=index,last=index;
  while(first>0 && spells[first-1]===id) first--;
  while(last+1<spells.length && spells[last+1]===id) last++;
  return last-first+1;
}
export function deriveStats(modifiers: EquipmentModifier[] = []): Stats {
  return modifiers.reduce<Stats>((s,m) => ({ health: Math.max(1,s.health+(m.health??0)), mana: Math.max(0,s.mana+(m.mana??0)) }), { health: RULES.health, mana: RULES.mana });
}
export function fighter(name: string, spells: SpellId[], modifiers: EquipmentModifier[] = []): Fighter {
  validateDeck(spells);
  const stats = deriveStats(modifiers);
  return { name, spells: [...spells], ...stats, maxHealth: stats.health, maxMana: stats.mana, shield: 0, statuses: {}, cursor: 0, reshuffleRemaining:0, casting: null };
}
export function criticalDamage(damage: number, multiplier: number = RULES.critMultiplier) { return Math.round(damage * multiplier); }
type Side = 'player' | 'bot';
const other = (side: Side): Side => side === 'player' ? 'bot' : 'player';
const statusConfig = statuses as Record<string, { kind: string; domain?: Domain; power?: number; critMultiplier?: number; critChancePerStack?: number; threshold?: number; combustDuration?: number; maxCastTicks?: number; selfDamage?: number }>;

// Pure, seeded simulation with explicit Instant, periodic, and normal phases. Replays
// carry real cast events so multi-tick and Instant spells never invent casts.
export function simulate(playerInput: Fighter, botInput: Fighter, seed = RULES.seed): Battle {
  const fighters = { player: cloneSnapshot(playerInput), bot: cloneSnapshot(botInput) };
  for (const f of Object.values(fighters)) validateDeck(f.spells);
  let rng = seed >>> 0;
  const random = () => { rng = (Math.imul(rng,1664525)+1013904223) >>> 0; return rng / 4294967296; };
  const frames: Battle['frames'] = [];
  let events: CastEvent[] = [], messages: string[] = [];
  let notices:CombatNotice[]=[];
  const notify=(f:Fighter,status:string,text:string)=>notices.push({side:f===fighters.player?'player':'bot',status,text});
  let damageEvents:DamageEvent[]=[];
  let healingEvents:HealingEvent[]=[];
  let manaEvents:ManaEvent[]=[];
  let tickStart:Battle['frames'][number]|undefined;
  const snapshot = (tick: number) => frames.push({ tick, tickStart, manaEvents:cloneSnapshot(manaEvents), notices:cloneSnapshot(notices), player: cloneSnapshot(fighters.player), bot: cloneSnapshot(fighters.bot), messages: [...messages], events: cloneSnapshot(events), damageEvents:cloneSnapshot(damageEvents), healingEvents:cloneSnapshot(healingEvents) });
  messages = ['Both spell orders are locked.']; snapshot(0);
  const applyStatus = (f: Fighter, id: string, amount: number) => {
    const previous=f.statuses[id]??0;f.statuses[id]=previous+amount;
    const threshold=statusConfig.hotstreak.threshold!;
    if(id==='hotstreak' && previous<threshold && f.statuses[id]>=threshold) {
      f.statuses.combust=(f.statuses.combust??0)+statusConfig.hotstreak.combustDuration!;
      messages.push(f.name+' gains 3 Combust.'); notify(f,'combust','Combust! Casts ≤1T · 5 HP per cast');
    }
  };
  const restore = (f: Fighter, amount: number, kind:ManaEvent['kind']='effect') => { const before=f.mana;f.mana = Math.min(f.maxMana,Math.max(0,f.mana+amount));if(f.mana!==before)manaEvents.push({side:f===fighters.player?'player':'bot',amount:f.mana-before,kind}); };
  const advanceDeck=(f:Fighter)=>{f.cursor++;if(f.cursor===f.spells.length){f.cursor=0;f.reshuffleRemaining=RULES.reshuffleTicks;messages.push(`${f.name} reshuffles for ${RULES.reshuffleTicks} ticks.`);}};
  const heal = (f: Fighter, amount: number, kind:HealingEvent['kind']='heal') => { const before=f.health; f.health = Math.min(f.maxHealth,f.health+Math.max(0,amount)); const restored=f.health-before; if(restored>0)healingEvents.push({side:f===fighters.player?'player':'bot',amount:restored,kind}); };
  const takeDamage = (f: Fighter, amount: number) => {
    if (f.statuses.guard > 0) { if(amount>0)notify(f,'guard',`Guard blocked ${amount} damage`); return; }
    f.health=Math.max(0,f.health-Math.max(0,amount));
    if(f.health===0 && f.statuses.phoenix>0) {
      f.health=Math.max(1,Math.floor(f.maxHealth/2)); restore(f,Math.floor(f.maxMana/2)-f.mana,'rebirth');
      messages.push(f.name+' is reborn through Phoenix.'); notify(f,'phoenix','Phoenix! Reborn at half health and mana');
    }
  };
  const alive = () => fighters.player.health > 0 && fighters.bot.health > 0;
  const damageMultiplier = (f: Fighter, domain: string, periodic = false) => (f.statuses.fury ? 1+(statusConfig.fury.power??0)/100 : 1) * (f.statuses.rain && domain === 'water' ? 1+(statusConfig.rain.power??0)/100 : 1) * (periodic && f.statuses['star-empowerment'] ? 1+(statusConfig['star-empowerment'].power??0)/100 : 1);
  type Ready = { side: Side; event: CastEvent; tidecaller: boolean };
  const sides = ['player','bot'] as const;
  const resolveCasts = (ready: Ready[]) => {
      const damage={player:0,bot:0}, manaChange={player:0,bot:0};
      const hits:DamageEvent[]=[];
      const addHit=(side:Side,amount:number,critical=false,domain?:Domain)=>{damage[side]+=amount;if(amount>0)hits.push({side,amount,critical,kind:'hit',domain});};
      const combustActive={player:!!fighters.player.statuses.combust,bot:!!fighters.bot.statuses.combust};
      const manaBefore={player:fighters.player.mana,bot:fighters.bot.mana};
      // Snapshot critical conditions before either simultaneous spell cleanses or
      // changes effects; neither side gets priority from iteration order.
      for(const {side,event} of ready) {
        const effects=SPELLS[event.spell].combat!.effects!;
        const forced=effects.some(e=>e.kind==='damage' && e.critWhen?.every(id=>fighters[other(side)].statuses[id]>0));
        event.details=[];
        if(forced){const ids=effects.flatMap(e=>e.critWhen??[]);event.details.push(`Guaranteed critical: ${ids.join(' + ')} on target.`);for(const id of ids)notify(fighters[other(side)],id,`${SPELLS[event.spell].name}: guaranteed critical`);}
        event.critical=forced || (effects.some(e=>e.kind==='damage'||e.kind==='bothDamage') && random()<Math.min(1,RULES.baseCritChance+(fighters[side].statuses.hotstreak??0)*statusConfig.hotstreak.critChancePerStack!));
      }
      // Resolve non-damage effects before applying simultaneous damage.
      for(const {side,event,tidecaller} of ready) {
        const f=fighters[side], enemy=fighters[other(side)], spell=SPELLS[event.spell];
        const effects=spell.combat!.effects!;
        const repeat=(tidecaller || spell.keywords.includes('tidecaller')) && f.statuses.tide && random()<(statusConfig.tide.power??0)/100 ? 2 : 1;
        event.repeats=repeat;
        event.critMultiplier=event.critical?(f.statuses.overheat?statusConfig.overheat.critMultiplier:RULES.critMultiplier):undefined;
        if(event.critical)event.details!.push(`Critical multiplier: ${Math.round((event.critMultiplier??1.5)*100)}%${f.statuses.overheat?' (Overheat)':''}.`);
        if(event.critical&&f.statuses.overheat)notify(f,'overheat','Overheat critical · 200% damage');
        if(repeat===2)notify(f,'tide','Tidecaller! Spell triggers twice');
        if(combustActive[side])event.details!.push('Combust: cast capped at 1T; 5 self-damage.');
        if(combustActive[side]) addHit(side,statusConfig.combust.selfDamage!,false,'fire');
        for(let r=0;r<repeat;r++) for(const effect of effects) {
          const target=effect.target==='enemy'?enemy:f;
          const value=(effect.amount??0)*(effect.perChannel?channelPower(f.spells,event.index):1);
          if(effect.kind==='damage') {
            const amount=value*(effect.perStatus ? (f.statuses[effect.perStatus]??0) : 1);
            const scaled=Math.round(amount*damageMultiplier(f,spell.domain));
            event.details!.push(`Damage: ${amount} base × ${damageMultiplier(f,spell.domain).toFixed(2)} buffs${f.statuses.fury?' (Fury)':''}${f.statuses.rain&&spell.domain==='water'?' (Rain)':''}${event.critical?` × ${event.critMultiplier} critical`: ''} = ${event.critical?criticalDamage(scaled,event.critMultiplier):scaled} before Guard.`);
            addHit(other(side),event.critical?criticalDamage(scaled,f.statuses.overheat ? statusConfig.overheat.critMultiplier : RULES.critMultiplier):scaled,event.critical,spell.domain);
          } else if(effect.kind==='selfDamage') addHit(side,value,false,spell.domain);
          else if(effect.kind==='loseCurrentHealth') { const amount=Math.floor(f.health*value); f.health-=amount;event.details!.push(`Health cost: ${amount} (half current health).`);if(amount>0)damageEvents.push({side,amount,critical:false,kind:'cost',domain:spell.domain}); }
          else if(effect.kind==='bothDamage') { const scaled=Math.round(value*damageMultiplier(f,spell.domain)); const amount=event.critical?criticalDamage(scaled,f.statuses.overheat?statusConfig.overheat.critMultiplier:RULES.critMultiplier):scaled; event.details!.push(`Both fighters: ${value} base × ${damageMultiplier(f,spell.domain).toFixed(2)} buffs${event.critical?` × ${event.critMultiplier} critical`:''} = ${amount} damage each before Guard.`); addHit('player',amount,event.critical,spell.domain); addHit('bot',amount,event.critical,spell.domain); }
          else if(effect.kind==='heal') {const before=target.health;heal(target,value);event.details!.push(`Heal ${target===f?'self':'opponent'}: ${target.health-before} restored (${value} before health cap).`);}
          else if(effect.kind==='mana') {manaChange[effect.target==='enemy'?other(side):side]+=value;event.details!.push(`${target.name}: restore ${value} mana, capped at maximum.`);}
          else if(effect.kind==='bothMana') { manaChange.player+=value; manaChange.bot+=value; }
          else if(effect.kind==='status') {applyStatus(target,effect.status!,value);event.details!.push(`${target.name}: +${value} ${effect.status} duration.`);}
          else if(effect.kind==='stealMana') { const targetSide=other(side); const amount=Math.min(Math.max(0,manaBefore[targetSide]+Math.min(0,manaChange[targetSide])),value); manaChange[targetSide]-=amount; manaChange[side]+=amount; }
          else if(effect.kind==='cleanse') {
            const ids=Object.keys(f.statuses).filter(id=>statusConfig[id]?.kind==='dot'||id==='slowness');
            if(ids.length) delete f.statuses[ids[Math.floor(random()*ids.length)]];
          }
        }
        messages.push(`${f.name} casts ${spell.name}${event.critical?' (critical)':''}${repeat===2?' twice':''}.`);
      }
      damageEvents.push(...hits.filter(hit=>!fighters[hit.side].statuses.guard));
      for(const side of ['player','bot'] as const) { restore(fighters[side],manaChange[side]); takeDamage(fighters[side],damage[side]); }

  };
  const durationFor = (f:Fighter) => {
    let duration=f.statuses['next-instant']?0:SPELLS[f.spells[f.cursor]].castTicks!;
    if(f.statuses.slowness) duration+=statusConfig.slowness.power??1;
    return duration;
  };
  const age = (matches:(kind:string)=>boolean) => {
    for(const side of sides) for(const id of Object.keys(fighters[side].statuses)) {
      const f=fighters[side];
      if(matches(statusConfig[id]?.kind??'buff') && --f.statuses[id]<=0) delete f.statuses[id];
    }
  };
  for (let tick=1; tick<=RULES.maxTicks && alive(); tick++) {
    tickStart=undefined; events=[]; messages=[]; notices=[]; damageEvents=[]; healingEvents=[]; manaEvents=[];
    const spent = {player:false,bot:false};
    for(const side of sides) {
      const f=fighters[side];delete f.instantThisTick;
      if((f.reshuffleRemaining??0)>0) {spent[side]=true;f.reshuffleRemaining!--;}
    }
    const prepare = (instant:boolean) => {
      const prepared:Side[]=[];
      for(const side of sides) {
        const f=fighters[side];
        if(spent[side] || (instant && (f.casting ? f.casting.remaining>0 : durationFor(f)>0))) continue;
        spent[side]=true;
        if(!f.casting) {
          const spell=SPELLS[f.spells[f.cursor]],index=f.cursor;
          const cost=spell.mana==='half'?Math.floor(f.mana/2):spell.mana!;
          if(cost>f.mana) {
            events.push({side,spell:spell.id,index,status:'skipped',mana:0,critical:false});
            messages.push(f.name+' skips '+spell.name+': insufficient mana.');advanceDeck(f);continue;
          }
          restore(f,-cost,'cost');
          const duration=durationFor(f),tidecaller=!!f.statuses['tidal-echo'];
          delete f.statuses['next-instant'];delete f.statuses.slowness;delete f.statuses['tidal-echo'];
          f.casting={spell:spell.id,index,remaining:duration,totalTicks:duration,mana:cost,tidecaller};
        }
        prepared.push(side);
      }
      return prepared;
    };
    const collect = (prepared:Side[],instant:boolean) => {
      const ready:Ready[]=[];
      for(const side of prepared) {
        const f=fighters[side],cast=f.casting!;
        if(f.statuses.combust)cast.remaining=Math.min(cast.remaining,statusConfig.combust.maxCastTicks!);
        if(cast.remaining>0)cast.remaining--;
        if(cast.remaining>0)continue;
        const event:CastEvent={side,spell:cast.spell,index:cast.index,status:'cast',mana:cast.mana,critical:false};
        ready.push({side,event,tidecaller:cast.tidecaller});events.push(event);
        if(instant)f.instantThisTick=cast.spell;
        f.casting=null;advanceDeck(f);
      }
      return ready;
    };
    resolveCasts(collect(prepare(true),true));
    // Early spells can use the last stack and apply effects before periodic resolution.
    if(alive()) {
      const damage={player:0,bot:0};
      for(const side of sides) for(const id of Object.keys(fighters[side].statuses)) {
        const def=statusConfig[id];if(def?.kind!=='dot')continue;
        const amount=Math.round((def.power??0)*damageMultiplier(fighters[other(side)],def.domain??'nature',true));
        damage[side]+=amount;
        if(amount>0&&!fighters[side].statuses.guard)damageEvents.push({side,amount,critical:false,kind:'dot',domain:def.domain});
      }
      for(const side of sides)takeDamage(fighters[side],damage[side]);
      // Lethal DoTs end combat before HoTs can rescue a defeated fighter.
      if(alive()) {
        age(kind=>kind==='dot');
        for(const side of sides) for(const id of Object.keys(fighters[side].statuses)) {
          const def=statusConfig[id];if(def?.kind==='hot')heal(fighters[side],def.power??0,'hot');
        }
        age(kind=>kind==='hot');
        // Reactive buffs/debuffs operate while present, then expire before normal casts.
        age(kind=>kind!=='dot'&&kind!=='hot');
      }
    }
    // Pay and queue normal casts before the replay starts animating this tick.
    const normal=alive()?prepare(false):[];
    tickStart={tick,player:cloneSnapshot(fighters.player),bot:cloneSnapshot(fighters.bot),events:cloneSnapshot(events),messages:[...messages],damageEvents:cloneSnapshot(damageEvents),healingEvents:cloneSnapshot(healingEvents),manaEvents:cloneSnapshot(manaEvents),notices:cloneSnapshot(notices),presentationPhase:'start'};
    if(alive())resolveCasts(collect(normal,false));
    snapshot(tick);
  }
  const {player,bot}=fighters;
  return { frames, outcome: player.health===bot.health?'draw':player.health>bot.health?'victory':'defeat', endReason: alive()?'timeout':'knockout' };
}
