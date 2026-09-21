import {expect,it} from 'vitest';
import {cardUnderPointer} from './shopDrop';
const cards=[{index:0,x:100,y:200,width:60,height:90},{index:1,x:140,y:200,width:60,height:90}];
it('targets the visible top card when hand cards overlap',()=>{
 expect(cardUnderPointer(cards,150,240)).toBe(1);
 expect(cardUnderPointer([...cards].reverse(),150,240)).toBe(1);
 expect(cardUnderPointer(cards,120,240)).toBe(0);
});
it('does not merge in empty hand space or outside the vertical card bounds',()=>{
 expect(cardUnderPointer(cards,240,240)).toBeUndefined();
 expect(cardUnderPointer(cards,120,190)).toBeUndefined();
 expect(cardUnderPointer(cards,120,300)).toBeUndefined();
 expect(cardUnderPointer([],120,240)).toBeUndefined();
});
