import {expect,it} from 'vitest';
import {BOT_CONFIG,botFighter,createBotStates,prepareBot,scoreBotDeck} from './botAI';
import {deckDomains,PLAYABLE_SPELLS,RULES,validateDeck} from './engine';
import {LocalGameGateway} from '../services/localGateway';
import type {Difficulty} from './model';

it('builds persistent legal decks, carries gold and buys equipment over multiple rounds',()=>{
 const state=createBotStates(['bot']).bot;let deck:string[]=[],opening:string[]=[];
 for(let round=1;round<=10;round++){
  deck=prepareBot(state,deck,round,1,'normal');
  if(round===1)opening=[...deck];
  expect(()=>validateDeck(deck)).not.toThrow();expect(state.gold).toBeGreaterThanOrEqual(0);
  expect(deckDomains(deck).length).toBeLessThanOrEqual(2);expect(deck.every(id=>PLAYABLE_SPELLS.includes(id))).toBe(true);
 }
 expect(deck.length).toBeGreaterThan(opening.length);
 expect(deck.length).toBeLessThanOrEqual(RULES.slots);
 expect(Object.keys(state.equipment).length).toBeGreaterThan(0);
 const f=botFighter('Bot',deck,state);expect(f.maxHealth+f.maxMana).toBeGreaterThan(600);
 expect(f.equipment).toEqual(state.equipment);
});
it('is deterministic and never prepares or grants income twice in one round',()=>{
 const a=createBotStates(['bot']).bot,b=createBotStates(['bot']).bot;
 const deck=prepareBot(a,[],1,1,'hard');expect(prepareBot(b,[],1,1,'hard')).toEqual(deck);expect(a).toEqual(b);
 const before=structuredClone(a);expect(prepareBot(a,deck,1,1,'hard')).toEqual(deck);expect(a).toEqual(before);
});
it('values an enabled Moonfire combo and consecutive Channel copies',()=>{
 const lunarWithout=scoreBotDeck(['lunar-strike'],0),lunarWith=scoreBotDeck(['moonfire','lunar-strike'],0)-scoreBotDeck(['moonfire'],0);
 expect(lunarWith).toBeGreaterThan(lunarWithout);
 expect(scoreBotDeck(['undertow','undertow','undertow'],2)).toBeGreaterThan(3*scoreBotDeck(['undertow'],2));
});
it('supports every difficulty and leaves combat base stats unchanged without equipment',async()=>{
 for(const difficulty of Object.keys(BOT_CONFIG.difficulties) as Difficulty[]){
  const g=new LocalGameGateway();let s=await g.start(difficulty);
  expect(s.difficulty).toBe(difficulty);
  s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]});s=await g.execute(s.id,s.revision,{type:'fight'});
  expect(s.battle!.frames[0].bot.maxHealth).toBe(500);expect(s.battle!.frames[0].bot.maxMana).toBe(100);
  expect(JSON.stringify(s)).not.toContain('bonusGoldPerRound');expect(JSON.stringify(s)).not.toContain('lastPreparedRound');
 }
});
it('rejects unknown difficulties without replacing the current run',async()=>{
 const g=new LocalGameGateway();const s=await g.start('hard');
 await expect(g.start('unknown' as Difficulty)).rejects.toThrow('Unknown difficulty');
 const next=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]});expect(next.difficulty).toBe('hard');
});
