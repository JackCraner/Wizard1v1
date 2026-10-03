import {combatCard} from './combatCards';
import type {CombatFrame} from './model';

export type HealthReceipt={key:string;label:string;amount:number;healing:boolean;critical:boolean;target:string;periodic:boolean;slot:number;start:number;end:number};

/** Aggregate repeated hits from one source, but never mix healing with damage or
 * hide periodic ticks. Four fixed cells per page prevent collisions at any size. */
export function healthFeedback(frame:CombatFrame,side:'player'|'bot'):HealthReceipt[]{
 const groups=new Map<string,HealthReceipt>();
 const source=(owner:'player'|'bot'|undefined,index:number|undefined)=>owner&&index!==undefined&&index>=0&&frame[owner].spells[index]?combatCard(frame[owner],index).name:undefined;
 const add=(label:string,amount:number,healing:boolean,critical:boolean,target:string,periodic:boolean)=>{
  if(amount<=0&&!(amount===0&&healing&&periodic))return;
  const key=[label,healing,target,periodic].join(':');
  const old=groups.get(key);
  if(old){old.amount+=amount;old.critical||=critical;}
  else groups.set(key,{key,label,amount,healing,critical,target,periodic,slot:0,start:0,end:1});
 };
 for(const event of frame.damageEvents??[]){
  if(event.side!==side)continue;
  const label=event.kind==='dot'?(event.status??'Ongoing'):event.kind==='cost'?'Self cost':source(event.sourceSide,event.sourceIndex)??'Damage';
  add(label[0].toUpperCase()+label.slice(1),event.amount,false,event.critical,event.target??'wizard',event.kind!=='hit');
 }
 for(const event of frame.healingEvents??[]){
  if(event.side!==side)continue;
  add(event.kind==='hot'?'Regeneration':source(side,event.sourceIndex)??'Healing',event.amount,true,false,event.target??'wizard',event.kind==='hot');
 }
 const all=[...groups.values()],early=all.filter(r=>r.periodic),late=all.filter(r=>!r.periodic);
 const place=(items:HealthReceipt[],start:number,end:number)=>{
  const pages=Math.max(1,Math.ceil(items.length/4)),duration=(end-start)/pages;
  items.forEach((r,i)=>{r.slot=i%4;r.start=start+Math.floor(i/4)*duration;r.end=r.start+duration;});
 };
 place(early,0,late.length?.52:1);
 // Direct results coincide with the card's impact; ongoing ticks appear first.
 place(late,.58*.9,1);
 return [...early,...late];
}
