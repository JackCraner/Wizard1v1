import config from './shopOdds.json';
import { expect, it } from 'vitest';
import { shopRankOdds, validateShopOdds } from './shopOdds';
import { offersFor } from '../game/shop';
import { SPELLS, RULES } from '../game/engine';

it('uses configured odds from round one and advances odds by round',()=>{
  expect(shopRankOdds(1)).toEqual(config.rounds[0].rankPercent);
  expect(shopRankOdds(2)).toEqual(config.rounds[1].rankPercent);
  expect(shopRankOdds(100)).toEqual(shopRankOdds(10));
  expect(()=>shopRankOdds(0)).toThrow();
});
it('matches configured rank frequencies without catalogue-size or domain bias',()=>{
  for(const round of [1,2,5,10]) {
    const counts=[0,0,0,0,0];
    for(let roll=0;roll<5000;roll++)for(const id of offersFor(round,roll).shop)counts[SPELLS[id].stars-1]++;
    shopRankOdds(round).forEach((percent,i)=>{
      if(!percent)expect(counts[i]).toBe(0);
      else expect(Math.abs(counts[i]/(5000*RULES.shopSlots)*100-percent)).toBeLessThan(2);
    });
  }
});
it('preserves rank odds while allowing off-domain pivots',()=>{
  // Every domain remains eligible after buying spells.
  const counts=[0,0,0,0,0];
  for(let roll=0;roll<3000;roll++)for(const id of offersFor(10,roll,['wrath','current']).shop){
    counts[SPELLS[id].stars-1]++;
  }
  expect(counts[4]).toBeGreaterThan(0);
  shopRankOdds(10).forEach((weight,i)=>expect(Math.abs(counts[i]/(3000*RULES.shopSlots)-weight/100)).toBeLessThan(.02));
});
it('rejects invalid balancing tables with clear errors',()=>{
  expect(()=>validateShopOdds([])).toThrow('round 1');
  expect(()=>validateShopOdds([{fromRound:1,rankPercent:[99,0,0,0,0]}])).toThrow('totaling 100');
  expect(()=>validateShopOdds([{fromRound:1,rankPercent:[90,10,0,0,0]}])).not.toThrow();
  expect(()=>validateShopOdds([{fromRound:1,rankPercent:[100,0,0,0,0]},{fromRound:1,rankPercent:[80,20,0,0,0]}])).toThrow('increase');
});
