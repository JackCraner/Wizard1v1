import {expect,it} from 'vitest';
import {AUGMENTS,augmentOffers,validateAugments} from './augments';
import {fighter,simulate} from './engine';
import {offersFor} from './shop';
import {LocalGameGateway} from '../services/localGateway';
import {createBotStates,prepareBot,grantBotAugment} from './botAI';
import type {Session} from './model';
const raw=(g:LocalGameGateway)=>(g as unknown as {session:Session}).session;
const duel=(deck:string[],augments:string[],enemy=['current'])=>simulate(fighter('A',deck,augments),fighter('B',enemy));
it('offers three distinct unowned rewards deterministically, and handles pool exhaustion',()=>{expect(Object.keys(AUGMENTS).length).toBeGreaterThanOrEqual(30);let owned:string[]=[];for(let round=2;round<30;round+=2){const choices=augmentOffers(round,owned);expect(new Set(choices).size).toBe(choices.length);expect(choices.every(id=>!owned.includes(id))).toBe(true);expect(augmentOffers(round,owned)).toEqual(choices);owned.push(...choices);}expect(augmentOffers(30,Object.keys(AUGMENTS))).toEqual([]);expect(()=>validateAugments(['reservoir','reservoir'])).toThrow();});
it('grants every player a reward after round two, charges nothing, locks other actions, and persists into combat',async()=>{const g=new LocalGameGateway();let s=await g.start();s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});for(let r=1;r<=2;r++){s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});if(r===1){expect(s.phase).toBe('shop');expect(s.augments).toEqual([]);}}expect(s.round).toBe(2);expect(s.phase).toBe('augment');expect(s.battle).toBeNull();expect(s.augmentOffers).toHaveLength(3);expect(s.lobby.players.slice(1).every(p=>p.augments.length===1)).toBe(true);const gold=s.gold,revision=s.revision;await expect(g.execute(s.id,revision,{type:'reroll'})).rejects.toThrow('locked');await expect(g.execute(s.id,revision,{type:'next'})).rejects.toThrow('Finish');await expect(g.execute(s.id,revision,{type:'chooseAugment',augment:'fake'})).rejects.toThrow('unavailable');const selected=s.augmentOffers[0];s=await g.execute(s.id,revision,{type:'chooseAugment',augment:selected});expect(s.phase).toBe('shop');expect(s.round).toBe(3);expect(s.gold).toBe(gold+10+(selected==='deep-pockets'?4:0));expect(s.augments).toEqual([selected]);expect(s.augmentOffers).toEqual([]);await expect(g.execute(s.id,revision,{type:'chooseAugment',augment:selected})).rejects.toThrow('out of date');s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.battle!.frames[0].player.augments).toEqual([selected]);expect(s.battle!.frames[0].bot.augments).toHaveLength(1);expect(s.lobby.players.every(p=>p.lastCombatAugments.length===1)).toBe(true);});
it('economy augments change only their specified purchases and reset once per shop',async()=>{const g=new LocalGameGateway();let s=await g.start();Object.assign(raw(g),{augments:['scholar','recycler','scavenger','deep-pockets'],shop:['wrath','wrath','wrath'],spells:['wrath'],spellXp:[0]});s=await g.execute(s.id,s.revision,{type:'buy',spell:'wrath',target:0});expect(s.spellXp).toEqual([2]);s=await g.execute(s.id,s.revision,{type:'buy',spell:'wrath',target:0});expect(s.spellXp).toEqual([3]);s=await g.execute(s.id,s.revision,{type:'buy',spell:'wrath'});const gold=s.gold;s=await g.execute(s.id,s.revision,{type:'trash',index:1});expect(s.gold).toBe(gold+1);s=await g.execute(s.id,s.revision,{type:'reroll'});expect(s.gold).toBe(gold+1);s=await g.execute(s.id,s.revision,{type:'reroll'});expect(s.gold).toBe(gold);s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});expect(s.gold).toBe(gold+14);expect(s.bonusMergeUsed).toBe(false);expect(s.rerolls).toBe(0);});
it('domain shop weights influence frequency without changing rank',()=>{let base=0,specialist=0,wanderer=0;for(let roll=0;roll<800;roll++){for(const id of offersFor(1,roll,['wrath']).shop)if(['thorn-lash','healing-seed','barkskin','moonblight','regrowth','wrath'].includes(id))base++;for(const id of offersFor(1,roll,['wrath'],['specialist']).shop)if(['thorn-lash','healing-seed','barkskin','moonblight','regrowth','wrath'].includes(id))specialist++;for(const id of offersFor(1,roll,['wrath'],['wanderer']).shop)if(['wrath','moonblight','regrowth','sap'].includes(id))wanderer++;}expect(specialist).toBeGreaterThan(base*1.5);expect(wanderer).toBeLessThan(base*.7);});
it('bots receive exactly one reward on each scheduled round and retain it across shopping',()=>{const state=createBotStates(['bot']).bot;let deck=prepareBot(state,[],1,1,'normal');grantBotAugment(state,deck,1,1);expect(state.augments).toHaveLength(0);grantBotAugment(state,deck,2,1);const chosen=[...state.augments];grantBotAugment(state,deck,2,1);expect(state.augments).toEqual(chosen);deck=prepareBot(state,deck,3,1,'normal');expect(state.augments).toEqual(chosen);grantBotAugment(state,deck,4,1);expect(state.augments).toHaveLength(2);expect(new Set(state.augments).size).toBe(2);});

it('applies domain and hybrid augment triggers with the new counters',()=>{
 expect(duel(['moonblight'],['wild-garden']).frames[1].bot.statuses.poison).toBe(7);
 expect(duel(['wrath'],['verdant-cycle']).frames[0].player.statuses.regeneration).toBe(3);
 expect(duel(['current','current','current'],['rising-tide']).frames[3].player.statuses.tidecaller).toBe(5);
 expect(duel(['frostbolt','wrath'],['venomous-hex']).frames[1].bot.statuses.poison).toBe(2);
 expect(duel(['current','ember'],['steam']).frames[2].player.statuses.heat).toBe(3);
 expect(duel(['ember','moonblight'],['wildfire']).frames[2].bot.health).toBe(480);
 expect(duel(['prayer','current'],['purifying-rain']).frames[2].player.shield).toBe(45);
});
it('applies sequence damage bonuses, repeats and nonstacking Ward',()=>{
 expect(duel(['spark'],['first-strike']).frames[1].bot.health).toBe(432);
 expect(duel(['spark'],['finisher']).frames[1].bot.health).toBe(432);
 expect(duel(['spark'],['opening-ward']).frames[1].player.shield).toBe(50);
 expect(duel(['current','spark'],['alternation']).frames[2].bot.health).toBe(446);
 expect(duel(['current','spark'],['crescendo']).frames[2].bot.health).toBe(453);
 expect(duel(['current','current','current','spark'],['echo-chamber']).frames[4].events.find(e=>e.side==='player')?.repeats).toBe(2);
});
it('applies cast-time triggers without repeat recursion',()=>{
 expect(duel(['pyroblast'],['heavy-hitter']).frames[3].bot.health).toBe(290);
 expect(duel(['pyroblast'],['patience']).frames[3].player.shield).toBe(80);
 expect(duel(['current','current','spark'],['rapid-casting']).frames[3].bot.health).toBe(432);
 expect(duel(['current','current','current','pyroblast'],['momentum']).frames[5].events.some(e=>e.spell==='pyroblast')).toBe(true);
});
it('preserves risk tradeoffs and prevents Second Wind from reviving a dead fighter',()=>{
 const glass=duel(['spark'],['glass-cannon']);expect(glass.frames[0].player.maxHealth).toBe(375);expect(glass.frames[1].bot.health).toBe(441);
 expect(duel(['flare','spark'],['blood-magic']).frames[2].bot.health).toBe(350);
 const loop=duel(['spark'],['reckless-loop']);expect(loop.frames[2].bot.health).toBe(410);expect(loop.frames[2].player.health).toBe(450);
 const low=fighter('A',['pyroblast'],['last-stand']);low.health=140;expect(simulate(low,fighter('B',['current'])).frames[2].events.some(e=>e.spell==='pyroblast')).toBe(true);
 const wind=fighter('A',['current'],['second-wind']);wind.health=150;const battle=simulate(wind,fighter('B',['spark']));expect(battle.frames[1].player.health).toBe(225);wind.health=45;expect(simulate(wind,fighter('B',['spark'])).frames[1].player.health).toBe(0);
});
it.each(Object.keys(AUGMENTS))('%s is legal and isolated in replay snapshots',id=>{const result=duel(['moonblight','current','ember','aegis','wrath'],[id]);expect(result.frames[0].player.augments).toEqual([id]);expect(result.frames.every(f=>Number.isFinite(f.player.health)&&f.player.health>=0)).toBe(true);result.frames.at(-1)!.player.augments.push('fake');expect(result.frames[0].player.augments).toEqual([id]);});
