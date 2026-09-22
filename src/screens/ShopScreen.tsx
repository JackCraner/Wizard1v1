import {useState} from 'react';
import {View} from 'react-native';
import {cardAt} from '../game/upgrades';
import {Leaderboard} from './Leaderboard';
import {SpellCard,CardPreview} from '../components/cards/SpellCard';
import {SpellDialog,type SpellSelection} from './SpellDialog';
import {CompactShop} from './CompactShop';
import type {Command,Session} from '../game/model';
export function ShopScreen({session,busy,act,onMenu,onLibrary,error}:{session:Session;busy:boolean;act:(command:Command)=>void;onMenu:()=>void;onLibrary:()=>void;error?:string}){
 const [leaderboard,setLeaderboard]=useState(false);const [selection,setSelection]=useState<SpellSelection|null>(null);
 return <View style={{flex:1}}><CompactShop session={session} busy={busy} act={act} onMenu={onMenu} onLibrary={onLibrary} onLeaderboard={()=>setLeaderboard(true)} error={error}
 inspectSpell={(id,shopSlot)=>setSelection({kind:'shop',id,shopSlot})} inspectHand={index=>setSelection({kind:'hand',index})}
 renderCard={(id,expanded,index)=><SpellCard {...cardAt(id,index===undefined?0:session.spellXp?.[index])} shop={index===undefined} compact={!expanded}/>}
 renderPreview={(id,height,width,index)=><CardPreview card={cardAt(id,index===undefined?0:session.spellXp?.[index])} height={height} width={width}/>}/>
 <Leaderboard lobby={session.lobby} visible={leaderboard} onClose={()=>setLeaderboard(false)}/>
 {selection&&<SpellDialog selection={selection} session={session} busy={busy} error={error} act={act} onClose={()=>setSelection(null)} onSelect={setSelection}/>}</View>;
}
