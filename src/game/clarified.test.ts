import { describe, expect, it } from 'vitest';
import { canAddSpell, channelPower, fighter, simulate } from './engine';
import { offersFor } from './shop';
import { LocalGameGateway } from '../services/localGateway';
import type { Session } from './model';

describe('two domain decks',()=>{
  it('validates combat input and prevents third-domain offers',()=>{
    expect(()=>fighter('A',['wrath','splash','ember'])).toThrow('2 domains');
    const a=fighter('A',['wrath','splash']);a.spells.push('ember');
    expect(()=>simulate(a,fighter('B',['wrath']))).toThrow('2 domains');
    expect(canAddSpell(['wrath','splash'],'moonfire')).toBe(true);
    expect(canAddSpell(['wrath','splash'],'ember')).toBe(false);
    for(let n=0;n<80;n++) expect(offersFor(1,n,['wrath','splash']).shop.every(id=>canAddSpell(['wrath','splash'],id))).toBe(true);
  });
  it('rejects a stale third-domain offer without spending gold or changing revision',async()=>{
    const g=new LocalGameGateway();await g.start();
    // Seed a shop offer left over from before the second domain was chosen.
    const internal=(g as unknown as {session:Session}).session;
    internal.spells=['wrath','splash'];internal.shop=['ember'];
    await expect(g.execute(internal.id,internal.revision,{type:'buy',spell:'ember'})).rejects.toThrow('2 domains');
    expect(internal.gold).toBe(10);expect(internal.revision).toBe(0);
  });
  it('keeps every bot within two domains',async()=>{
    const g=new LocalGameGateway();let s=await g.start();s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]});
    for(let round=0;round<3;round++) {s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});}
    expect(s.round).toBe(4);
  });
});

describe('Channel groups',()=>{
  it('uses the full adjacent run for each copy, with no wrapping',()=>{
    const deck=['undertow','undertow','undertow','splash','undertow'];
    expect(deck.map((_,i)=>channelPower(deck,i))).toEqual([3,3,3,1,1]);
    const result=simulate(fighter('A',deck),fighter('B',['splash']));
    expect(result.frames.slice(1,4).map(f=>f.player.statuses.tide)).toEqual([3,5,7]);
    expect(result.frames.slice(1,4).map(f=>f.bot.health)).toEqual([497,494,491]);
    expect(result.frames[3].player.mana).toBe(70);
  });
  it('recalculates groups after reordering and scales Spore Drain damage and Growth',()=>{
    expect(channelPower(['undertow','splash','undertow'],0)).toBe(1);
    expect(channelPower(['splash','undertow','undertow'],1)).toBe(2);
    const result=simulate(fighter('A',['spore-drain','spore-drain']),fighter('B',['splash']));
    expect(result.frames[1].bot.health).toBe(480);
    expect(result.frames[1].player.statuses.growth).toBe(2);
    expect(result.frames[2].player.statuses.growth).toBe(3);
  });
});

describe('timed Guard and Phoenix',()=>{
  it('blocks direct and periodic damage until Guard expires without consuming on hits',()=>{
    const a=fighter('A',['splash']);a.statuses={guard:2,moonfire:4};
    const result=simulate(a,fighter('B',['wrath','wrath','wrath']));
    expect(result.frames.slice(1,4).map(f=>f.player.health)).toEqual([500,480,450]);
    expect(result.frames.slice(1,4).map(f=>f.player.statuses.guard??0)).toEqual([1,0,0]);
  });
  it('applies Guard before simultaneous damage, adds duration, and blocks self damage',()=>{
    const result=simulate(fighter('A',['tidal-guard','tidal-guard']),fighter('B',['wrath']));
    expect(result.frames[1].player.health).toBe(500);
    expect(result.frames[2].player.statuses.guard).toBe(3);
    const a=fighter('A',['from-ash']);a.statuses.guard=1;
    expect(simulate(a,fighter('B',['splash'])).frames[1].player.health).toBe(500);
  });
  it('rebirths on lethal direct and periodic damage with half maxima, until expiration',()=>{
    const a=fighter('A',['splash'],[{health:10,mana:10}]);a.health=10;a.statuses.phoenix=3;
    const direct=simulate(a,fighter('B',['wrath']));
    expect(direct.frames[1].player.health).toBe(255);
    expect(direct.frames[1].player.mana).toBe(55);
    expect(direct.frames[1].player.statuses.phoenix).toBe(2);
    a.statuses.moonfire=3;
    const periodic=simulate(a,fighter('B',['splash']));
    expect(periodic.frames[1].player.health).toBe(255);
    expect(periodic.frames[1].player.mana).toBe(60); // rebirth then Splash
    const expired=fighter('A',['splash']);expired.health=10;expired.statuses.phoenix=1;
    expect(simulate(expired,fighter('B',['seed-shot'])).frames.at(-1)?.player.health).toBe(0);
  });
  it('allows repeated rebirths during the window and resolves both sides symmetrically',()=>{
    const a=fighter('A',['wrath','wrath','wrath','wrath'],[{health:-480}]);a.statuses.phoenix=3;
    const result=simulate(a,a);
    expect(result.frames.slice(1,5).map(f=>f.player.health)).toEqual([10,10,0]);
    expect(result.outcome).toBe('draw');
    expect(result.frames[2].messages.filter(m=>m.includes('reborn'))).toHaveLength(2);
  });
  it('casts Phoenix at its listed cost and duration',()=>{
    const result=simulate(fighter('A',['phoenix','pyroblast']),fighter('B',['splash']));
    expect(result.frames[1].player.mana).toBe(85);
    expect(result.frames[2].player.statuses.phoenix).toBe(5);
    expect(result.frames[3].player.statuses.phoenix).toBe(4);
  });
});
