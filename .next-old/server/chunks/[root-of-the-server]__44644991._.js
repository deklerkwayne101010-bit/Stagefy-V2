module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},22449,e=>{"use strict";var t=e.i(3682),r=e.i(23404),a=e.i(6061),n=e.i(67410),o=e.i(96712),i=e.i(76363),s=e.i(71618),l=e.i(48192),p=e.i(7056),d=e.i(29065),c=e.i(55167),u=e.i(8162),y=e.i(97672),f=e.i(37179),h=e.i(77328),m=e.i(93695);e.i(3104);var g=e.i(32657),x=e.i(13735),R=e.i(73810),w=e.i(19597),b=e.i(85817);async function v(e){let t=e.headers.get("Authorization");if(!t||!t.startsWith("Bearer "))return null;let r=t.replace("Bearer ",""),a=(0,b.createClient)("http://localhost:54321","dummy-anon-key-placeholder");try{let{data:{user:e},error:t}=await a.auth.getUser(r);if(t||!e)return null;return e}catch{return null}}async function C(e){try{let{templateCategory:t,propertyType:r,brandPrimaryColor:a,brandName:n,userPreferences:o}=await e.json();if(!t)return x.NextResponse.json({error:"Template category is required"},{status:400});let i=null;if(i=await v(e),!i?.id)return x.NextResponse.json({error:"Authentication required"},{status:401});let s=w.CREDIT_COSTS.template_generation,{canPerform:l,error:p}=await (0,R.canPerformAction)(i.id,s);if(!l)return x.NextResponse.json({error:p||"Insufficient credits for layout generation"},{status:402});let d=await (0,R.reserveCredits)(i.id,"template_generation",`layout-${Date.now()}`);if(!d.success)return x.NextResponse.json({error:d.error||"Failed to reserve credits"},{status:402});try{let e=`You are an expert real estate marketing designer. 
Generate unique, professional property listing template layouts with specific 
formatting, structure, content placeholders, and styling specifications.
Always output valid JSON format.`,i=`Generate a completely unique and perfectly structured prompt layout 
and styling specifically designed for a ${t} professional property 
listing template${r?` for a ${r}`:""}.

${n?`BRAND REQUIREMENTS:
- Brand Name: ${n}
- Primary Brand Color: ${a||"#1e40af"}
- Apply these brand colors consistently throughout the template
- Follow ${n}'s typical visual identity patterns`:""}

${o?.styleKeywords?.length?`Style Keywords: ${o.styleKeywords.join(", ")}`:""}
${o?.specialRequirements?`Special Requirements: ${o.specialRequirements}`:""}

REQUIRED OUTPUT FORMAT:
Return a JSON object with:
1. "prompt": A detailed prompt for Nano Banana to generate the template
2. "layoutStructure": Object with "sections" array containing:
   - id: section identifier
   - name: section name
   - type: section type (header, hero, gallery, features, details, contact, footer)
   - order: display order
   - style: object with styling rules
3. "placeholders": Object mapping placeholder IDs to their properties:
   - type: content type (text, image, number, date)
   - style: styling rules
   - content_type: what kind of content belongs here

Example structure:
{
  "prompt": "Create a professional property listing template with...",
  "layoutStructure": {
    "sections": [
      {"id": "header", "name": "Brand Header", "type": "header", "order": 1, "style": {...}},
      {"id": "hero", "name": "Hero Image", "type": "hero", "order": 2, "style": {...}}
    ]
  },
  "placeholders": {
    "hero_image": {"type": "image", "style": {...}, "content_type": "image"},
    "property_price": {"type": "number", "style": {...}, "content_type": "number"}
  }
}`,s=await fetch("https://api.replicate.com/v1/models/qwen/qwen3-235b-a22b-instruct-2507/predictions",{method:"POST",headers:{Authorization:`Bearer ${process.env.REPLICATE_API_TOKEN}`,"Content-Type":"application/json",Prefer:"wait"},body:JSON.stringify({input:{prompt:i,system:e,temperature:.7,max_tokens:4e3}})});if(!s.ok){let e=await s.text();throw console.error("Qwen API error:",e),Error(`Qwen API failed: ${e}`)}let l=await s.json();console.log("Qwen layout prediction:",l);let p=l.output;if("string"==typeof p)try{p=JSON.parse(p)}catch{p={prompt:p,layoutStructure:A(t),placeholders:{}}}return x.NextResponse.json({prompt:p.prompt||E(t,r,a),layoutStructure:p.layoutStructure||A(t),estimatedTokens:l.metrics?.predict_time_ms?Math.round(l.metrics.predict_time_ms/10):1500})}catch(e){return console.error("AI processing error:",e),await (0,R.refundCredits)(i.id,"template_generation",`layout-${Date.now()}`),x.NextResponse.json({prompt:E(t,r,a),layoutStructure:A(t),estimatedTokens:1500,fallback:!0})}}catch(e){return console.error("Layout generation error:",e),x.NextResponse.json({error:"Internal server error"},{status:500})}}function E(e,t,r){return`Create a professional ${e} property listing template with the following specifications:

## Header Section
- Include brand logo/name area at the top
- Brand tagline placement
- Professional header styling with ${r||"blue"} accent color

## Hero Section
- Large hero image placeholder (16:9 aspect ratio)
- Property title overlay area
- Price display with currency formatting
- Quick property stats bar (beds, baths, sqft)

## Gallery Section
- Image gallery grid (3-4 images)
- Thumbnail carousel navigation
- Image caption areas

## Property Details Section
- Feature list with icons
- Room dimensions
- Property specifications table
- Description text area

## Contact Section
- Agent photo placeholder (circular)
- Agent contact information
- Agency branding area
- Call-to-action buttons

## Footer
- Copyright and branding
- Social media links
- Legal disclaimer area

Style: ${e} aesthetic with clean, modern design principles.`}function A(e){return{sections:[{id:"header",name:"Brand Header",type:"header",order:1,style:{height:"80px",backgroundColor:"#ffffff",borderBottom:"2px solid #e5e7eb",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}},{id:"hero",name:"Hero Image",type:"hero",order:2,style:{height:"400px",position:"relative",backgroundColor:"#f3f4f6"}},{id:"property_info",name:"Property Info",type:"details",order:3,style:{padding:"24px",backgroundColor:"#ffffff"}},{id:"gallery",name:"Image Gallery",type:"gallery",order:4,style:{padding:"24px",backgroundColor:"#f9fafb"}},{id:"features",name:"Property Features",type:"features",order:5,style:{padding:"24px",backgroundColor:"#ffffff"}},{id:"description",name:"Property Description",type:"details",order:6,style:{padding:"24px",backgroundColor:"#f9fafb"}},{id:"contact",name:"Agent Contact",type:"contact",order:7,style:{padding:"24px",backgroundColor:"#1e40af",color:"#ffffff"}},{id:"footer",name:"Footer",type:"footer",order:8,style:{padding:"24px",backgroundColor:"#111827",color:"#9ca3af"}}]}}e.s(["POST",()=>C],82745);var S=e.i(82745);let P=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/ai/template/layout/route",pathname:"/api/ai/template/layout",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/Documents/Stagefy-V2/src/app/api/ai/template/layout/route.ts",nextConfigOutput:"",userland:S}),{workAsyncStorage:k,workUnitAsyncStorage:N,serverHooks:T}=P;function _(){return(0,a.patchFetch)({workAsyncStorage:k,workUnitAsyncStorage:N})}async function I(e,t,a){P.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/ai/template/layout/route";x=x.replace(/\/index$/,"")||"/";let R=await P.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:w,params:b,nextConfig:v,parsedUrl:C,isDraftMode:E,prerenderManifest:A,routerServerContext:S,isOnDemandRevalidate:k,revalidateOnlyGenerated:N,resolvedPathname:T,clientReferenceManifest:_,serverActionsManifest:I}=R,j=(0,s.normalizeAppPath)(x),O=!!(A.dynamicRoutes[j]||A.routes[T]),q=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,C,!1):t.end("This page could not be found"),null);if(O&&!E){let e=!!A.routes[T],t=A.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(v.experimental.adapterPath)return await q();throw new m.NoFallbackError}}let $=null;!O||P.isDev||E||($="/index"===($=T)?"/":$);let D=!0===P.isDev||!O,H=O&&!D;I&&_&&(0,i.setManifestsSingleton)({page:x,clientReferenceManifest:_,serverActionsManifest:I});let U=e.method||"GET",B=(0,o.getTracer)(),F=B.getActiveScopeSpan(),M={params:b,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:D,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:v.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>P.onRequestError(e,t,a,n,S)},sharedContext:{buildId:w}},K=new l.NodeNextRequest(e),L=new l.NodeNextResponse(t),G=p.NextRequestAdapter.fromNodeNextRequest(K,(0,p.signalFromNodeResponse)(t));try{let i=async e=>P.handle(G,M).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=B.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${U} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${x}`)}),s=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var o,l;let p=async({previousCacheEntry:r})=>{try{if(!s&&k&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(n);e.fetchMetrics=M.renderOpts.fetchMetrics;let l=M.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let p=M.renderOpts.collectedTags;if(!O)return await (0,u.sendResponse)(K,L,o,M.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,y.toNodeOutgoingHttpHeaders)(o.headers);p&&(t[h.NEXT_CACHE_TAGS_HEADER]=p),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,a=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await P.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:k})},!1,S),t}},d=await P.handleResponse({req:e,nextConfig:v,cacheKey:$,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:k,revalidateOnlyGenerated:N,responseGenerator:p,waitUntil:a.waitUntil,isMinimalMode:s});if(!O)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",k?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,y.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&O||m.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,f.getCacheControlHeader)(d.cacheControl)),await (0,u.sendResponse)(K,L,new Response(d.value.body,{headers:m,status:d.value.status||200})),null};F?await l(F):await B.withPropagatedContext(e.headers,()=>B.trace(d.BaseServerSpan.handleRequest,{spanName:`${U} ${x}`,kind:o.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},l))}catch(t){if(t instanceof m.NoFallbackError||await P.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:k})},!1,S),O)throw t;return await (0,u.sendResponse)(K,L,new Response(null,{status:500})),null}}e.s(["handler",()=>I,"patchFetch",()=>_,"routeModule",()=>P,"serverHooks",()=>T,"workAsyncStorage",()=>k,"workUnitAsyncStorage",()=>N],22449)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__44644991._.js.map