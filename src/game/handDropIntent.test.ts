import {expect,it} from 'vitest';
import {handDropIntent} from './shopDrop';
const cards=[0,1,2].map(index=>({index,x:index*100,y:0,width:80,height:100}));
it('merges matching centers but inserts between matching copies',()=>{
 expect(handDropIntent(cards,['spark','ember','spark'],[0,0,0],0,240,50)).toMatchObject({merge:true,to:2});
 expect(handDropIntent(cards,['spark','ember','spark'],[0,0,0],0,200,50)).toEqual({merge:false,to:1,slot:2});
});
it('supports both ends, never merges maxed cards or an off-row pointer',()=>{
 expect(handDropIntent(cards,['spark','ember','spark'],[0,0,0],2,-10,50).to).toBe(0);
 expect(handDropIntent(cards,['spark','ember','spark'],[0,0,0],0,300,50).to).toBe(2);
 expect(handDropIntent(cards,['spark','ember','spark'],[0,0,3],0,240,50).merge).toBe(false);
 expect(handDropIntent(cards,['spark','ember','spark'],[3,0,0],0,240,50).merge).toBe(false);
 expect(handDropIntent(cards,['spark','ember','spark'],[0,0,0],0,240,150).merge).toBe(false);
});
