import { RULES, fighter, channelPower, validateDeck } from './engine';
import { cardAt } from './upgrades';
import { activeSpellIndices } from './rotation';
import { effectEnabled } from './attunement';
import { cloneSnapshot } from './clone';
import type { Battle, CombatFrame, Effect, Fighter, DamageEvent, CombatOrigin } from './model';

type Side='player'|'bot';
const sides:Side[]=['player','bot'];
const other=(s:Side):Side=>s==='player'?'bot':'player';
const debuffs=['poison','slow','trap','curse'];
type Context={side:Side;index:number;spell:boolean;scale:number;echo:boolean;empowered:boolean;heat:boolean;quiet:boolean;breaks?:boolean;heatEmpowered?:boolean;removedWard?:boolean;cost?:number;damage?:number;critical?:boolean;nextDamage?:number;nextCritical?:boolean};
type Hit={side:Side;amount:number;kind:DamageEvent['kind'];ctx:Context;critical?:boolean;intercept?:boolean;impOnly?:boolean;leech?:number;poison?:boolean};

/** Deterministic phases: Instant, DoT/deaths, HoT, normal effects/damage, summons. */
export function simulate(player:Fighter,bot:Fighter,_seed=RULES.seed):Battle {
 const f={player:cloneSnapshot(player),bot:cloneSnapshot(bot)};
 const frames:CombatFrame[]=[];
 let tick=0,events:CombatFrame['events']=[],notices:NonNullable<CombatFrame['notices']>=[],damageEvents:NonNullable<CombatFrame['damageEvents']>=[],healingEvents:NonNullable<CombatFrame['healingEvents']>=[],hits:Hit[]=[],pending={player:0,bot:0};
 const secondWind=new Set<Side>();
 for(const side of sides){validateDeck(f[side].spells);f[side].memory.cards??={};f[side].memory.rules??={};if(f[side].shield)f[side].wardCapacity=Math.max(f[side].shield,f[side].wardCapacity??0);}
 const rules=(s:Side)=>f[s].memory.rules!;
 const state=(s:Side,i:number)=>f[s].memory.cards![i]??(f[s].memory.cards![i]={});
 const card=(s:Side,i:number)=>cardAt(f[s].spells[i],f[s].spellXp?.[i]);
 const has=(s:Side,id:string)=>f[s].augments.includes(id);
 const attuned=(s:Side,d?:string)=>!d||f[s].attuned.includes(d as never);
 const power=(s:Side)=>(has(s,'glass-cannon')?1.3:1)*(has(s,'hot-stuff')&&f[s].statuses.heat?1.1:1);
 const context=(side:Side,index=-1):Context=>({side,index,spell:false,scale:1,echo:false,empowered:false,heat:false,quiet:false});
 const note=(side:Side,status:string,text:string,index?:number,targetIndex?:number,origin?:CombatOrigin)=>notices.push({side,status,text,index,targetIndex,origin});
 const condition=(s:Side,e:Effect,c:Context)=>!e.when||({heatConsumed:c.heat,echoed:c.echo,impAlive:(f[s].imp?.health??0)>0,impAbsent:!(f[s].imp?.health??0),regen8:(f[s].statuses.regeneration??0)>=8,wardRemoved:!!c.removedWard,regen:!!f[s].statuses.regeneration,poison6:(f[other(s)].statuses.poison??0)>=6}[e.when]);
 const add=(side:Side,status:string,n:number,source:Side)=>{if(n<=0)return;f[side].statuses[status]=(f[side].statuses[status]??0)+Math.floor(n);if(debuffs.includes(status))(f[side].statusSources??={})[status]=source===side?'self':'enemy';};
 const enqueue=(side:Side,n:number,ctx:Context,extra:Partial<Hit>={})=>{if(n>0)hits.push({side,amount:Math.floor(n+1e-8),kind:'hit',ctx,intercept:true,...extra});};
 function heal(side:Side,n:number,c:Context,direct=true,converted=false){
  n=Math.floor(n+1e-8);if(n<=0)return;
  if(rules(side).unholy&&!converted){enqueue(other(side),n*power(side),c,{kind:direct?'hit':'dot',intercept:direct});if(rules(side).unholyHeal)heal(side,n*rules(side).unholyHeal,c,direct,true);return;}
  if(direct&&has(side,'friendly-imp')&&(f[side].imp?.health??0)>0){const imp=f[side].imp!,v=Math.min(n,imp.maxHealth-imp.health);imp.health+=v;n-=v;if(v)healingEvents.push({side,amount:v,kind:'heal',target:'imp',sourceIndex:c.index});}
  const v=Math.min(n,f[side].maxHealth-f[side].health);f[side].health+=v;if(v)healingEvents.push({side,amount:v,kind:direct?'heal':'hot',sourceIndex:c.index});
 }
 function ward(side:Side,n:number,c:Context){const u=f[side],v=Math.floor(n+1e-8),before=u.shield;u.shield=rules(side).addWard?u.shield+v:Math.max(u.shield,v);if(rules(side).addWard)u.wardCapacity=Math.max(u.wardCapacity??0,u.shield);else if(v>=before)u.wardCapacity=v;if(rules(side).wardHeal&&u.shield>before)heal(side,(u.shield-before)*rules(side).wardHeal,c);}
 function awaken(){for(const side of sides)for(const i of activeSpellIndices(f[side])){const a=card(side,i).combat?.effects?.find(e=>e.kind==='awaken');if(!a||state(side,i).awakened)continue;const count=a.awakenOn==='heat'?f[side].memory.heatConsumed??0:a.awakenOn==='echo'?state(side,i).echoes??0:a.awakenOn==='poison'?f[side].memory.poisonEvents??0:f[other(side)].statuses.poison??0;const threshold=a.attunedThreshold!==undefined&&attuned(side,a.bonusDomain)?a.attunedThreshold:a.threshold??1;if(count<threshold)continue;state(side,i).awakened=true;note(side,'awaken','AWAKEN',i);execute(a.effects??[],context(side,i));}}
 function trigger(side:Side,event:Effect['event'],quiet=false,origin?:CombatOrigin){if(quiet)return false;let fired=false;for(const index of activeSpellIndices(f[side])){const st=state(side,index),t=card(side,index).combat?.effects?.find(e=>e.kind==='trigger'&&e.event===event);if(!t||!st.armed||st.firedCycle===f[side].cycle||t.onceCombat&&st.firedCombat||!condition(side,t,context(side,index)))continue;st.firedCycle=f[side].cycle;st.firedCombat=true;const effects=(t.effects??[]).filter(e=>effectEnabled(e,f[side].attuned));if(event==='fatal')f[side].health=1;execute(effects,context(side,index));const record={index,effects:cloneSnapshot(effects),cycle:f[side].cycle};f[side].memory.lastTrigger=record;(f[side].memory.triggerHistory??=[]).push(record);note(side,'trigger',event==='fatal'?'SAVED · TRIGGER':'TRIGGER',index,undefined,origin);fired=true;if(event==='fatal')break;}return fired;}
 function retrigger(c:Context,e:Effect){const u=f[c.side];const last=[...(u.memory.triggerHistory??[])].reverse().find(t=>t.cycle===u.cycle&&(!e.domainFilter||card(c.side,t.index).domain===e.domainFilter));if(!last)return;note(c.side,'retrigger','RETRIGGER',c.index,last.index,{side:c.side,kind:'spell',index:c.index});execute(last.effects,{...context(c.side,last.index),scale:c.scale,quiet:true});execute(e.effects??[],{...context(c.side,c.index),scale:c.scale,quiet:true});}
 function execute(effects:Effect[],c:Context){const side=c.side,u=f[side],enemy=f[other(side)];for(const e of effects){if(!effectEnabled(e,u.attuned)||!condition(side,e,c))continue;const target=e.target==='enemy'?other(side):side;let value=e.attunedAmount!==undefined&&attuned(side,e.bonusDomain)?e.attunedAmount:e.amount??0;
   const a=c.index>=0?card(side,c.index).combat?.effects?.find(x=>x.kind==='awaken'):undefined;
   if(e.kind==='damage'&&state(side,c.index).awakened&&a?.awakenedDamage!==undefined)value=a.awakenedDamage;
   if(e.perStatus)value*= (e.perStatus.startsWith('enemy:')?enemy:u).statuses[e.perStatus.replace('enemy:','')]??0;
   if(e.perPoison)value+=(state(side,c.index).awakened?a?.awakenedPerPoison??e.perPoison:e.perPoison)*(enemy.statuses.poison??0);
   if(e.channelBonus&&c.index>=0){const active=activeSpellIndices(u);value+=e.channelBonus*(channelPower(active.map(i=>u.spells[i]),active.indexOf(c.index))-1);}
   if(e.debuffMultiplier)value*=1+e.debuffMultiplier*debuffs.filter(k=>enemy.statuses[k]>0).length;
   const alternation=c.spell&&has(side,'alternation')&&u.memory.previousDomain&&u.memory.previousDomain!==card(side,c.index).domain?1.2:1;
   const critCondition=e.criticalIf&&({previousCost:!!u.memory.previousSelfDamage,lowHealth:u.health<u.maxHealth*.4,poison:!!enemy.statuses.poison,debuff:debuffs.some(k=>enemy.statuses[k]>0),imp:(u.imp?.health??0)>0,regeneration:!!u.statuses.regeneration}[e.criticalIf]);
   const critical=c.spell&&(!!c.nextCritical||!!(c.heatEmpowered&&rules(side).heatCritical)||!!critCondition&&(!e.criticalDomain||e.criticalMultiplier!==undefined||attuned(side,e.criticalDomain)));
   const empowered=c.spell&&(c.empowered||attuned(side,e.empoweredDomain)&&(e.empoweredIf==='imp'&&(u.imp?.health??0)>0||e.empoweredIf==='critical'&&critical));
   const direct=alternation*(empowered?1.5:1)*c.scale;
   const active=activeSpellIndices(u);
   const damagePower=power(side)*direct*(c.spell?(c.nextDamage??1)*(has(side,'first-strike')&&c.index===active[0]?1.5:1)*(has(side,'finisher')&&c.index===active.at(-1)?1.5:1)*(has(side,'heavy-hitter')&&card(side,c.index).castTicks===3?1.4:1)*(has(side,'crescendo')?1+u.memory.cycleCasts*.05:1):1)*(critical?(e.criticalMultiplier&&attuned(side,e.criticalDomain)?e.criticalMultiplier:c.heatEmpowered?rules(side).heatCritPower??1.5:1.5):1);
   if(critical)c.critical=true;
   if(e.kind==='damage'){const scale=c.echo&&e.echoEffectiveness?e.echoEffectiveness/c.scale:1;enqueue(other(side),value*damagePower*scale,c,{critical,intercept:!e.splashImp});if(e.splashImp&&enemy.imp?.health)enqueue(other(side),value*damagePower*scale,c,{critical,impOnly:true,intercept:false});}
   else if(e.kind==='heal')heal(target,value*direct,c);
   else if(e.kind==='healFull')heal(side,u.maxHealth-u.health,c);
   else if(e.kind==='ward')ward(target,value*direct,c);
   else if(e.kind==='status'){add(target,e.status!,value*(e.when==='echoed'?1:c.scale),side);if(e.status==='poison'&&target!==side&&has(side,'wildfire')&&u.statuses.heat)enqueue(other(side),20*power(side),{...c,spell:false});}
   else if(e.kind==='selfDamage'){const n=Math.floor(e.currentHealthFraction?u.health*e.currentHealthFraction*c.scale:value*c.scale);c.cost=(c.cost??0)+n;enqueue(side,n,c,{kind:'cost',intercept:false});}
   else if(e.kind==='multiply')u.statuses[e.status!]=Math.floor((u.statuses[e.status!]??0)*(1+(value-1)*c.scale));
   else if(e.kind==='cleanse'){for(const id of debuffs.filter(k=>u.statuses[k]>0).slice(0,Math.floor(value*c.scale)))delete u.statuses[id];}
   else if(e.kind==='consume'||e.kind==='cultivate'){const who=e.kind==='consume'?enemy:u;const count=Math.min(who.statuses[e.status!]??0,e.limit??Infinity);who.statuses[e.status!]=(who.statuses[e.status!]??0)-count;if(e.kind==='consume')enqueue(other(side),count*value*damagePower,c,{critical});else if(e.rule==='ward')ward(side,count*value*direct,c);else heal(side,count*value*direct,c);}
   else if(e.kind==='summon')pending[side]+=Math.floor((e.currentHealthFraction?(c.cost??Math.floor(u.health*e.currentHealthFraction))*value:value)*c.scale);
   else if(e.kind==='impGuard'&&u.imp&&u.imp.health>0)u.imp.guard+=Math.floor(value*c.scale);
   else if(e.kind==='impPower')rules(side).impDamage=Math.max(rules(side).impDamage??0,value);
   else if(e.kind==='sacrificeImp'&&u.imp&&u.imp.health>0){const amount=(e.useMaxHealth?u.imp.maxHealth:u.imp.health)*value;u.imp.health=0;enqueue(other(side),amount*damagePower,c,{critical,leech:attuned(side,e.bonusDomain)?e.healFraction:undefined});note(side,'summon','Imp sacrificed',c.index);}
   else if(e.kind==='removeWard'){const amount=Math.min(enemy.shield,e.amount??Infinity);enemy.shield-=amount;c.removedWard=amount>0;}
   else if(e.kind==='rule'){const r=rules(side),name=e.rule!;if(name==='tideThreshold')r[name]=Math.min(r[name]??3,value);else r[name]=Math.max(r[name]??0,value);if(c.index>=0)state(side,c.index).rules=[...new Set([...(state(side,c.index).rules??[]),name])];}
   else if(e.kind==='sequenceOath'&&!c.echo){u.memory.sequenceOath={index:c.index,condition:e.oathCondition!,remaining:value,effects:e.effects??[],failed:false};note(side,'oath','Oath started',c.index);}
   else if(e.kind==='retrigger')retrigger(c,e);
   else if(e.kind==='fragile'){if(c.spell){c.breaks=true;continue;}if(!(u.broken??=[]).includes(c.index)){u.broken.push(c.index);note(side,'fragile','BROKEN',c.index);}}
  }awaken();
 }
 function flush(){let passes=0;while(hits.length){if(++passes>100)throw Error('Combat effect chain exceeded its bounded limit.');const batch=hits;hits=[];for(const hit of batch){const u=f[hit.side],c=hit.ctx,source=c.side;let n=hit.amount,total=0,healthLost=0;const record=(amount:number,target:DamageEvent['target'])=>{if(amount>0){damageEvents.push({side:hit.side,sourceSide:source,sourceIndex:c.index,amount,kind:hit.kind,critical:!!hit.critical,target,domain:c.index>=0?card(source,c.index).domain:undefined});total+=amount;}};
    if((hit.intercept||hit.impOnly)&&(u.imp?.health??0)>0){const imp=u.imp!;if(imp.guard){imp.guard--;n=0;note(hit.side,'guard','Imp Guard blocked damage');}else{const amount=Math.min(imp.health,n);imp.health-=amount;n-=amount;record(amount,'imp');if(amount)trigger(hit.side,'impHurt',c.quiet,{side:hit.side,kind:'imp'});}}
    if(hit.impOnly)n=0;
    if(n>0&&hit.kind!=='cost'&&u.statuses.guard){u.statuses.guard--;n=0;note(hit.side,'guard','Guard blocked damage');if(has(hit.side,'tough-skin'))ward(hit.side,40,context(hit.side));}
    if(n>0){if(hit.kind!=='cost'&&has(hit.side,'hot-stuff')&&u.statuses.heat)n=Math.floor(n*1.1);if(hit.kind==='hit'){const absorbed=Math.min(u.shield,n);u.shield-=absorbed;n-=absorbed;record(absorbed,'ward');}healthLost=Math.min(u.health,n);u.health=Math.max(0,u.health-n);record(healthLost,'wizard');if(healthLost&&u.memory.sequenceOath?.condition==='safe')u.memory.sequenceOath.failed=true;if(u.health===0)trigger(hit.side,'fatal',c.quiet,{side:hit.side,kind:'wizard'});}
    if(c.spell&&hit.kind==='hit'&&source!==hit.side)c.damage=(c.damage??0)+total;
    if(hit.leech&&total)heal(source,total*hit.leech,c);
    if(healthLost&&source===hit.side){if(has(source,'blood-magic'))add(source,'regeneration',3,source);if(has(source,'blood-infusion'))add(source,'heat',1,source);}
    if(hit.poison&&total>0){f[source].memory.poisonEvents=(f[source].memory.poisonEvents??0)+1;trigger(source,'poison',c.quiet,{side:hit.side,kind:'wizard'});awaken();}
    if(healthLost&&u.health>0&&u.health<=u.maxHealth*.3&&has(hit.side,'second-wind')&&!secondWind.has(hit.side)){secondWind.add(hit.side);heal(hit.side,120,context(hit.side),false);}
   }} }
 function startCycle(side:Side){const u=f[side];u.memory.cycleCasts=0;u.memory.triggerHistory=[];delete u.memory.lastTrigger;delete rules(side).unholy;delete rules(side).unholyHeal;
  if(u.statuses.curse){const source=u.statusSources?.curse==='self'?side:other(side);enqueue(side,u.statuses.curse*10*power(source),context(source),{kind:'dot',intercept:false});}
  if(rules(side).cycleTide)add(side,'tide',1,side);trigger(side,'cycle',false,{side,kind:'cycle'});if(has(side,'reckless-loop')&&u.cycle>1)enqueue(side,25,context(side),{kind:'cost',intercept:false});}
 function advance(side:Side){const u=f[side],active=activeSpellIndices(u),next=active.find(i=>i>u.cursor);u.casting=null;if(!active.length){u.reshuffleRemaining=0;return;}if(next!==undefined)u.cursor=next;else{u.cursor=active[0];const source=u.statusSources?.curse==='self'?side:other(side);u.reshuffleRemaining=(has(side,'reckless-loop')?0:RULES.reshuffleTicks)+(u.statuses.curse&&has(source,'cursed')?1:0);if(!u.reshuffleRemaining){u.cycle++;startCycle(side);}}}
 function interrupt(side:Side){const u=f[side],cast=u.casting;if(!cast)return;const indices=activeSpellIndices(u);let last=cast.index;if(card(side,cast.index).keywords.includes('channel')){let n=0;for(const i of indices.filter(i=>i>=cast.index)){if(u.spells[i]!==cast.spell||n++===3)break;last=i;}}for(const i of indices.filter(i=>i>=cast.index&&i<=last))events.push({side,index:i,spell:u.spells[i],status:'skipped',critical:false,details:['Interrupted']});u.cursor=last;advance(side);}
 function resolve(ready:Side[]){const cancelled=new Set<Side>();for(const side of ready){const cast=f[side].casting;if(cast&&card(side,cast.index).combat?.effects?.some(e=>e.kind==='interrupt'&&effectEnabled(e,f[side].attuned))&&f[other(side)].casting)cancelled.add(other(side));}for(const side of cancelled)interrupt(side);
  const completions:{c:Context;echo?:Context;oldOath:Fighter['memory']['sequenceOath'];effects:Effect[]}[]=[];
  for(const side of ready){const u=f[side],cast=u.casting;if(!cast||cancelled.has(side))continue;const def=card(side,cast.index),effects=def.combat!.effects!,r=rules(side);const damaging=effects.some(e=>['damage','consume','sacrificeImp'].includes(e.kind));const c:Context={...context(side,cast.index),spell:true,empowered:!!cast.empowered||!!r.nextEmpowered,heat:!!cast.heatConsumed,heatEmpowered:!!cast.empowered,nextDamage:damaging?r.nextDamage:undefined,nextCritical:damaging?!!r.nextCritical:false};delete r.nextEmpowered;if(damaging){delete r.nextDamage;delete r.nextCritical;}const oldOath=u.memory.sequenceOath;execute(effects,c);let echo:Context|undefined;if(cast.echoPower!==undefined){echo={...c,scale:cast.echoPower,echo:true,damage:0,cost:0};execute(effects,echo);state(side,cast.index).echoes=(state(side,cast.index).echoes??0)+1;}
   completions.push({c,echo,oldOath,effects});events.push({side,index:cast.index,spell:def.id,status:'cast',critical:!!c.critical,xp:u.spellXp?.[cast.index]??0,repeats:echo?2:1,details:[...(cast.instant?['Instant']:[]),...(c.empowered?['Empowered']:[]),...(echo?[`Echo ${cast.echoPower!*100}%`]:[]),...(state(side,cast.index).awakened?['Awakened']:[])]});
  }flush();
  for(const {c,echo,oldOath,effects}of completions){const u=f[c.side],def=card(c.side,c.index);if(u.health<=0)continue;
   if(oldOath&&u.memory.sequenceOath===oldOath){const dealt=(c.damage??0)+(echo?.damage??0),failed=oldOath.failed||oldOath.condition==='noDamage'&&dealt>0||oldOath.condition==='damage100'&&dealt<100;if(failed){delete u.memory.sequenceOath;note(c.side,'oath','Oath failed',oldOath.index);}else if(--oldOath.remaining===0){delete u.memory.sequenceOath;execute(oldOath.effects,context(c.side,oldOath.index));note(c.side,'oath','OATH COMPLETE',oldOath.index);trigger(c.side,'oath',false,{side:c.side,kind:'spell',index:oldOath.index});}}
   if(echo){trigger(c.side,'echo',false,{side:c.side,kind:'spell',index:c.index});if(rules(c.side).echoRetrigger&&u.memory.echoCycle!==u.cycle){u.memory.echoCycle=u.cycle;retrigger(context(c.side,activeSpellIndices(u).find(i=>state(c.side,i).rules?.includes('echoRetrigger'))??c.index),{kind:'retrigger'});}}
   if(effects.some(e=>e.kind==='trigger'))state(c.side,c.index).armed=true;
   if(def.domain==='fire')add(c.side,'heat',1,c.side);if(def.domain==='water')add(c.side,'tide',1,c.side);
   if(u.statuses.trap){u.statuses.trap--;enqueue(c.side,10,context(u.statusSources?.trap==='self'?c.side:other(c.side)),{kind:'dot',intercept:false});}
   if(rules(c.side).impDamage&&(u.imp?.health??0)>0)enqueue(other(c.side),rules(c.side).impDamage*power(c.side),context(c.side,c.index));
   u.memory.fastStreak=def.castTicks===1?u.memory.fastStreak+1:0;if(has(c.side,'momentum')&&u.memory.fastStreak===3){rules(c.side).nextEmpowered=1;u.memory.fastStreak=0;}
   if(c.critical&&has(c.side,'criticality')&&u.memory.criticalCycle!==u.cycle){u.memory.criticalCycle=u.cycle;add(c.side,'heat',2,c.side);}
   if(c.breaks){(u.broken??=[]).push(c.index);note(c.side,'fragile','BROKEN',c.index);}
   u.memory.previousSelfDamage=(c.cost??0)>0;u.memory.previousDomain=def.domain;u.memory.casts++;u.memory.cycleCasts++;awaken();advance(c.side);
  }flush();
 }
 const snapshot=(tickStart?:CombatFrame):CombatFrame=>({tick,player:cloneSnapshot(f.player),bot:cloneSnapshot(f.bot),events:cloneSnapshot(events),notices:cloneSnapshot(notices),damageEvents:cloneSnapshot(damageEvents),healingEvents:cloneSnapshot(healingEvents),messages:[],...(tickStart?{tickStart}:{})});
 for(const side of sides){if(has(side,'opening-ward'))ward(side,100,context(side));if(has(side,'toxic-start')){add(other(side),'poison',5,side);add(other(side),'curse',1,side);}}frames.push(snapshot());
 for(tick=1;tick<=RULES.maxTicks;tick++){
  events=[];notices=[];damageEvents=[];healingEvents=[];hits=[];pending={player:0,bot:0};const waiting=new Set<Side>();
  for(const side of sides){const u=f[side];if(u.imp&&u.imp.health<=0)delete u.imp;if(!activeSpellIndices(u).length)continue;if(u.reshuffleRemaining){waiting.add(side);continue;}if(u.casting&&!(u.broken??[]).includes(u.casting.index))continue;u.casting=null;if(!activeSpellIndices(u).includes(u.cursor))u.cursor=activeSpellIndices(u).find(i=>i>u.cursor)??activeSpellIndices(u)[0];
   const def=card(side,u.cursor),instant=def.castTicks===0&&attuned(side,def.instantDomain);let duration=instant?0:Math.max(1,def.castTicks??1);let empowered=false,heatConsumed=false,echoPower:number|undefined;
   if(!instant){if(def.enemyStatusCast&&f[other(side)].statuses[def.enemyStatusCast.status])duration=def.enemyStatusCast.ticks;if(has(side,'last-stand')&&u.health<u.maxHealth*.3)duration=Math.max(1,duration-1);if(def.domain==='fire'&&(u.statuses.heat??0)>=3){empowered=true;duration=1;if(rules(side).freeHeat)delete rules(side).freeHeat;else{u.statuses.heat-=3;heatConsumed=true;u.memory.heatConsumed=(u.memory.heatConsumed??0)+1;trigger(side,'heat',false,{side,kind:'spell',index:u.cursor});}note(side,'heat','HEAT · EMPOWERED',u.cursor);}
    if(u.statuses.slow){u.statuses.slow--;duration++;}const threshold=rules(side).tideThreshold??3;if((u.statuses.tide??0)>=threshold){u.statuses.tide-=threshold;echoPower=rules(side).echoPower??.5;note(side,'tide','ECHO READY',u.cursor);}}
   u.casting={spell:def.id,index:u.cursor,remaining:duration,totalTicks:duration,instant,empowered,heatConsumed,echoPower};
  }awaken();flush();if(sides.some(s=>f[s].health<=0)){frames.push(snapshot());break;}
  resolve(sides.filter(s=>f[s].casting?.instant));if(sides.some(s=>f[s].health<=0)){frames.push(snapshot());break;}
  for(const side of sides){const u=f[side];if(u.statuses.poison){const source=u.statusSources?.poison==='self'?side:other(side);enqueue(side,10*(rules(source).poisonPower??1)*(has(source,'super-poison')?2:1)*power(source),context(source),{kind:'dot',intercept:false,poison:true});u.statuses.poison--;if(!u.statuses.poison&&has(source,'bloom'))enqueue(side,60*power(source),context(source));}}flush();if(sides.some(s=>f[s].health<=0)){frames.push(snapshot());break;}
  for(const side of sides)if(f[side].statuses.regeneration){heal(side,10,context(side),false);f[side].statuses.regeneration--;}flush();if(sides.some(s=>f[s].health<=0)){frames.push(snapshot());break;}
  const tickStart=snapshot();tickStart.presentationPhase='start';
  for(const side of waiting)if(--f[side].reshuffleRemaining===0){f[side].cycle++;startCycle(side);}flush();
  if(!sides.some(s=>f[s].health<=0))resolve(sides.filter(s=>!waiting.has(s)&&f[s].casting&&!f[s].casting!.instant&&--f[s].casting!.remaining===0));
  for(const side of sides){const u=f[side],n=pending[side];if(n>0&&u.health>0){if(u.imp&&u.imp.health>0){u.imp.health+=n;u.imp.maxHealth+=n;}else u.imp={health:n,maxHealth:n,guard:0};note(side,'summon',`Summon +${n}`);}for(const k of Object.keys(u.statuses))if(u.statuses[k]<=0)delete u.statuses[k];}frames.push(snapshot(tickStart));if(sides.some(s=>f[s].health<=0))break;
 }
 return {frames,outcome:f.player.health===f.bot.health?'draw':f.player.health>f.bot.health?'victory':'defeat',endReason:sides.some(s=>f[s].health<=0)?'knockout':'timeout'};
}
