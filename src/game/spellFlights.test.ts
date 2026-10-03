import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {spellFlights,unclaimedFeedback} from './spellFlights';
import {continuousCombatFrame} from './playback';
import type {CombatFrame} from './model';

it('only launches completed casts, and treats an enemy status spell as hostile',()=>{
 const player=fighter('A',['dual-hex','healing-seed']);
 const frame:CombatFrame={tick:1,player,bot:fighter('B',['spark']),messages:[],events:[
  {side:'player',spell:'dual-hex',index:0,status:'cast',critical:false},
  {side:'player',spell:'healing-seed',index:1,status:'skipped',critical:false}],
  notices:[{side:'player',index:1,status:'trigger',text:'TRIGGER'}]};
 expect(spellFlights(frame)).toMatchObject([{offensive:true,target:'bot',index:0}]);
 expect(spellFlights({...frame,events:[]})).toEqual([]);
});

it('keeps self costs and periodic damage separate, and does not return broken cards',()=>{
 const player=fighter('A',['spark']);player.broken=[0];
 const frame:CombatFrame={tick:1,player,bot:fighter('B',['spark']),messages:[],events:[{side:'player',spell:'spark',index:0,status:'cast',critical:true}],damageEvents:[
  {side:'bot',sourceSide:'player',sourceIndex:0,kind:'hit',target:'ward',amount:30,critical:true},
  {side:'bot',sourceSide:'player',sourceIndex:0,kind:'hit',target:'imp',amount:50,critical:true},
  {side:'player',sourceSide:'player',sourceIndex:0,kind:'cost',amount:10,critical:false},
  {side:'bot',sourceSide:'player',sourceIndex:0,kind:'dot',amount:12,critical:false}]};
 expect(spellFlights(frame)[0]).toMatchObject({damage:50,ward:30,critical:true,returns:false});
 expect(unclaimedFeedback(frame).damageEvents?.map(e=>e.kind)).toEqual(['cost','dot']);
});

it('accounts for every damage and healing number exactly once through a full two-sided duel',()=>{
 const battle=simulate(fighter('A',['healing-seed','backdraft','spark','dual-hex']),fighter('B',['ritual','leech','radiance','blood-pact']),123);
 for(let index=0;index<battle.frames.length;index++){
  const frame=continuousCombatFrame(battle,index),before=JSON.stringify(frame);
  const flights=spellFlights(frame),rest=unclaimedFeedback(frame);
  expect(flights.reduce((n,f)=>n+f.damage+f.ward,0)+(rest.damageEvents??[]).reduce((n,e)=>n+e.amount,0)).toBe((frame.damageEvents??[]).reduce((n,e)=>n+e.amount,0));
  expect(flights.reduce((n,f)=>n+f.healing,0)+(rest.healingEvents??[]).reduce((n,e)=>n+e.amount,0)).toBe((frame.healingEvents??[]).reduce((n,e)=>n+e.amount,0));
  expect(JSON.stringify(frame)).toBe(before);
 }
});
