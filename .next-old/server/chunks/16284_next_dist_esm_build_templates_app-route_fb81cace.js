module.exports=[82447,e=>{"use strict";var t=e.i(3682),r=e.i(23404),a=e.i(6061),n=e.i(67410),i=e.i(96712),o=e.i(76363),s=e.i(71618),l=e.i(48192),d=e.i(7056),c=e.i(29065),p=e.i(55167),u=e.i(8162),h=e.i(97672),g=e.i(37179),m=e.i(77328),f=e.i(93695);e.i(3104);var y=e.i(32657),w=e.i(13735),v=e.i(73810),$=e.i(19597),R=e.i(85817);async function C(e){let t=e.headers.get("Authorization");if(!t||!t.startsWith("Bearer "))return null;let r=t.replace("Bearer ",""),a=(0,R.createClient)("http://localhost:54321","dummy-anon-key-placeholder");try{let{data:{user:e},error:t}=await a.auth.getUser(r);if(t||!e)return null;return e}catch{return null}}let x={professional:"professional and corporate tone, emphasizing value and investment potential","warm-inviting":"warm and welcoming tone, emphasizing comfort and family living",luxury:"elegant and sophisticated tone, emphasizing exclusivity and premium features",modern:"contemporary and sleek tone, emphasizing innovation and design","family-friendly":"family-oriented tone, emphasizing safety, space, and child-friendly features",minimalist:"clean and simple tone, emphasizing functionality and space"},E={property24:{wordCount:"150-300 words",structure:"standard property listing format with headline, property description, features list, and call-to-action",extra:"Include property details, location highlights, and viewing contact information"},tiktok:{wordCount:"50-100 words",structure:"short, engaging caption with trending hashtags and hooks",extra:"Use emojis, trending hashtags like #property #realestate #dreamhome, and include a strong hook"},facebook:{wordCount:"150-250 words",structure:"engaging post format with hook, property details, and engagement call-to-action",extra:"Include emojis, ask questions to encourage comments, and add a clear CTA"},instagram:{wordCount:"100-150 words",structure:"visual-focused caption with line breaks, emojis, and hashtags",extra:"Include 10-15 relevant hashtags (#realestate #property #home #luxuryliving etc.), use vertical spacing"},twitter:{wordCount:"50-100 characters (very concise)",structure:"punchy tweet with key selling point and hashtags",extra:"Keep it extremely concise, use 2-3 relevant hashtags, focus on one key selling point"}};async function k(e,t,r,a,n,i,o,s,l,d,c,p,u){let h=x[t]||"professional tone",g=E[r]||E.property24,m=`Write a compelling real estate property listing description for a ${e}.

Style: ${h}

Output Format: ${r.toUpperCase()}
- Word count: ${g.wordCount}
- Structure: ${g.structure}
- Extra requirements: ${g.extra}

Property Details:
- Title: ${a}
- Address: ${n||"Not specified"}
- Price: ${i||"Not specified"}
- Bedrooms: ${o||"Not specified"}
- Bathrooms: ${s||"Not specified"}
- Square Feet: ${l||"Not specified"}
- Year Built: ${d||"Not specified"}

Key Features: ${c.length>0?c.join(", "):"None specified"}
Target Audience: ${u||"General buyers"}
Additional Notes: ${p||"None"}

Requirements:
1. Start with an attention-grabbing headline appropriate for ${r}
2. Write in a ${t} style that appeals to the target audience
3. Highlight the key features prominently
4. Include information about the property's location and nearby amenities
5. End with a compelling call-to-action encouraging buyers to schedule a viewing
6. Keep the description between ${g.wordCount}
7. Use appropriate formatting for ${r}
8. Make it ${"instagram"===r||"tiktok"===r?"SEO-friendly with relevant real estate hashtags":"SEO-friendly with relevant keywords"}
9. Do not include any pricing in the description except what was provided
10. Do not include placeholders like [Insert XYZ] - use the information provided

Write the description now:`,f=await fetch("https://api.replicate.com/v1/predictions",{method:"POST",headers:{Authorization:`Bearer ${process.env.REPLICATE_API_TOKEN}`,"Content-Type":"application/json",Prefer:"wait"},body:JSON.stringify({version:"qwen/qwen3-235b-a22b-instruct-2507",input:{prompt:m,system:"You are an expert real estate copywriter who creates compelling property listings for multiple platforms. You adapt your writing style and length based on the target platform (Property24, TikTok, Facebook, Instagram, Twitter/X). You write descriptions that highlight unique features, appeal to emotions, and drive buyer interest.",max_tokens:600,temperature:.7}})});if(!f.ok)throw console.error("Replicate API error:",await f.json()),Error("Failed to generate description");return(await f.json()).output||"Failed to generate description"}async function b(e){try{let{propertyType:t,listingStyle:r,outputFormat:a,propertyTitle:n,address:i,price:o,bedrooms:s,bathrooms:l,squareFeet:d,yearBuilt:c,keyFeatures:p,additionalNotes:u,targetAudience:h}=await e.json();if(!t||!n)return w.NextResponse.json({error:"Missing required fields: propertyType and propertyTitle"},{status:400});let g=await C(e);if(!g?.id)return w.NextResponse.json({error:"Authentication required"},{status:401});let m=g.id,f=$.CREDIT_COSTS.description_generation||2,y=await (0,v.canPerformAction)(m,f);if(!y.canPerform)return w.NextResponse.json({error:y.error||"Cannot perform action"},{status:402});let R=await (0,v.reserveCredits)(m,"description_generation",`desc-${Date.now()}`);if(!R.success)return w.NextResponse.json({error:R.error||"Failed to reserve credits"},{status:402});try{let e;return e=process.env.REPLICATE_API_TOKEN?await k(t,r,a,n,i,o,s,l,d,c,p,u,h):function(e,t,r,a,n,i,o,s,l){let d={professional:"We are pleased to present","warm-inviting":"Welcome to your dream home at",luxury:"Experience unparalleled elegance at",modern:"Discover modern living at","family-friendly":"The perfect family home awaits you at",minimalist:"Find your peaceful retreat at"}[t]||"We are pleased to present",c=o?`${o}-bedroom`:"",p=s?`${s}-bathroom`:"",u=l.length>0?l.slice(0,3).join(", "):"modern amenities",h="";switch(r){case"tiktok":h=`🏠 ${a}

✨ ${c} ${p} ${e} with ${u}

📍 ${n||"Prime location"}

💰 ${i||"Contact for pricing"}

#property #realestate #dreamhome #${e} #home #luxuryliving`;break;case"facebook":h=`${d} ${a}! 🎉

This stunning ${c} ${p} ${e} ${n?`located at ${n}`:""} is the perfect place to call home! 🏡

Key Features:
✨ ${u}

Why you'll love it:
• Spacious and bright throughout
• Perfect for families or investors
• Close to all amenities

Contact us today to schedule a viewing! 👇

${i?`Priced at ${i}`:"Contact for pricing"}`;break;case"instagram":h=`${a} ✨

${c} | ${p} | ${e}

📍 ${n||"Location available upon request"}

${u}

This stunning property offers the perfect blend of comfort and style. Whether you're looking for a family home or an investment opportunity, this one has it all!

🏠✨💫 #realestate #property #home #luxuryliving #dreamhome #${e} #house #invest #southafrica #property24`;break;case"twitter":h=`${a} 🏠

${c} ${p} ${e} with ${u.split(",")[0].toLowerCase()}.

${n?n.split(",")[0]:"Prime location"}

${i||"Contact for pricing"}

#property #realestate`;break;default:h=`${d} ${a}.

This stunning ${c} ${p} ${e} ${n?`located at ${n}`:""} offers an exceptional living experience. With its ${u}, this property is perfect for those seeking both comfort and style.

The thoughtfully designed layout maximizes space and natural light throughout. Whether you're looking for a family home, investment property, or personal sanctuary, this property delivers on all fronts.

Don't miss this incredible opportunity to own a piece of paradise. Schedule your private viewing today and envision yourself living in this remarkable home.

*This is a demo description. Connect your Replicate API key for AI-generated descriptions.*`}return h.trim()}(t,r,a,n,i,o,s,l,p),w.NextResponse.json({description:e,creditCost:f,remainingCredits:await (0,v.checkUserCredits)(m)})}catch(e){return console.error("AI generation error:",e),await (0,v.refundCredits)(m,"description_generation",`desc-${Date.now()}`),w.NextResponse.json({error:"Failed to generate description. Please try again."},{status:500})}}catch(e){return console.error("Description generator error:",e),w.NextResponse.json({error:"An error occurred while generating the description"},{status:500})}}e.s(["POST",()=>b],16512);var T=e.i(16512);let A=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/ai/description-generator/route",pathname:"/api/ai/description-generator",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/Documents/Stagefy-V2/src/app/api/ai/description-generator/route.ts",nextConfigOutput:"",userland:T}),{workAsyncStorage:N,workUnitAsyncStorage:P,serverHooks:S}=A;function I(){return(0,a.patchFetch)({workAsyncStorage:N,workUnitAsyncStorage:P})}async function O(e,t,a){A.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/ai/description-generator/route";w=w.replace(/\/index$/,"")||"/";let v=await A.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:$,params:R,nextConfig:C,parsedUrl:x,isDraftMode:E,prerenderManifest:k,routerServerContext:b,isOnDemandRevalidate:T,revalidateOnlyGenerated:N,resolvedPathname:P,clientReferenceManifest:S,serverActionsManifest:I}=v,O=(0,s.normalizeAppPath)(w),_=!!(k.dynamicRoutes[O]||k.routes[P]),q=async()=>((null==b?void 0:b.render404)?await b.render404(e,t,x,!1):t.end("This page could not be found"),null);if(_&&!E){let e=!!k.routes[P],t=k.dynamicRoutes[O];if(t&&!1===t.fallback&&!e){if(C.experimental.adapterPath)return await q();throw new f.NoFallbackError}}let j=null;!_||A.isDev||E||(j="/index"===(j=P)?"/":j);let D=!0===A.isDev||!_,U=_&&!D;I&&S&&(0,o.setManifestsSingleton)({page:w,clientReferenceManifest:S,serverActionsManifest:I});let F=e.method||"GET",H=(0,i.getTracer)(),K=H.getActiveScopeSpan(),M={params:R,prerenderManifest:k,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:D,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:C.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>A.onRequestError(e,t,a,n,b)},sharedContext:{buildId:$}},W=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),z=d.NextRequestAdapter.fromNodeNextRequest(W,(0,d.signalFromNodeResponse)(t));try{let o=async e=>A.handle(z,M).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${F} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${F} ${w}`)}),s=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!s&&T&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await o(n);e.fetchMetrics=M.renderOpts.fetchMetrics;let l=M.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=M.renderOpts.collectedTags;if(!_)return await (0,u.sendResponse)(W,B,i,M.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[m.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,a=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:T})},!1,b),t}},c=await A.handleResponse({req:e,nextConfig:C,cacheKey:j,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:k,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:N,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:s});if(!_)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",T?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return s&&_||f.delete(m.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(c.cacheControl)),await (0,u.sendResponse)(W,B,new Response(c.value.body,{headers:f,status:c.value.status||200})),null};K?await l(K):await H.withPropagatedContext(e.headers,()=>H.trace(c.BaseServerSpan.handleRequest,{spanName:`${F} ${w}`,kind:i.SpanKind.SERVER,attributes:{"http.method":F,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:O,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:T})},!1,b),_)throw t;return await (0,u.sendResponse)(W,B,new Response(null,{status:500})),null}}e.s(["handler",()=>O,"patchFetch",()=>I,"routeModule",()=>A,"serverHooks",()=>S,"workAsyncStorage",()=>N,"workUnitAsyncStorage",()=>P],82447)}];

//# sourceMappingURL=16284_next_dist_esm_build_templates_app-route_fb81cace.js.map