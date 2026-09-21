export interface CardBounds {index:number;x:number;y:number;width:number;height:number}
// Later cards are drawn above earlier ones in the overlapping hand.
export function cardUnderPointer(cards:CardBounds[],x:number,y:number):number|undefined {
 return [...cards].sort((a,b)=>b.index-a.index).find(b=>x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height)?.index;
}
