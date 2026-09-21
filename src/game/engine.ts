import {EQUIPMENT,validateInventory} from './equipment';
import {equipmentRuntime} from './equipmentRuntime';
import { cardAt, deckXp, validateXp } from './upgrades';
import type { Domain } from '../config/catalogue';
import { cloneSnapshot } from './clone';
import { CARDS } from '../config/catalogue';
import settings from '../config/rules.json';
import holy from '../config/holy.json';
import statuses from '../config/statuses.json';
import type { Battle, ManaEvent, CombatNotice, CastEvent, DamageEvent, HealingEvent, Effect, EquipmentModifier, Fighter, Spell, SpellId, Stats } from './model';

export const RULES = settings;
export const SPELLS: Record<SpellId, Spell> = Object.fromEntries(CARDS.map(card => [card.id, { ...card, price: card.stars, description: card.rules }]));
export const PLAYABLE_SPELLS = CARDS.filter(card => card.combat?.effects && !card.combat.blockedReason && card.mana !== null && card.castTicks !== null).map(card => card.id);
export function deckDomains(spells: SpellId[]) { return [...new Set(spells.map(id => SPELLS[id]?.domain).filter(Boolean))]; }
export function canOfferSpell(spells:SpellId[],id:SpellId) {return !!SPELLS[id] && deckDomains([...spells,id]).length<=RULES.maxDomains;}
export function spellAddReason(spells:SpellId[],id:SpellId):string|null {
 if(!canOfferSpell(spells,id))return 'A deck can contain spells from at most 2 domains.';
 if(SPELLS[id].keywords.includes('unique') && spells.includes(id))return 'Unique: only one copy of this spell can be in your deck. Buy & merge to gain XP.';
 return null;
}
export function canAddSpell(spells: SpellId[], id: SpellId) {return spellAddReason(spells,id)===null;}
export function validateDeck(spells: SpellId[]) {
  if (!spells.length || spells.some(id => !PLAYABLE_SPELLS.includes(id))) throw new Error('Loadout contains an unavailable catalogue spell.');
  if (spells.some((id,i)=>SPELLS[id].keywords.includes('unique')&&spells.indexOf(id)!==i))throw new Error('Unique: only one copy of each Unique spell is allowed.');
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
  return {health:Math.max(1,RULES.health+modifiers.reduce((n,m)=>n+(m.health??0),0)),mana:Math.max(0,RULES.mana+modifiers.reduce((n,m)=>n+(m.mana??0),0))};
}
export function fighter(name: string, spells: SpellId[], modifiers: EquipmentModifier[] = [], spellXp:number[] = []): Fighter {
  validateDeck(spells);
  validateXp(spells,spellXp);
  const stats = deriveStats(modifiers);
  const inventory:Record<string,number>={};for(const m of modifiers)if(m.equipmentId&&EQUIPMENT[m.equipmentId])inventory[m.equipmentId]=(inventory[m.equipmentId]??0)+(m.stacks??1);
  validateInventory(inventory);
  return { equipment:inventory,name, spellXp:deckXp(spells,spellXp), spells: [...spells], ...stats, maxHealth: stats.health, maxMana: stats.mana, shield: 0, statuses: {}, cursor: 0, reshuffleRemaining:0, casting: null };
}
export function criticalDamage(damage: number, multiplier: number = RULES.critMultiplier) { return Math.round(damage * multiplier); }
type Side = 'player' | 'bot';
const other = (side: Side): Side => side === 'player' ? 'bot' : 'player';
const statusConfig = statuses as Record<string, { kind: string; domain?: Domain; power?: number; perStack?: boolean; critMultiplier?: number; critChancePerStack?: number; threshold?: number; combustDuration?: number; maxCastTicks?: number; selfDamage?: number; damageReduction?:number; manaPerSpell?:number; consumeOnTrigger?:number; persistent?:boolean; incomingDamageMultiplier?:number; directDamageMultiplier?:number; healingReceivedMultiplier?:number; retaliationDamage?:number; maxTriggersPerTick?:number; onOpponentSpellStart?:{stacks:number}; onDirectSpellDamageTaken?:{stacks:number} }>;

// Pure, seeded simulation with explicit Instant, periodic, and normal phases. Replays
// carry real cast events so multi-tick and Instant spells never invent casts.
export function simulate(playerInput: Fighter, botInput: Fighter, seed = RULES.seed): Battle {
  const fighters = { player: cloneSnapshot(playerInput), bot: cloneSnapshot(botInput) };
  for (const f of Object.values(fighters)) {validateDeck(f.spells);validateXp(f.spells,f.spellXp);validateInventory(f.equipment);}
  const spellAt=(f:Fighter,index:number)=>cardAt(f.spells[index],f.spellXp?.[index]);
  const interrupted=new Set<Side>();
  const pendingAdvance=new Set<Fighter>();
  const retaliationCount=new Map<Fighter,number>();
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
  let gear:ReturnType<typeof equipmentRuntime>;
  const sideOf=(f:Fighter):Side=>f===fighters.player?'player':'bot';
  const applyStatus = (f: Fighter, id: string, amount: number, source?:Fighter) => {
    if(source)amount=gear.status(source,f,id,amount);if(amount<=0)return;
    if(source){f.statusSources??={};f.statusSources[id]=sideOf(source);}
    const previous=f.statuses[id]??0;f.statuses[id]=previous+amount;
    if(id==='consecration') {
      const ticks=Math.floor(f.statuses[id]/holy.consecrationPerPenance);
      if(ticks){f.statuses[id]%=holy.consecrationPerPenance;f.penanceQueued=(f.penanceQueued??0)+ticks;notify(f,'penance','+'+ticks+'T Penance · next reshuffle');}
      if(!f.statuses[id])delete f.statuses[id];
    }
    const threshold=statusConfig.hotstreak.threshold!;
    if(id==='hotstreak' && previous<threshold && f.statuses[id]>=threshold) {
      f.statuses.combust=(f.statuses.combust??0)+statusConfig.hotstreak.combustDuration!;
      messages.push(f.name+' gains 3 Combust.'); notify(f,'combust','Combust! Casts ≤1T · 5 HP per cast');
    }
    gear?.receiveStatus(f,id);
  };
  const restore = (f: Fighter, amount: number, kind:ManaEvent['kind']='effect') => { const before=f.mana;f.mana = Math.min(f.maxMana,Math.max(0,f.mana+amount));if(f.mana!==before)manaEvents.push({side:f===fighters.player?'player':'bot',amount:f.mana-before,kind}); };
  // Advance together after all effects and damage, so neither side receives
  // a shorter Penance window just because it was iterated first.
  const advanceDeck=(f:Fighter)=>{pendingAdvance.add(f);};
  const breakOath=(f:Fighter,reason:string)=>{if(f.oath){notify(f,'oath','Oath of '+f.oath.id+' broken · '+reason);delete f.oath;}};
  const rewardOath=(f:Fighter)=>{
    const oath=f.oath;if(!oath)return;delete f.oath;if(f.health<=0)return;
    notify(f,'oath','Oath of '+oath.id+' fulfilled');
    for(const e of oath.rewards){const target=e.target==='enemy'?fighters[other(sideOf(f))]:f;
      if(e.kind==='heal')heal(target,e.amount??0,'heal',f,true,'holy');
      if(e.kind==='status')applyStatus(target,e.status!,e.amount??0,f);
    }
    gear.trigger(f,'oathComplete');
  };
  const flushDecks=()=>{
    const ended=[...pendingAdvance].filter(f=>++f.cursor===f.spells.length);pendingAdvance.clear();
    // Resolve all end-of-cycle rewards before allocating either reshuffle.
    for(const f of ended)if(f.oath&&f.oath.remaining===undefined)rewardOath(f);
    for(const f of ended){f.cursor=0;f.penanceActive=f.penanceQueued??0;f.penanceQueued=0;
      f.reshuffleRemaining=gear.reshuffle(f,RULES.reshuffleTicks)+f.penanceActive;
      messages.push(f.name+' reshuffles for '+f.reshuffleRemaining+' ticks'+(f.penanceActive?' (+'+f.penanceActive+' Penance)':'')+'.');
      if(!f.reshuffleRemaining)gear.cycle(f);
    }
  };
  const heal = (f:Fighter,amount:number,kind:HealingEvent['kind']='heal',source:Fighter=f,spellHeal=true,domain?:Domain) => {
    const before=f.health;
    let value=amount*(gear?.healPower(source,kind==='hot',domain)??1)*(gear?.healReceived(f)??1)*(f.statuses.sanctuary?statusConfig.sanctuary.healingReceivedMultiplier!:1)*(1+(f.statuses['greater-cloud-heart']?statusConfig['greater-cloud-heart'].power!:f.statuses['cloud-heart']?statusConfig['cloud-heart'].power!:0)/100);
    value=Math.max(0,Math.round(value));
    f.health=Math.min(f.maxHealth,f.health+value);const restored=f.health-before;
    if(restored>0)healingEvents.push({side:sideOf(f),amount:restored,kind});
    
  };
  const mitigated=(f:Fighter,amount:number)=>Math.round(amount*(f.statuses.veil?1-statusConfig.veil.damageReduction!:1)*['templars-oath','sanctuary','citadel'].reduce((n,id)=>n*(f.statuses[id]?statusConfig[id].incomingDamageMultiplier!:1),1));
  const takeDamage = (f: Fighter, amount: number) => {
    if (f.statuses.guard > 0) { if(amount>0)notify(f,'guard',`Guard blocked ${amount} damage`); return; }
    f.health=Math.max(0,f.health-Math.max(0,amount));
    if(f.health===0 && f.statuses.phoenix>0) {
      f.health=Math.max(1,Math.floor(f.maxHealth/2)); restore(f,Math.floor(f.maxMana/2)-f.mana,'rebirth');
      messages.push(f.name+' is reborn through Phoenix.'); notify(f,'phoenix','Phoenix! Reborn at half health and mana');
    }
  };
  type Hit=DamageEvent & {source?:Fighter;combust?:boolean;reactive?:boolean};
  const applyHits=(hits:Hit[])=>{
    const totals={player:0,bot:0};const landed:Hit[]=[];
    for(const hit of hits){const f=fighters[hit.side];if(f.statuses.guard){notify(f,'guard','Guard blocked '+hit.amount+' damage');if(hit.amount>0)gear.trigger(f,'guardBlock');continue;}
      let amount=gear.incoming(f,mitigated(f,hit.amount),{self:hit.source===f,periodic:hit.kind==='dot',combust:hit.combust,reactive:hit.reactive});
      const bypass=0;
      const absorbed=Math.min(f.shield,Math.round(amount*(1-bypass)));f.shield-=absorbed;amount-=absorbed;
      if(absorbed)notify(f,'ward','Ward absorbed '+absorbed);
      if(amount>0){totals[hit.side]+=amount;damageEvents.push({side:hit.side,amount,critical:hit.critical,kind:hit.kind,...(hit.domain?{domain:hit.domain}:{})});landed.push(hit);}
    }
    for(const side of ['player','bot'] as const)takeDamage(fighters[side],totals[side]);
    const retaliation:Hit[]=[];
    for(const hit of landed)if(!hit.reactive){const f=fighters[hit.side];gear.trigger(f,'hit',{self:hit.source===f,periodic:hit.kind==='dot'});
      if(hit.kind==='hit'&&hit.source&&hit.source!==f){
        if(hit.source.oath?.requirement==='noDamage')breakOath(hit.source,'direct damage');
        if(f.health>0&&f.statuses.citadel)applyStatus(hit.source,'consecration',statusConfig.citadel.onDirectSpellDamageTaken!.stacks,f);
        const used=retaliationCount.get(f)??0;
        if(f.health>0&&f.statuses.retribution&&used<statusConfig.retribution.maxTriggersPerTick!){
          retaliationCount.set(f,used+1);retaliation.push({side:sideOf(hit.source),amount:Math.round(statusConfig.retribution.retaliationDamage!*(f.statuses.fury?1+(statusConfig.fury.power??0)/100:1)*gear.damage(f,'holy',false,{reactive:true})*(f.statuses['templars-oath']?statusConfig['templars-oath'].directDamageMultiplier!:1)),critical:false,kind:'hit',domain:'holy',source:f,reactive:true});
        }
      }
    }
    if(retaliation.length)applyHits(retaliation);
  };
  gear=equipmentRuntime(fighters,{mana:(f,n)=>restore(f,n),heal:(f,n)=>heal(f,n,'heal',f,false),status:(f,id,n,source)=>applyStatus(f,id,n,source),damage:(f,n,source)=>applyHits([{side:sideOf(f),amount:n,critical:false,kind:'hit',source,reactive:true}]),notice:notify});
  gear.start();messages=['Both spell orders are locked.'];snapshot(0);
  const alive = () => fighters.player.health > 0 && fighters.bot.health > 0;
  const damageMultiplier = (f: Fighter, domain: string, periodic = false, itemOptions:Parameters<typeof gear.damage>[3]={}) => (f.statuses.fury ? 1+(statusConfig.fury.power??0)/100 : 1) * (f.statuses.rain && domain === 'water' ? 1+(statusConfig.rain.power??0)/100 : 1) * (periodic && f.statuses['star-empowerment'] ? 1+(statusConfig['star-empowerment'].power??0)/100 : 1) * gear.damage(f,domain,periodic,itemOptions) * (!periodic&&f.statuses['templars-oath']?statusConfig['templars-oath'].directDamageMultiplier!:1);
  type Ready = { side: Side; event: CastEvent; tidecaller: boolean; damageMultiplier?:number;instant?:boolean };
  const sides = ['player','bot'] as const;
  const resolveCasts = (ready: Ready[]) => {
      const damage={player:0,bot:0}, manaChange={player:0,bot:0};
      const hits:Hit[]=[];let source:Fighter;
      const addHit=(side:Side,amount:number,critical=false,domain?:Domain,combust=false)=>{if(amount>0)hits.push({side,amount,critical,kind:'hit',domain,source,combust});};
      const combustActive={player:!!fighters.player.statuses.combust,bot:!!fighters.bot.statuses.combust};
      const dotSnapshots={player:Object.entries(fighters.player.statuses).filter(([id])=>statusConfig[id]?.kind==='dot'),bot:Object.entries(fighters.bot.statuses).filter(([id])=>statusConfig[id]?.kind==='dot')};
      const manaBefore={player:fighters.player.mana,bot:fighters.bot.mana};
      const castingBefore={player:!!fighters.player.casting,bot:!!fighters.bot.casting};
      const oathsBefore={player:fighters.player.oath,bot:fighters.bot.oath};
      // Snapshot critical conditions before either simultaneous spell cleanses or
      // changes effects; neither side gets priority from iteration order.
      for(const {side,event} of ready) {
        const effects=spellAt(fighters[side],event.index).combat!.effects!;
        const forced=effects.some(e=>e.kind==='damage' && e.critWhen?.every(id=>fighters[other(side)].statuses[id]>0));
        event.details=[];
        if(forced){const ids=effects.flatMap(e=>e.critWhen??[]);event.details.push(`Guaranteed critical: ${ids.join(' + ')} on target.`);for(const id of ids)notify(fighters[other(side)],id,`${SPELLS[event.spell].name}: guaranteed critical`);}
        const canCrit=effects.some(e=>e.kind==='damage'||e.kind==='bothDamage');
        const stacks=fighters[side].statuses.hotstreak??0;
        const chance=Math.min(1,RULES.baseCritChance+gear.critChance(fighters[side])+stacks*statusConfig.hotstreak.critChancePerStack!);
        event.critical=forced || (canCrit && random()<chance);
        if(canCrit&&!forced)event.details.push('Crit chance at resolution: '+Math.round(chance*100)+'% ('+stacks+' Hotstreak stacks). '+(event.critical?'Critical hit.':'Normal hit.'));
      }
      // Resolve non-damage effects before applying simultaneous damage.
      for(const {side,event,tidecaller,damageMultiplier:castMultiplier=1,instant=false} of ready) {
        const f=fighters[side], enemy=fighters[other(side)], spell=spellAt(f,event.index);
        source=f;const power=gear.spellPower(f,spell);
        const effects=spell.combat!.effects!;
        const hasTidecaller=tidecaller||spell.keywords.includes('tidecaller');const eligible=!!f.statuses.tide&&hasTidecaller;
        const repeat=eligible&&random()<(statusConfig.tide.power??0)/100?2:1;
        event.repeats=repeat;
        event.critMultiplier=event.critical?((f.statuses.overheat?statusConfig.overheat.critMultiplier!:RULES.critMultiplier)):undefined;
        if(event.critical)event.details!.push(`Critical multiplier: ${Math.round((event.critMultiplier??1.5)*100)}%${f.statuses.overheat?' (Overheat)':''}.`);
        if(event.critical&&f.statuses.overheat)notify(f,'overheat','Overheat critical · 200% damage');
        const consumedTide=repeat===2?Math.min(f.statuses.tide,statusConfig.tide.consumeOnTrigger!):0;
        if(repeat===2)notify(f,'tide','Tidecaller! Spell triggers twice');
        if(castMultiplier!==1)event.details!.push('Celestial Alignment: ×'+castMultiplier+' damage for this cast.');
        if(combustActive[side])event.details!.push('Combust: cast capped at 1T; 5 self-damage.');
        if(combustActive[side]) addHit(side,statusConfig.combust.selfDamage!,false,'fire',true);
        for(let r=0;r<repeat;r++) {
          const repeatPower=1;let removedEffects=0;
          if(enemy.statuses.veil && effects.some(e=>['damage','bothDamage','stealMana','interrupt','consumeDots'].includes(e.kind)||e.target==='enemy')) manaChange[other(side)]+=gear.manaBonus(enemy,statusConfig.veil.manaPerSpell!,'water');
          const effectQueue=[...effects];
          for(let i=0;i<effectQueue.length;i++) {
          const effect=effectQueue[i];
          const target=effect.target==='enemy'?enemy:f;
          const value=(effect.amount??0)*(effect.perChannel?channelPower(f.spells,event.index):1);
          if(effect.kind==='damage') {
            const amount=value*(effect.perManaSpent?event.mana:1)*(effect.perStatus ? (f.statuses[effect.perStatus]??0) : 1);
            const scaled=Math.round(amount*damageMultiplier(f,spell.domain,false,{critical:event.critical,tidecaller:hasTidecaller,bonus:power.damageBonus})*castMultiplier*repeatPower);
            event.details!.push(`Damage: ${amount} base × ${damageMultiplier(f,spell.domain,false,{critical:event.critical,tidecaller:hasTidecaller,bonus:power.damageBonus}).toFixed(2)} buffs${f.statuses.fury?' (Fury)':''}${f.statuses.rain&&spell.domain==='water'?' (Rain)':''}${event.critical?` × ${event.critMultiplier} critical`: ''} = ${event.critical?criticalDamage(scaled,event.critMultiplier):scaled} before Guard.`);
            addHit(other(side),event.critical?criticalDamage(scaled,event.critMultiplier):scaled,event.critical,spell.domain);
          } else if(effect.kind==='selfDamage') addHit(side,value,false,spell.domain);
          else if(effect.kind==='loseCurrentHealth') { const amount=Math.floor(f.health*value); f.health-=amount;event.details!.push(`Health cost: ${amount} (half current health).`);if(amount>0)damageEvents.push({side,amount,critical:false,kind:'cost',domain:spell.domain}); }
          else if(effect.kind==='bothDamage') { const scaled=Math.round(value*damageMultiplier(f,spell.domain,false,{critical:event.critical,tidecaller:hasTidecaller,bonus:power.damageBonus})*castMultiplier*repeatPower); const amount=event.critical?criticalDamage(scaled,event.critMultiplier):scaled; event.details!.push(`Both fighters: ${value} base × ${damageMultiplier(f,spell.domain,false,{critical:event.critical,tidecaller:hasTidecaller,bonus:power.damageBonus}).toFixed(2)} buffs${event.critical?` × ${event.critMultiplier} critical`:''} = ${amount} damage each before Guard.`); addHit('player',amount,event.critical,spell.domain); addHit('bot',amount,event.critical,spell.domain); }
          else if(effect.kind==='heal') {const before=target.health;heal(target,value*repeatPower,'heal',f,true,spell.domain);event.details!.push(`Heal ${target===f?'self':'opponent'}: ${target.health-before} restored (${value} before health cap).`);}
          else if(effect.kind==='mana') {manaChange[effect.target==='enemy'?other(side):side]+=gear.manaBonus(target,value,spell.domain);event.details!.push(`${target.name}: restore ${value} mana, capped at maximum.`);}
          else if(effect.kind==='consumeDots') {
            const targetSide=effect.target==='enemy'?other(side):side;
            let total=0;
            for(const [id,stacks] of dotSnapshots[targetSide]) {
              const def=statusConfig[id];total+=Array.from({length:stacks},(_,i)=>Math.round(((def.power??0)+gear.periodicFlat(f,id))*(def.perStack?stacks-i:1)*damageMultiplier(f,def.domain??spell.domain,true,{status:id,direct:true,bonus:power.damageBonus,tidecaller:hasTidecaller}))).reduce((a,b)=>a+b,0);
              target.statuses[id]=Math.max(0,(target.statuses[id]??0)-stacks);if(!target.statuses[id])delete target.statuses[id];
            }
            
            dotSnapshots[targetSide]=[];
            const amount=Math.round(total*value*castMultiplier*repeatPower);addHit(targetSide,amount,false,spell.domain);
            event.details!.push('Consumed remaining DoTs for '+amount+' damage before Guard.');
          }
          else if(effect.kind==='manaPerDotStack') {
            const stacks=Object.entries(target.statuses).reduce((sum,[id,n])=>sum+(statusConfig[id]?.kind==='dot'?n:0),0);
            manaChange[side]+=gear.manaBonus(f,stacks*value,spell.domain);
            event.details!.push('Restore '+(stacks*value)+' mana from '+stacks+' remaining DoT stacks on '+target.name+'.');
          }
          else if(effect.kind==='multiplyHotStacks') {
            for(const id of Object.keys(target.statuses))if(statusConfig[id]?.kind==='hot')target.statuses[id]=Math.floor(target.statuses[id]*value);
            event.details!.push(target.name+': multiply remaining HoT stacks by '+value+'.');
          }
          else if(effect.kind==='bothMana') { manaChange.player+=gear.manaBonus(fighters.player,value,spell.domain); manaChange.bot+=gear.manaBonus(fighters.bot,value,spell.domain); }
          else if(effect.kind==='status') {applyStatus(target,effect.status!,value,f);event.details!.push(`${target.name}: +${value} ${effect.status} duration.`);}
          else if(effect.kind==='stealMana') { const targetSide=other(side); const amount=Math.min(Math.max(0,manaBefore[targetSide]+Math.min(0,manaChange[targetSide])),value); manaChange[targetSide]-=amount; manaChange[side]+=gear.manaBonus(f,amount,spell.domain); }
          else if(effect.kind==='enhance') {f.enhancements??={};f.enhancements[effect.status!]=value;}
          else if(effect.kind==='consumeBurn') {
            const stacks=(f.statuses.burn??0)+(enemy.statuses.burn??0);delete f.statuses.burn;delete enemy.statuses.burn;
            if(stacks){applyStatus(f,'hotstreak',stacks*value);applyStatus(f,'fury',stacks*value);}
          }
          else if(effect.kind==='interrupt') {
            let success=false;
            if(enemy.casting){
              {const cast=enemy.casting;events.push({side:other(side),spell:cast.spell,index:cast.index,xp:enemy.spellXp?.[cast.index]??0,status:'skipped',mana:cast.mana,critical:false,details:['Interrupted; mana is not refunded.']});
                enemy.casting=null;interrupted.add(other(side));advanceDeck(enemy);notify(enemy,'interrupt','Interrupted! Spell skipped');success=true;
              }
            }
            effectQueue.splice(i+1,0,...(success?effect.onSuccess??[]:effect.onFailure??[]));
            event.details!.push(success?'Interrupt succeeded.':'No spell interrupted.');
          }
          else if(effect.kind==='castingStatus'&&castingBefore[other(side)])applyStatus(target,effect.status!,value,f);
          else if(effect.kind==='healthConditional')effectQueue.splice(i+1,0,...(f.health/f.maxHealth<effect.threshold!?effect.onSuccess??[]:effect.onFailure??[]));
          else if(effect.kind==='cleanseAll'){
            const ids=Object.keys(f.statuses).filter(id=>['dot','debuff'].includes(statusConfig[id]?.kind));removedEffects=ids.length;for(const id of ids)delete f.statuses[id];
            event.details!.push('Cleansed '+removedEffects+' effects.');
          }
          else if(effect.kind==='healPerCleanse')heal(f,Math.min(effect.cap!,removedEffects*value)*repeatPower,'heal',f,true,spell.domain);
          else if(effect.kind==='oath'){
            f.oath=cloneSnapshot(effect.oath!);notify(f,'oath','Oath of '+f.oath.id+' sworn');
          }
          else if(effect.kind==='cleanse') {
            const ids=Object.keys(f.statuses).filter(id=>statusConfig[id]?.kind==='dot'||statusConfig[id]?.kind==='debuff');
            if(ids.length) delete f.statuses[ids[Math.floor(random()*ids.length)]];
          }
        }
        }
        
        gear.complete(f,spell);advanceDeck(f);
        if(consumedTide){f.statuses.tide=Math.max(0,(f.statuses.tide??0)-consumedTide);if(!f.statuses.tide)delete f.statuses.tide;}
        messages.push(`${f.name} casts ${spell.name}${event.critical?' (critical)':''}${repeat===2?' twice':''}.`);
      }
      for(const side of ['player','bot'] as const)restore(fighters[side],manaChange[side]);
      applyHits(hits);
      for(const {side} of ready){const f=fighters[side];if(f.oath&&f.oath===oathsBefore[side]&&f.oath.remaining!==undefined){if(--f.oath.remaining===0)rewardOath(f);}}
      flushDecks();
  };
  const durationFor = (f:Fighter) => {
    let duration=f.statuses['next-instant']?0:spellAt(f,f.cursor).castTicks!;
    if(f.statuses.slowness) duration+=statusConfig.slowness.power??1;
    const spell=spellAt(f,f.cursor);return gear.startCast(f,spell,spell.mana==='half'?Math.floor(f.mana/2):spell.mana!,duration).duration;
  };
  const age = (matches:(kind:string)=>boolean) => {
    for(const side of sides) for(const id of Object.keys(fighters[side].statuses)) {
      const f=fighters[side];
      if(statusConfig[id]?.persistent || id==='tide'&&f.enhancements?.maelstrom)continue;
      if(matches(statusConfig[id]?.kind??'buff') && --f.statuses[id]<=0) delete f.statuses[id];
    }
  };
  for (let tick=1; tick<=RULES.maxTicks && alive(); tick++) {
    tickStart=undefined; events=[]; messages=[]; notices=[]; damageEvents=[]; healingEvents=[]; manaEvents=[];
    interrupted.clear();retaliationCount.clear();gear.tick(tick);
    const periodicCrit={player:Math.min(1,RULES.baseCritChance+gear.critChance(fighters.player)+(fighters.player.statuses.hotstreak??0)*statusConfig.hotstreak.critChancePerStack!),bot:Math.min(1,RULES.baseCritChance+gear.critChance(fighters.bot)+(fighters.bot.statuses.hotstreak??0)*statusConfig.hotstreak.critChancePerStack!)};
    const spent = {player:false,bot:false};
    // The replay animates the whole upcoming tick, including its final reshuffle tick.
    const shuffleAtStart = {player:fighters.player.reshuffleRemaining??0,bot:fighters.bot.reshuffleRemaining??0};
    const penanceTicks=sides.filter(side=>(fighters[side].reshuffleRemaining??0)>0&&(fighters[side].reshuffleRemaining??0)<=(fighters[side].penanceActive??0));
    for(const side of sides) {
      const f=fighters[side];delete f.instantThisTick;
      if((f.reshuffleRemaining??0)>0) {spent[side]=true;f.reshuffleRemaining!--;if(!f.reshuffleRemaining){f.penanceActive=0;gear.cycle(f);}}
    }
    const prepare = (instant:boolean) => {
      const prepared:Side[]=[];
      const trapDamage={player:0,bot:0};
      for(const side of sides) {
        const f=fighters[side];
        if(interrupted.has(side) || spent[side] || (instant && (f.casting ? f.casting.remaining>0 : durationFor(f)>0))) continue;
        spent[side]=true;
        if(!f.casting) {
          const spell=spellAt(f,f.cursor),index=f.cursor;
          const printedCost=spell.mana==='half'?Math.floor(f.mana/2):spell.mana!;const printedDuration=(f.statuses['next-instant']?0:spell.castTicks!)+(f.statuses.slowness?statusConfig.slowness.power??1:0);
          const preview=gear.startCast(f,spell,printedCost,printedDuration);const cost=preview.cost;
          if(cost>f.mana) {
            events.push({side,xp:f.spellXp?.[index]??0,spell:spell.id,index,status:'skipped',mana:0,critical:false});
            if(f.oath?.requirement==='noSkip')breakOath(f,'insufficient mana');
            messages.push(f.name+' skips '+spell.name+': insufficient mana.');gear.trigger(f,'skip',{spell});advanceDeck(f);continue;
          }
          restore(f,-cost,'cost');
          const duration=gear.startCast(f,spell,printedCost,printedDuration,true).duration,tidecaller=!!f.statuses['tidal-echo'];
          delete f.statuses['next-instant'];delete f.statuses.slowness;delete f.statuses['tidal-echo'];
          const alignment=f.statuses['greater-alignment']?'greater-alignment':f.statuses['celestial-alignment']?'celestial-alignment':null;
          const castMultiplier=alignment?statusConfig[alignment].power:1;
          if(alignment){delete f.statuses['greater-alignment'];delete f.statuses['celestial-alignment'];}
          f.casting={spell:spell.id,index,remaining:duration,totalTicks:duration,mana:cost,tidecaller,damageMultiplier:castMultiplier};
          if(duration===0&&f.oath?.requirement==='nonInstant')breakOath(f,'Instant cast');
          const opponent=fighters[other(side)];if(opponent.statuses['holy-ground'])applyStatus(f,'consecration',statusConfig['holy-ground'].onOpponentSpellStart!.stacks,opponent);
          if(f.statuses.trap>0)trapDamage[side]=statusConfig.trap.power??0;
        }
        prepared.push(side);
      }
      for(const side of sides)if(trapDamage[side]>0){
        
        notify(fighters[side],'trap','Trap · '+trapDamage[side]+' damage on cast start');applyHits([{side,amount:trapDamage[side],critical:false,kind:'hit',source:fighters[other(side)],reactive:true}]);
      }
      return alive()?prepared:[];
    };
    const collect = (prepared:Side[],instant:boolean) => {
      const ready:Ready[]=[];
      for(const side of prepared) {
        const f=fighters[side],cast=f.casting!;
        if(f.statuses.combust)cast.remaining=Math.min(cast.remaining,statusConfig.combust.maxCastTicks!);
        if(cast.remaining>0)cast.remaining--;
        if(cast.remaining>0)continue;
        const event:CastEvent={side,xp:f.spellXp?.[cast.index]??0,spell:cast.spell,index:cast.index,status:'cast',mana:cast.mana,critical:false};
        ready.push({side,event,instant,tidecaller:cast.tidecaller,damageMultiplier:cast.damageMultiplier});events.push(event);
        if(instant)f.instantThisTick=cast.spell;
        f.casting=null;
      }
      return ready;
    };
    resolveCasts(collect(prepare(true),true));
    // Early spells can use the last stack and apply effects before periodic resolution.
    if(alive()) {
      const periodicHits:Hit[]=[];
      for(const side of penanceTicks){const source=fighters[other(side)],amount=gear.penanceDamage(source);if(amount>0){periodicHits.push({side,amount,critical:false,kind:'dot',domain:'holy',source,reactive:true});notify(source,'penance','Chapel Bell · '+amount+' damage');}}
      for(const side of sides) for(const id of Object.keys(fighters[side].statuses)) {
        const def=statusConfig[id];if(def?.kind!=='dot')continue;
        const source=fighters[side].statusSources?.[id]??other(side), caster=fighters[source];
        const critical=!!caster.statuses.eruption && random()<periodicCrit[source];
        const base=Math.round(((def.power??0)+gear.periodicFlat(caster,id))*(def.perStack?fighters[side].statuses[id]:1)*damageMultiplier(caster,def.domain??'nature',true,{status:id,critical}));
        const amount=critical?criticalDamage(base,(caster.statuses.overheat?statusConfig.overheat.critMultiplier!:RULES.critMultiplier)):base;
        if(amount>0)periodicHits.push({side,amount,critical,kind:'dot',domain:def.domain,source:caster});
      }
      applyHits(periodicHits);
      // Lethal DoTs end combat before HoTs can rescue a defeated fighter.
      if(alive()) {
        age(kind=>kind==='dot');
        for(const side of sides) for(const id of Object.keys(fighters[side].statuses)) {
          const def=statusConfig[id];if(def?.kind==='hot'){const source=fighters[fighters[side].statusSources?.[id]??side];const base=(id==='growth'&&fighters[side].statuses.overgrowth?statusConfig.overgrowth.power??30:def.power??0)+gear.hotFlat(source,id);heal(fighters[side],base*(def.perStack?fighters[side].statuses[id]:1),'hot',source,true,def.domain??'nature');}
        }
        for(const side of sides){const f=fighters[side];if(f.statuses.rain&&f.enhancements?.rainborn)heal(f,f.enhancements.rainborn,'hot',f,true,'water');}
        age(kind=>kind==='hot');
        for(const side of sides){const f=fighters[side];if(f.statuses.rain&&f.enhancements?.monsoon)restore(f,gear.manaBonus(f,f.enhancements.monsoon,'water'));}
        // Reactive buffs/debuffs operate while present, then expire before normal casts.
        age(kind=>kind!=='dot'&&kind!=='hot');
      }
    }
    // Pay and queue normal casts before the replay starts animating this tick.
    const normal=alive()?prepare(false):[];
    // Emit the speed cue only when Combust actually removes casting ticks.
    for(const side of normal){const f=fighters[side];if(f.statuses.combust&&f.casting&&f.casting.remaining>statusConfig.combust.maxCastTicks!)notify(f,'combust-speed',SPELLS[f.casting.spell].name+' · '+f.casting.remaining+'T → '+statusConfig.combust.maxCastTicks+'T');}
    tickStart={tick,player:cloneSnapshot(fighters.player),bot:cloneSnapshot(fighters.bot),events:cloneSnapshot(events),messages:[...messages],damageEvents:cloneSnapshot(damageEvents),healingEvents:cloneSnapshot(healingEvents),manaEvents:cloneSnapshot(manaEvents),notices:cloneSnapshot(notices),presentationPhase:'start'};
    for(const side of sides) if(shuffleAtStart[side]>0) tickStart[side].reshuffleRemaining=shuffleAtStart[side];
    if(alive())resolveCasts(collect(normal,false));
    snapshot(tick);
  }
  const {player,bot}=fighters;
  return { frames, outcome: player.health===bot.health?'draw':player.health>bot.health?'victory':'defeat', endReason: alive()?'timeout':'knockout' };
}
