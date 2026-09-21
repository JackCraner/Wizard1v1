import { deckXp } from './upgrades';
import { prepareBot, botFighter, type BotStates } from './botAI';
import settings from '../config/tournament.json';
import { fighter, RULES, simulate } from './engine';
import { equipmentModifiers } from './shop';
import type { Lobby, Session, SpellId } from './model';

export function createLobby():Lobby {
 return {winsToWin:settings.winsToWin,finished:false,winnerIds:[],players:[
  {id:'player',name:'You',human:true,wins:0,losses:0,draws:0,deck:[],lastCombatDeck:[],lastCombatRound:null},
  ...settings.botNames.map((name,i)=>({id:`bot-${i+1}`,name,human:false,wins:0,losses:0,draws:0,deck:[] as SpellId[],lastCombatDeck:[] as SpellId[],lastCombatRound:null})),
 ]};
}

// Circle scheduling: everyone fights once per round and meets every opponent
// once per seven rounds. Pair order never determines the tournament winner.
export function roundPairings(ids:string[],round:number):[string,string][] {
 const ring=[...ids];
 for(let i=0;i<(round-1)%(ring.length-1);i++)ring.splice(1,0,ring.pop()!);
 return Array.from({length:ring.length/2},(_,i)=>[ring[i],ring[ring.length-1-i]]);
}

export function resolveLobbyRound(session:Session,botStates:BotStates) {
 const lobby=session.lobby;
 if(lobby.finished)throw new Error('This game is complete. Start a new game.');
 for(const [i,p] of lobby.players.entries()) {
  p.deck=p.human?[...session.spells]:prepareBot(botStates[p.id],p.deck,session.round,i,session.difficulty);
  p.deckXp=p.human?deckXp(p.deck,session.spellXp):deckXp(p.deck,botStates[p.id].spellXp);
  p.lastCombatXp=[...p.deckXp];p.lastCombatDeck=[...p.deck];p.lastCombatRound=session.round;
 }
 for(const [aId,bId] of roundPairings(lobby.players.map(p=>p.id),session.round)) {
  let a=lobby.players.find(p=>p.id===aId)!,b=lobby.players.find(p=>p.id===bId)!;
  if(b.human)[a,b]=[b,a];
  const battle=simulate(a.human?fighter(a.name,a.deck,equipmentModifiers(session.equipment),session.spellXp):botFighter(a.name,a.deck,botStates[a.id]),b.human?fighter(b.name,b.deck,equipmentModifiers(session.equipment),session.spellXp):botFighter(b.name,b.deck,botStates[b.id]),RULES.seed+session.round*101+lobby.players.indexOf(a)*17);
  if(battle.outcome==='draw'){a.draws++;b.draws++;}
  else {const winner=battle.outcome==='victory'?a:b,loser=winner===a?b:a;winner.wins++;loser.losses++;}
  if(a.human)session.battle=battle;
 }
 const you=lobby.players.find(p=>p.human)!;
 session.wins=you.wins;session.losses=you.losses;
 lobby.winnerIds=lobby.players.filter(p=>p.wins>=lobby.winsToWin).map(p=>p.id);
 lobby.finished=lobby.winnerIds.length>0;
 session.phase='result';
}
