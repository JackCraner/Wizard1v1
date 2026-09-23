export interface CardBounds {index:number;x:number;y:number;width:number;height:number}
export function handDropIntent(cards:CardBounds[],spells:string[],xp:number[],from:number,x:number,y:number) {
 const sorted=[...cards].sort((a,b)=>a.index-b.index);
 const hit=[...sorted].reverse().find(b=>{
  const visible=Math.min(b.width,(sorted.find(n=>n.index===b.index+1)?.x??b.x+b.width)-b.x);
  return b.index!==from&&x>b.x+visible*.22&&x<b.x+visible*.78&&y>=b.y&&y<=b.y+b.height;
 });
 if(hit&&spells[hit.index]===spells[from]&&(xp[from]??0)<3&&(xp[hit.index]??0)<3)return {to:hit.index,merge:true,slot:hit.index};
 const slot=sorted.filter(b=>x>b.x+b.width/2).length;
 return {to:Math.max(0,Math.min(spells.length-1,slot-(slot>from?1:0))),merge:false,slot};
}
// Later cards are drawn above earlier ones in the overlapping hand.
export function cardUnderPointer(cards:CardBounds[],x:number,y:number):number|undefined {
 return [...cards].sort((a,b)=>b.index-a.index).find(b=>x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height)?.index;
}
