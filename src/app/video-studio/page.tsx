'use client'
import React,{useState,useRef,useEffect,useCallback,useMemo}from'react'
import{useAuth}from'@/lib/auth-context'
import{Button}from'@/components/ui/Button'
import{Input}from'@/components/ui/Input'
import{Card,CardHeader}from'@/components/ui/Card'
import{VideoClip,VideoTransition,VideoTransitionType,VideoAspectRatio}from'@/lib/types'
import{useFFmpeg}from'@/hooks/useFFmpeg'
const ASPECT=[{value:'16:9',label:'Landscape 16:9'},{value:'9:16',label:'Portrait 9:16'}]
const TXTYPES=[{value:'fade',label:'Crossfade'},{value:'fade-black',label:'Fade-Black'},{value:'slide',label:'Slide-Left'},{value:'zoom',label:'Zoom-In'},{value:'none',label:'None'}]
const DTX=1.0
interface Brand{agentName:string;phone:string;email:string;logoDataUrl:string|null}
interface Audio{masterVolume:number;musicVolume:number;sfxVolume:number}
interface Project{clips:VideoClip[];transitions:VideoTransition[];branding:Brand;aspectRatio:VideoAspectRatio;audio:Audio;projectName:string}
const INIT:Project={clips:[],transitions:[],branding:{agentName:'',phone:'',email:'',logoDataUrl:null},aspectRatio:'16:9',audio:{masterVolume:0.8,musicVolume:0.4,sfxVolume:0.6},projectName:'Untitled Walkthrough'}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8)
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v))
const aspectSz=(a:VideoAspectRatio,w:number)=>{switch(a){case'16:9':return{w,h:Math.round(w*9/16)};case'9:16':return{w,h:Math.round(w*16/9)};case'1:1':return{w,h:w};default:return{w,h:Math.round(w*9/16)}}}
const fmt=(s:number)=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')
class MusicEngine{private c:AudioContext|null=null;private mg:GainNode|null=null;private pg:GainNode|null=null;private on=false;private tid:number|null=null;private nodes:OscillatorNode[]=[]
async init(){if(!this.c){this.c=new AudioContext();this.mg=this.c.createGain();this.pg=this.c.createGain();this.pg.gain.value=0.4;this.mg.connect(this.c.destination);this.pg.connect(this.mg)}}
setMaster(v:number){if(this.mg&&this.c)this.mg.gain.setTargetAtTime(v,this.c.currentTime,0.05)}
setMusic(v:number){if(this.pg&&this.c)this.pg.gain.setTargetAtTime(v,this.c.currentTime,0.05)}
start(){if(!this.c)this.init();this.c?.resume();this.on=true;this.nxt()}
stop(){this.on=false;if(this.tid!==null)clearTimeout(this.tid);this.nodes.forEach(n=>{try{n.stop();n.disconnect()}catch{}});this.nodes=[]}
destroy(){this.stop();this.c?.close();this.c=null}
private nxt(){if(!this.on||!this.c)return;const sc=[261.63,293.66,329.63,392,440,523.25,587.33,659.25];const f=sc[Math.floor(Math.random()*sc.length)];this.tone(f,0.5,1.4);this.tid=window.setTimeout(()=>this.nxt(),500+Math.random()*900)}
private tone(f:number,v:number,d:number){if(!this.c)return;const o=this.c.createOscillator();const g=this.c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(v,this.c.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,this.c.currentTime+d);o.connect(g);g.connect(this.pg!);o.start();o.stop(this.c.currentTime+d);this.nodes.push(o);o.onended=()=>{this.nodes=this.nodes.filter(n=>n!==o)}}
}
const kb=(dur:number,t:number)=>{const p=clamp(t/Math.max(dur,0.1),0,1);const e=0.5-0.5*Math.cos(p*Math.PI);return{s:1+0.14*e,x:-0.05+0.1*e,y:-0.03+0.06*e}}
const bCross=(ctx:any,w:number,h:number,a:any,b:any,t:number)=>{if(a){ctx.globalAlpha=1-t;ctx.drawImage(a,0,0,w,h)}if(b){ctx.globalAlpha=t;ctx.drawImage(b,0,0,w,h)}ctx.globalAlpha=1}
const bFade=(ctx:any,w:number,h:number,a:any,b:any,t:number)=>{const bk=t<0.5?t*2:(1-t)*2;ctx.fillStyle='rgba(0,0,0,'+clamp(bk,0,1)+')';ctx.fillRect(0,0,w,h);if(t<0.5&&a){ctx.globalAlpha=1-t*2;ctx.drawImage(a,0,0,w,h);ctx.globalAlpha=1}else if(t>=0.5&&b){ctx.globalAlpha=(t-0.5)*2;ctx.drawImage(b,0,0,w,h);ctx.globalAlpha=1}}
const bSlide=(ctx:any,w:number,h:number,a:any,b:any,t:number)=>{const o=w*t;if(a)ctx.drawImage(a,-o,0,w,h);if(b)ctx.drawImage(b,w-o,0,w,h)}
const bZoom=(ctx:any,w:number,h:number,a:any,b:any,t:number)=>{const sa=1+0.3*t,sb=1+0.3*(1-t);const oxa=((w*sa)-w)/2,oya=((h*sa)-h)/2;const oxb=((w*sb)-w)/2,oyb=((h*sb)-h)/2;if(a)ctx.drawImage(a,-oxa,-oya,w*sa,h*sa);if(b)ctx.drawImage(b,-oxb,-oyb,w*sb,h*sb)}
const doTx=(ctx:any,w:number,h:number,tp:string,a:any,b:any,t:number)=>{switch(tp){case'fade':return bCross(ctx,w,h,a,b,t);case'fade-black':return bFade(ctx,w,h,a,b,t);case'slide':return bSlide(ctx,w,h,a,b,t);case'zoom':return bZoom(ctx,w,h,a,b,t);default:if(b)ctx.drawImage(b,0,0,w,h)}}
function drawBrand(ctx:any,w:number,h:number,b:Brand){const ch=Math.max(100,Math.round(h*0.20));const y=h-ch;const r=14;ctx.clearRect(0,y-4,w,ch+4);ctx.save();ctx.beginPath();ctx.moveTo(r,y);ctx.lineTo(w-r,y);ctx.quadraticCurveTo(w,y,w,y+r);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.lineTo(0,y+r);ctx.quadraticCurveTo(0,y,r,y);ctx.closePath();ctx.fillStyle='rgba(6,10,22,0.82)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1.4;ctx.stroke();ctx.restore();const sw=7;const gd=ctx.createLinearGradient(0,y,sw,y+ch);gd.addColorStop(0,'#c8102e');gd.addColorStop(1,'#0057a0');ctx.fillStyle=gd;ctx.beginPath();ctx.moveTo(0,y+r);ctx.lineTo(sw,y);ctx.lineTo(sw,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();const px=22,lx=px+sw;if(b.logoDataUrl){const sz=Math.min(ch-28,88);const li=new Image();li.src=b.logoDataUrl;const ly=y+(ch-sz)/2;ctx.save();ctx.beginPath();ctx.roundRect(lx-4,ly-4,sz+8,sz+8,12);ctx.clip();ctx.drawImage(li,lx,ly,sz,sz);ctx.restore()}else{const bx=lx+36,by=y+ch/2,br=26;ctx.beginPath();ctx.ellipse(bx-8,by+2,br*0.9,br*1.05,0,0,Math.PI*2);ctx.fillStyle='#6b0012';ctx.fill();ctx.beginPath();ctx.ellipse(bx+2,by-2,br*0.7,br*0.82,0,0,Math.PI*2);ctx.fillStyle='#d91a2b';ctx.fill();ctx.beginPath();ctx.ellipse(bx+5,by-3,br*0.42,br*0.52,0,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.moveTo(bx+2,by-14);ctx.lineTo(bx+18,by+8);ctx.lineTo(bx-14,by+8);ctx.closePath();ctx.fillStyle='#0057a0';ctx.fill();ctx.beginPath();ctx.ellipse(bx,by,br+4,br+4,0,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke()}const tl=b.logoDataUrl?lx+104:lx+64;let ty=y+ch*0.36;ctx.fillStyle='#fff';ctx.textBaseline='middle';if(b.agentName){ctx.font='bold '+Math.max(16,Math.round(w*0.028))+'px Inter,system-ui,sans-serif';ctx.fillText(b.agentName,tl,ty-1)}if(b.phone){ctx.font=Math.max(13,Math.round(w*0.022))+'px Inter,system-ui,sans-serif';ctx.fillStyle='#dde6f2';ctx.fillText('Tel: '+b.phone,tl,ty+20)}if(b.email){ctx.fillStyle='#b0bed1';ctx.fillText('E '+b.email,tl,ty+40)}}

export default function VideoStudioPage() {
  const { user } = useAuth()
  const { getVideoDuration } = useFFmpeg()
  const [proj, setProj] = useState<Project>(INIT)
  const [playing, setPlaying] = useState(false)
  const [playTime, setPlayTime] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportProg, setExportProg] = useState("")
  const [showExport, setShowExport] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mainRef = useRef<HTMLCanvasElement|null>(null)
  const offRef = useRef<HTMLCanvasElement|null>(null)
  const rafRef = useRef<number>(0)
  const playStart = useRef(0)
  const playOff = useRef(0)
  const audioRef = useRef<MusicEngine|null>(null)
  const imgCache = useRef(new Map())
  const vidRef = useRef<HTMLVideoElement|null>(null)
  const clips = useMemo(()=>proj.clips.slice().sort((a,b)=>a.sortOrder-b.sortOrder),[proj.clips])
  const totalDur = useMemo(()=>{let t=0;for(let i=0;i<clips.length;i++){t+=clips[i].trimEnd-clips[i].trimStart;if(i<clips.length-1){const tx=proj.transitions.find(tr=>tr.position===i);t+=tx?tx.duration:DTX}}return Math.max(t,0.1)},[clips,proj.transitions])
  const curIdx = useMemo(()=>{let acc=0;for(let i=0;i<clips.length;i++){const dur=clips[i].trimEnd-clips[i].trimStart;const tx=proj.transitions.find(tr=>tr.position===i)?.duration??DTX;if(playTime<acc+dur){const prog=clamp((playTime-(acc+dur-tx))/tx,0,1);const hasTr=i<clips.length-1&&playTime>=acc+dur-tx&&playTime<=acc+dur;return{i,lt:playTime-acc,dur,hasTr,prog,ttype:(proj.transitions.find(tr=>tr.position===i)?.type||'fade') as VideoTransitionType,next:hasTr?i+1:-1}}acc+=dur+tx}return{i:-1,lt:0,dur:1,hasTr:false,prog:0,ttype:'fade',next:-1}},[clips,playTime,proj.transitions])
  const loadImg = useCallback((url:string):Promise<HTMLImageElement>=>{const cached=imgCache.current.get(url);if(cached&&cached.complete)return Promise.resolve(cached);return new Promise((res,rej)=>{const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{imgCache.current.set(url,im);res(im)};im.onerror=()=>rej(new Error("img fail"));im.src=url})},[])
  const renderFrame = useCallback(async(time:number)=>{
    const cvs=mainRef.current;if(!cvs)return;const ctx=cvs.getContext("2d");if(!ctx)return;const w=cvs.width,h=cvs.height;if(!w||!h)return;
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#05070f";ctx.fillRect(0,0,w,h);
    const{i:i,lt,dur,hasTr,prog,ttype,next}=curIdx;
    if(i>=0&&i<clips.length){const clip=clips[i];const src=clip.url;const isV=src.startsWith("blob:")||/\.(mp4|webm|mov|avi)(\?.*)?$/i.test(src);
      if(isV){if(!vidRef.current){vidRef.current=document.createElement("video");vidRef.current.crossOrigin="anonymous";vidRef.current.muted=true;vidRef.current.preload="auto";vidRef.current.setAttribute("playsinline","")}const v=vidRef.current;if(v.src!==src)v.src=src;if(playing){const seek=clip.trimStart+lt;if(Math.abs(v.currentTime-seek)>0.3)v.currentTime=seek;if(v.paused)v.play().catch(()=>{})}const vw=v.videoWidth||w,vh=v.videoHeight||h;const sc=Math.max(w/Math.max(vw,1),h/Math.max(vh,1));const dw=vw*sc,dh=vh*sc;ctx.drawImage(v,(w-dw)/2,(h-dh)/2,dw,dh)}
      else{let img:HTMLImageElement|null=null;try{img=await loadImg(src)}catch{ctx.fillStyle="#111827";ctx.fillRect(0,0,w,h)}if(img){const k=kb(dur,lt);const iw=w*k.s,ih=h*k.s;ctx.drawImage(img,(w-iw)/2+k.x*w,(h-ih)/2+k.y*h,iw,ih)}}
      if(hasTr&&next>=0&&next<clips.length){const nc=clips[next];const isNV=nc.url.startsWith("blob:")||/\.(mp4|webm|mov|avi)(\?.*)?$/i.test(nc.url);if(!isNV){let ni:HTMLImageElement|null=null;try{ni=await loadImg(nc.url)}catch{}if(ni)doTx(ctx,w,h,ttype,null,ni,prog)}}
    }else{ctx.fillStyle="#1e293b";ctx.fillRect(0,0,w,h);ctx.fillStyle="#64748b";ctx.font="16px Inter,system-ui,sans-serif";ctx.textAlign="center";ctx.fillText("Add listing photos",w/2,h/2);ctx.textAlign="start"}
    drawBrand(ctx,w,h,proj.branding)
  },[clips,curIdx,loadImg,playing,proj.branding])
  const resize=useCallback(()=>{const c=mainRef.current;if(!c)return;const p=c.parentElement;if(!p)return;const sz=aspectSz(proj.aspectRatio,Math.min(960,p.clientWidth-8));c.width=sz.w;c.height=sz.h},[proj.aspectRatio])
  useEffect(()=>{resize();const loop=()=>{if(playing){const now=performance.now()/1000;const el=now-playStart.current+playOff.current;if(el>=totalDur){setPlaying(false);setPlayTime(0);playOff.current=0}else setPlayTime(el)}renderFrame(performance.now()/1000).catch(()=>{});rafRef.current=requestAnimationFrame(loop)};rafRef.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rafRef.current)},[playing,renderFrame,totalDur,resize])
  useEffect(()=>{window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize)},[resize])
  const togglePlay=useCallback(()=>{if(!clips.length)return;if(!playing){playStart.current=performance.now()/1000;playOff.current=playTime;audioRef.current?.start();setPlaying(true)}else{playOff.current=playTime;audioRef.current?.stop();setPlaying(false)}},[clips.length,playing,playTime])
  const stop=useCallback(()=>{playOff.current=0;setPlayTime(0);audioRef.current?.stop();setPlaying(false);if(vidRef.current){vidRef.current.pause();vidRef.current.src=""}},[clips.length,playing,playTime])
  const handleFiles=useCallback(async(files:FileList|File[])=>{setUploading(true);const nc:VideoClip[]=[];for(const f of Array.from(files)){if(!f.type.startsWith("image/")&&!f.type.startsWith("video/"))continue;const url=URL.createObjectURL(f);let d=5;if(f.type.startsWith("video/")){try{d=await getVideoDuration(url)}catch{}}nc.push({id:uid(),url,name:f.name,duration:d,trimStart:0,trimEnd:d,sortOrder:proj.clips.length+nc.length})}setProj(p=>({...p,clips:[...p.clips,...nc]}));setUploading(false)},[getVideoDuration,proj.clips.length])
  const setBranding=useCallback((p:Partial<Brand>)=>setProj(s=>({...s,branding:{...s.branding,...p}})),[])
  const setTx=useCallback((pos:number,p:Partial<VideoTransition>)=>{setProj(s=>{const ex=s.transitions.find(tr=>tr.position===pos);const nx={id:ex?.id||uid(),type:(p.type as VideoTransitionType)??ex?.type??'fade',duration:p.duration??ex?.duration??DTX,position:pos};return{...s,transitions:ex?s.transitions.map(tr=>tr.position===pos?nx:tr):[...s.transitions,nx]}})},[])
  const rmTx=useCallback((pos:number)=>setProj(s=>({...s,transitions:s.transitions.filter(tr=>tr.position!==pos)})),[])
  const rmClip=useCallback((id:string)=>setProj(s=>{const idx=s.clips.findIndex(c=>c.id===id);return{...s,clips:s.clips.filter(c=>c.id!==id),transitions:s.transitions.filter(tr=>tr.position!==idx)}}),[])
  const moveClip=useCallback((from:number,to:number)=>{setProj(s=>{const arr=[...s.clips].sort((a,b)=>a.sortOrder-b.sortOrder);const[m]=arr.splice(from,1);arr.splice(to,0,m);return{...s,clips:arr.map((c,i)=>({...c,sortOrder:i}))}})},[])
  const startExport=useCallback(async()=>{
    if(clips.length===0||exporting)return;setExporting(true);setExportProg("Preparing...");setShowExport(true)
    const{w,h}=aspectSz(proj.aspectRatio,1280)
    const cvs=document.createElement("canvas");cvs.width=w;cvs.height=h;offRef.current=cvs
    const ctx=cvs.getContext("2d")!;ctx.fillStyle="#05070f";ctx.fillRect(0,0,w,h)
    if(!audioRef.current)audioRef.current=new MusicEngine();await audioRef.current.init()
    audioRef.current.setMusic(proj.audio.musicVolume);audioRef.current.setMaster(proj.audio.masterVolume);audioRef.current.start()
    const stream=cvs.captureStream(30);try{const a=audioRef.current as any;if(a.ctx){const dest=a.ctx.createMediaStreamDestination();if(a.pg)a.pg.connect(dest);dest.stream.getAudioTracks().forEach((t:any)=>stream.addTrack(t))}}catch{}
    const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm"
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5_000_000})
    const chunks:Blob[]=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}
    rec.onstop=()=>{const blob=new Blob(chunks,{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=proj.projectName.replace(/\s+/g,"_")+".webm";document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),5000);setExporting(false);setExportProg("");setShowExport(false);audioRef.current?.stop()}
    rec.start(1000);setExportProg("Rendering...")
    const fps=30,fd=1/fps;let cur=0
    while(cur<totalDur&&rec.state==="recording"){setPlayTime(cur);await renderFrame(cur);try{ctx.drawImage(mainRef.current!,0,0)}catch{};cur+=fd;await new Promise(r=>setTimeout(r,0));if(Math.floor(cur)!==Math.floor(cur-fd))setExportProg("Rendering... "+Math.round((cur/totalDur)*100)+"%")}
    if(rec.state==="recording")rec.stop()
  },[clips.length,exporting,proj,renderFrame,totalDur])
  useEffect(()=>{const t=setTimeout(()=>{try{localStorage.setItem("vsProj",JSON.stringify({clips:proj.clips,transitions:proj.transitions,branding:proj.branding,aspectRatio:proj.aspectRatio,audio:proj.audio,projectName:proj.projectName}))}catch{}},400);return()=>clearTimeout(t)},[proj])
  useEffect(()=>{try{const s=localStorage.getItem("vsProj");if(s){const p=JSON.parse(s);setProj(v=>({...v,...p,branding:p.branding??v.branding,audio:p.audio??v.audio}))}}catch{}},[])
  useEffect(()=>{audioRef.current?.setMaster(proj.audio.masterVolume);audioRef.current?.setMusic(proj.audio.musicVolume)},[proj.audio.masterVolume,proj.audio.musicVolume])
  return (
    <div className="flex h-[100svh] flex-col bg-[#0b0f19] text-slate-200 overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#0f1320] px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <Input value={proj.projectName} onChange={e=>setProj(p=>({...p,projectName:e.target.value}))} className="!bg-transparent !border-0 !text-white font-semibold w-52" placeholder="Project name…" />
        </div>
        <div className="flex items-center gap-2">
          <select value={proj.aspectRatio} onChange={e=>setProj(p=>({...p,aspectRatio:e.target.value as VideoAspectRatio}))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm">
            {ASPECT.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <button onClick={stop} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm">⏹ Stop</button>
          <button onClick={togglePlay} disabled={!clips.length} className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-40">{playing?'⏸ Pause':'▶ Play'}</button>
          <button onClick={startExport} disabled={exporting||!clips.length} className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40">{exporting?'⏳ Exporting…':'⬇ Export WebM'}</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-80 border-r border-slate-800 bg-[#0b0f19] overflow-y-auto p-3 space-y-4 shrink-0">
          <Card>
            <CardHeader title="Listing Photos" subtitle="Images or video clips"></CardHeader>
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 hover:border-blue-500 cursor-pointer p-5 transition bg-slate-900/40">
              <span className="text-3xl">📁</span>
              <span className="text-xs text-slate-400 text-center leading-relaxed">Drag & drop photos &amp; clips, or click to browse<br/><span className="text-slate-500">(JPG, PNG, MP4, WebM — 50 MB max)</span></span>
              <input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={e=>e.target.files&&handleFiles(e.target.files)} />
            </label>
            {uploading&&<p className="text-xs text-blue-400 mt-2 animate-pulse">Uploading…</p>}
          </Card>

          <Card>
            <CardHeader title="Branding Card" subtitle="Agent overlay on every frame"></CardHeader>
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Agent Name</label>
              <Input value={proj.branding.agentName} onChange={e=>setBranding({agentName:e.target.value})} placeholder="Jane Doe" />
              <label className="block text-xs text-slate-400">Phone</label>
              <Input value={proj.branding.phone} onChange={e=>setBranding({phone:e.target.value})} placeholder="+27 82 000 0000" />
              <label className="block text-xs text-slate-400">Email</label>
              <Input value={proj.branding.email} onChange={e=>setBranding({email:e.target.value})} placeholder="jane@agency.co.za" />
              <label className="block text-xs text-slate-400 mt-3">Agency Logo <span className="text-slate-500">(PNG/SVG)</span></label>
              <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer p-3 transition text-xs bg-slate-900/40">
                <span>🖼 Upload Logo</span>
                <input type="file" accept="image/png,image/svg+xml,image/*" className="hidden" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setBranding({logoDataUrl:r.result as string});r.readAsDataURL(f)}} />
              </label>
              {proj.branding.logoDataUrl&&<div className="flex items-center gap-2 mt-2"><img src={proj.branding.logoDataUrl} alt="logo" className="w-10 h-10 rounded border border-slate-700 object-contain bg-slate-900" /><button onClick={()=>setBranding({logoDataUrl:null})} className="text-xs text-red-400 hover:text-red-300">✕ Remove</button></div>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Audio Mixer" subtitle="Procedural soundtrack"></CardHeader>
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1"><span>Master</span><span>{Math.round(proj.audio.masterVolume*100)}%</span></label>
                <input type="range" min="0" max="1" step="0.01" value={proj.audio.masterVolume} onChange={e=>setProj(p=>({...p,audio:{...p.audio,masterVolume:parseFloat(e.target.value)}}))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1"><span>Music</span><span>{Math.round(proj.audio.musicVolume*100)}%</span></label>
                <input type="range" min="0" max="1" step="0.01" value={proj.audio.musicVolume} onChange={e=>setProj(p=>({...p,audio:{...p.audio,musicVolume:parseFloat(e.target.value)}}))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1"><span>SFX</span><span>{Math.round(proj.audio.sfxVolume*100)}%</span></label>
                <input type="range" min="0" max="1" step="0.01" value={proj.audio.sfxVolume} onChange={e=>setProj(p=>({...p,audio:{...p.audio,sfxVolume:parseFloat(e.target.value)}}))} className="w-full" />
              </div>
            </div>
          </Card>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f19]">
          <div className="flex-1 flex items-center justify-center p-2">
            <canvas ref={mainRef} className="rounded shadow-2xl bg-black" style={{maxWidth:'100%',maxHeight:'calc(100svh - 180px)'}} />
          </div>
          <div className="px-4 pb-2 flex items-center gap-3 text-xs text-slate-400">
            <span>{fmt(playTime)}</span>
            <input type="range" min={0} max={totalDur} step="0.1" value={playTime} onChange={e=>{setPlayTime(parseFloat(e.target.value));playOff.current=parseFloat(e.target.value);if(playing){audioRef.current?.stop();setPlaying(false)}}} className="flex-1" />
            <span>{fmt(totalDur)}</span>
          </div>
        </main>

        <aside className="w-80 border-l border-slate-800 bg-[#0b0f19] overflow-y-auto p-3 space-y-4 shrink-0">
          <Card>
            <CardHeader title="Timeline" subtitle={`${clips.length} clip(s)`}></CardHeader>
            {clips.length===0&&<p className="text-xs text-slate-500">No clips yet. Upload photos from the left.</p>}
            <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
              {clips.map((clip,idx)=>(
                <div key={clip.id} className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-500 w-5">{idx+1}</span>
                  <span className="text-xs flex-1 truncate">{clip.name}</span>
                  <span className="text-[10px] text-slate-500">{fmt(clip.trimEnd-clip.trimStart)}</span>
                  <button onClick={()=>rmClip(clip.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Transitions" subtitle="Between clips"></CardHeader>
            {clips.length<2&&<p className="text-xs text-slate-500">Add at least 2 clips to set transitions.</p>}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {Array.from({length:Math.max(0,clips.length-1)}).map((_,pos)=>(
                <div key={pos} className="p-2 rounded bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">After clip {pos+1}</div>
                  <select value={proj.transitions.find(tr=>tr.position===pos)?.type||'fade'} onChange={e=>setTx(pos,{type:e.target.value as VideoTransitionType})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs">
                    {TXTYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0.3" max="3" step="0.1" value={proj.transitions.find(tr=>tr.position===pos)?.duration??DTX} onChange={e=>setTx(pos,{duration:parseFloat(e.target.value)})} className="flex-1" />
                    <span className="text-[10px] text-slate-400 w-8">{(proj.transitions.find(tr=>tr.position===pos)?.duration??DTX).toFixed(1)}s</span>
                  </div>
                  <button onClick={()=>rmTx(pos)} className="text-[10px] text-red-400 hover:text-red-300">Remove transition</button>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {showExport&&(
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#141926] border border-slate-700 rounded-xl p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Exporting Video</h3>
            <p className="text-sm text-slate-400 mb-4">{exportProg||'Preparing…'}</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{width:exportProg.includes('%')?(exportProg.match(/\d+%/)||['0%'])[0]:'0%'}} /></div>
            <p className="text-xs text-slate-500">Recording at 30 FPS via WebM. Please keep this tab active.</p>
          </div>
        </div>
      )}
    </div>
  )
}
