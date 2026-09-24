import {beforeEach,expect,it,vi} from 'vitest';
const harness=vi.hoisted(()=>({refs:[] as {current:unknown}[],cursor:0,effect:undefined as undefined|(()=>void|(()=>void)),now:0,timings:[] as {config:{duration:number;useNativeDriver:boolean};stop:ReturnType<typeof vi.fn>;finish?: (result:{finished:boolean})=>void}[]}));
vi.mock('react',()=>({
 useRef:(initial:unknown)=>harness.refs[harness.cursor++]??(harness.refs[harness.cursor-1]={current:initial}),
 useEffect:(effect:()=>void|(()=>void))=>{harness.effect=effect;},
}));
vi.mock('react-native',()=>({
 Platform:{OS:'android'},Easing:{linear:'linear'},
 Animated:{Value:class {constructor(public value:number){} setValue(value:number){this.value=value;}},
 timing:(_value:unknown,config:{duration:number;useNativeDriver:boolean})=>{
  const animation={config,stop:vi.fn(),finish:undefined as undefined|((result:{finished:boolean})=>void),start:(callback:(result:{finished:boolean})=>void)=>{animation.finish=callback;}};
  harness.timings.push(animation);return animation;
 }},
}));
import {useFeedbackProgress} from './useFeedbackProgress';
function render(playing:boolean,duration:number,delay=0,native=true,onDone?:()=>void){
 harness.cursor=0;
 const value=useFeedbackProgress(playing,duration,onDone,delay,native);
 const cleanup=harness.effect?.();
 return {value,cleanup:typeof cleanup==='function'?cleanup:()=>{}};
}
beforeEach(()=>{harness.refs=[];harness.cursor=0;harness.now=0;harness.timings=[];vi.spyOn(performance,'now').mockImplementation(()=>harness.now);});
it('freezes linear progress while paused and rescales only remaining time on speed changes',()=>{
 const first=render(true,2000);harness.now=500;first.cleanup();
 expect(harness.timings[0].stop).toHaveBeenCalledOnce();
 const paused=render(false,2000);harness.now=9500;paused.cleanup();
 const resumed=render(true,1000);
 expect(harness.timings[1].config).toMatchObject({duration:750,useNativeDriver:true});
 expect((resumed.value as unknown as {value:number}).value).toBe(.25);
 resumed.cleanup();
});
it('preserves a pending trigger delay across pause and speed changes',()=>{
 const first=render(true,2000,500,false);harness.now=250;first.cleanup();
 render(false,2000,500,false);harness.now=4000;
 render(true,1000,250,false);
 expect(harness.timings[1].config).toMatchObject({duration:1125,useNativeDriver:false});
});
it('does not restart completed feedback or call completion after cancellation',()=>{
 const done=vi.fn();const first=render(true,1000,0,true,done);
 harness.timings[0].finish?.({finished:false});expect(done).not.toHaveBeenCalled();
 harness.now=1000;harness.timings[0].finish?.({finished:true});first.cleanup();
 render(true,500,0,true,done);
 expect(done).toHaveBeenCalledOnce();expect(harness.timings).toHaveLength(1);
});
