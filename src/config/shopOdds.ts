import config from './shopOdds.json';

export interface ShopOddsRow { fromRound: number; rankPercent: number[] }
export function validateShopOdds(rows: ShopOddsRow[]) {
  if (!rows.length || rows[0].fromRound !== 1) throw new Error('Shop odds must begin at round 1.');
  rows.forEach((row,i)=>{
    if (!Number.isInteger(row.fromRound) || (i>0 && row.fromRound<=rows[i-1].fromRound)) throw new Error('Shop odds rounds must increase.');
    if (row.rankPercent.length!==5 || row.rankPercent.some(n=>!Number.isFinite(n)||n<0) || Math.abs(row.rankPercent.reduce((a,b)=>a+b,0)-100)>0.0001) throw new Error('Shop rank percentages must contain five nonnegative numbers totaling 100.');
  });
}
validateShopOdds(config.rounds);
export function shopRankOdds(round: number): readonly number[] {
  if(!Number.isInteger(round)||round<1) throw new Error('Shop round must be a positive integer.');
  let row=config.rounds[0];
  for(const next of config.rounds) { if(next.fromRound>round)break;row=next; }
  return row.rankPercent;
}
