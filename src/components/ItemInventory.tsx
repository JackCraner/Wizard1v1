import {useRef,useState} from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View,type ImageSourcePropType} from 'react-native';
import {EQUIPMENT,equipped,itemTotals} from '../game/equipment';
import type {ItemInventory as Inventory} from '../game/model';

// Add static require('../../assets/items/...') entries here as item art arrives.
export const ITEM_ART:Record<string,ImageSourcePropType>={};
const colors:Record<string,string>={neutral:'#d2c29a',nature:'#a9d58b',fire:'#efa079',water:'#91cde5',holy:'#f1d681'};
export function ItemIcon({id,count,size=30,onPress}:{id:string;count?:number;size?:number;onPress?:()=>void}){
 const item=EQUIPMENT[id];if(!item)return null;
 return <Pressable accessibilityRole={onPress?'button':undefined} accessibilityLabel={item.name+(count===undefined?'':` ×${count}`)+(onPress?'. Inspect item':'')} onPress={onPress} style={{width:size,height:size,borderWidth:1,borderColor:colors[item.affinity],borderRadius:5,backgroundColor:'#191711',alignItems:'center',justifyContent:'center'}}>
  {ITEM_ART[id]?<Image accessible={false} source={ITEM_ART[id]} style={{width:'100%',height:'100%'}}/>:<Text style={{color:colors[item.affinity],fontSize:size*.37,fontWeight:'800'}}>{item.symbol}</Text>}
  {count!==undefined&&<Text numberOfLines={1} adjustsFontSizeToFit style={{position:'absolute',bottom:-2,right:-2,minWidth:15,maxWidth:size+8,fontSize:9,fontWeight:'900',color:'#fff2c9',backgroundColor:'#090c10',paddingHorizontal:2,borderRadius:3}}>×{count}</Text>}
 </Pressable>;
}
export function ItemInventoryView({inventory={},maxVisible=6,size=28,vertical=false,showAll=false,onSelectItem,onInspect}:{inventory?:Inventory;maxVisible?:number;size?:number;vertical?:boolean;showAll?:boolean;onSelectItem?:(id:string)=>void;onInspect?:()=>()=>void}){
 const items=equipped({equipment:inventory}),total=items.reduce((n,i)=>n+i.stacks,0);
 const [open,setOpen]=useState(false),[selected,setSelected]=useState<string|null>(null);const resume=useRef<(()=>void)|null>(null);
 const begin=()=>{if(!open){resume.current=onInspect?.()??null;setOpen(true);}};
 const close=()=>{setOpen(false);setSelected(null);resume.current?.();resume.current=null;};
 const inspect=(id:string)=>{if(onSelectItem&&!open){onSelectItem(id);return;}begin();setSelected(id);};
 const item=selected?EQUIPMENT[selected]:null;
 return <View style={{minHeight:size,flexShrink:1}}>
  <View style={{flexDirection:vertical&&!showAll?'column':'row',flexWrap:vertical&&!showAll?'nowrap':'wrap',gap:5,alignItems:'center'}}>
   {(showAll?items:items.slice(0,maxVisible)).map(i=><ItemIcon key={i.id} id={i.id} count={i.stacks} size={size} onPress={()=>inspect(i.id)}/>)}
   {!items.length&&<Text style={{color:'#ab997b',fontSize:9}}>No items</Text>}
   {!showAll&&items.length>maxVisible&&<Pressable accessibilityRole="button" accessibilityLabel={`View all ${items.length} item types, ${total} total stacks`} onPress={()=>{begin();setSelected(null);}} style={{height:size,minWidth:size,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#967945',borderRadius:4,backgroundColor:'#30261a'}}><Text style={{color:'#f3d794',fontSize:10}}>+{items.length-maxVisible}</Text></Pressable>}
  </View>
  <Modal visible={open} transparent animationType="fade" onRequestClose={close}><View style={{flex:1,padding:14,alignItems:'center',justifyContent:'center',backgroundColor:'#000b'}}><View accessibilityViewIsModal style={{width:'100%',maxWidth:570,maxHeight:'94%',padding:14,gap:10,backgroundColor:'#211a12',borderWidth:1,borderColor:'#b4955d',borderRadius:8}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={{flex:1,color:'#f0ddb3',fontSize:18,fontWeight:'700'}}>{item?`${item.name} ×${inventory[item.id]??0}`:`Items · ${total} stacks`}</Text><Pressable accessibilityRole="button" onPress={close} style={{padding:10}}><Text style={{color:'#ffe1a0'}}>Close</Text></Pressable></View>
   <ScrollView style={{flexGrow:0}} contentContainerStyle={{gap:10,paddingBottom:5}}>{item?<>
    <ItemIcon id={item.id} count={inventory[item.id]} size={48}/><Text style={{color:'#e0d0ad'}}>{'★'.repeat(item.stars)} · {item.affinity}</Text><Text style={{color:'#e0d0ad'}}>{item.description}</Text><Text style={{color:'#f4d889',fontWeight:'700'}}>Current bonus</Text>{itemTotals(item,inventory[item.id]??0).map((line,i)=><Text key={i} style={{color:'#c6e3b3'}}>{line}</Text>)}
    <Pressable accessibilityRole="button" onPress={()=>setSelected(null)} style={{padding:8}}><Text style={{color:'#e5c386'}}>‹ All items</Text></Pressable>
   </>:<View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{items.map(i=><View key={i.id} style={{width:90,gap:6,alignItems:'center'}}><ItemIcon id={i.id} count={i.stacks} size={42} onPress={()=>setSelected(i.id)}/><Text numberOfLines={2} style={{fontSize:10,color:'#e5d3b0',textAlign:'center'}}>{i.name}</Text></View>)}</View>}</ScrollView>
  </View></View></Modal>
 </View>;
}
