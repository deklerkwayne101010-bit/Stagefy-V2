module.exports=[99187,(a,b,c)=>{"use strict";b.exports=a.r(40279).vendored["react-ssr"].ReactServerDOMTurbopackClient},59073,(a,b,c)=>{"use strict";b.exports=a.r(40279).vendored.contexts.HooksClientContext},10440,(a,b,c)=>{"use strict";b.exports=a.r(40279).vendored.contexts.ServerInsertedHtml},56704,(a,b,c)=>{b.exports=a.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(a,b,c)=>{b.exports=a.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},20635,(a,b,c)=>{b.exports=a.x("next/dist/server/app-render/action-async-storage.external.js",()=>require("next/dist/server/app-render/action-async-storage.external.js"))},65839,(a,b,c)=>{"use strict";b.exports=a.r(40279).vendored.contexts.AppRouterContext},81742,(a,b,c)=>{"use strict";b.exports=a.r(40279).vendored["react-ssr"].ReactDOM},15463,a=>{"use strict";var b=a.i(23753);function c({variant:a="primary",size:c="md",loading:d=!1,fullWidth:e=!1,icon:f,children:g,className:h="",disabled:i,...j}){let k=`
    inline-flex items-center justify-center font-medium
    rounded-xl transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    shadow-sm hover:shadow-md active:scale-[0.98]
  `,l={primary:`
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
    `,secondary:`
      bg-slate-100 text-slate-700
      hover:bg-slate-200
      focus:ring-slate-400
    `,outline:`
      border-2 border-slate-200 text-slate-600
      hover:bg-slate-50 hover:border-slate-300
      focus:ring-slate-400
    `,ghost:`
      text-slate-600
      hover:bg-slate-100 hover:text-slate-900
      focus:ring-slate-400
    `,danger:`
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
    `};return(0,b.jsxs)("button",{className:`${k} ${l[a]} ${{sm:"px-4 py-2 text-sm gap-2",md:"px-5 py-2.5 text-base gap-2",lg:"px-6 py-3 text-lg gap-2.5"}[c]} ${e?"w-full":""} ${h}`,disabled:i||d,...j,children:[d&&(0,b.jsxs)("svg",{className:"animate-spin h-4 w-4",viewBox:"0 0 24 24",children:[(0,b.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),(0,b.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),f&&!d&&(0,b.jsx)("span",{className:"flex-shrink-0",children:f}),g]})}a.s(["Button",()=>c])},79796,a=>{"use strict";var b=a.i(23753);function c({label:a,error:c,icon:d,helper:e,className:f="",...g}){return(0,b.jsxs)("div",{className:"w-full",children:[a&&(0,b.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:a}),(0,b.jsxs)("div",{className:"relative",children:[d&&(0,b.jsx)("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400",children:d}),(0,b.jsx)("input",{className:`
            w-full rounded-xl
            bg-white
            border ${c?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
            px-4 py-3
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2
            transition-all duration-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${d?"pl-10":""}
            ${f}
          `,...g})]}),c&&(0,b.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:c}),e&&!c&&(0,b.jsx)("p",{className:"mt-1.5 text-sm text-slate-500",children:e})]})}function d({label:a,error:c,className:d="",...e}){return(0,b.jsxs)("div",{className:"w-full",children:[a&&(0,b.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:a}),(0,b.jsx)("textarea",{className:`
          w-full rounded-xl
          bg-white
          border ${c?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
          px-4 py-3
          text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:ring-2
          transition-all duration-200
          disabled:bg-slate-50 disabled:text-slate-500
          resize-none
          ${d}
        `,...e}),c&&(0,b.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:c})]})}function e({label:a,error:c,options:d,className:e="",...f}){return(0,b.jsxs)("div",{className:"w-full",children:[a&&(0,b.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:a}),(0,b.jsx)("select",{className:`
          w-full rounded-xl
          bg-white
          border ${c?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
          px-4 py-3
          text-slate-900
          focus:outline-none focus:ring-2
          transition-all duration-200
          disabled:bg-slate-50 disabled:text-slate-500
          cursor-pointer
          ${e}
        `,...f,children:d.map(a=>(0,b.jsx)("option",{value:a.value,children:a.label},a.value))}),c&&(0,b.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:c})]})}a.s(["Input",()=>c,"Select",()=>e,"Textarea",()=>d])},8745,(a,b,c)=>{"use strict";function d(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(d=function(a){return a?c:b})(a)}c._=function(a,b){if(!b&&a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=d(b);if(c&&c.has(a))return c.get(a);var e={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(e,g,h):e[g]=a[g]}return e.default=a,c&&c.set(a,e),e}},42154,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={DEFAULT_SEGMENT_KEY:function(){return l},NOT_FOUND_SEGMENT_KEY:function(){return m},PAGE_SEGMENT_KEY:function(){return k},addSearchParamsIfPageSegment:function(){return i},computeSelectedLayoutSegment:function(){return j},getSegmentValue:function(){return f},getSelectedLayoutSegmentPath:function(){return function a(b,c,d=!0,e=[]){let g;if(d)g=b[1][c];else{let a=b[1];g=a.children??Object.values(a)[0]}if(!g)return e;let h=f(g[0]);return!h||h.startsWith(k)?e:(e.push(h),a(g,c,!1,e))}},isGroupSegment:function(){return g},isParallelRouteSegment:function(){return h}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});function f(a){return Array.isArray(a)?a[1]:a}function g(a){return"("===a[0]&&a.endsWith(")")}function h(a){return a.startsWith("@")&&"@children"!==a}function i(a,b){if(a.includes(k)){let a=JSON.stringify(b);return"{}"!==a?k+"?"+a:k}return a}function j(a,b){if(!a||0===a.length)return null;let c="children"===b?a[0]:a[a.length-1];return c===l?null:c}let k="__PAGE__",l="__DEFAULT__",m="/_not-found"},3215,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"useMergedRef",{enumerable:!0,get:function(){return e}});let d=a.r(85036);function e(a,b){let c=(0,d.useRef)(null),e=(0,d.useRef)(null);return(0,d.useCallback)(d=>{if(null===d){let a=c.current;a&&(c.current=null,a());let b=e.current;b&&(e.current=null,b())}else a&&(c.current=f(a,d)),b&&(e.current=f(b,d))},[a,b])}function f(a,b){if("function"!=typeof a)return a.current=b,()=>{a.current=null};{let c=a(b);return"function"==typeof c?c:()=>a(null)}}("function"==typeof c.default||"object"==typeof c.default&&null!==c.default)&&void 0===c.default.__esModule&&(Object.defineProperty(c.default,"__esModule",{value:!0}),Object.assign(c.default,c),b.exports=c.default)},1498,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"warnOnce",{enumerable:!0,get:function(){return d}});let d=a=>{}},71233,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={getDeploymentId:function(){return f},getDeploymentIdQueryOrEmptyString:function(){return g}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});function f(){return!1}function g(){return""}},38892,a=>{"use strict";var b=a.i(23753),c=a.i(73546);function d({size:a="md",className:d=""}){let e={sm:{width:24,height:24},md:{width:32,height:32},lg:{width:40,height:40}};return(0,b.jsxs)("div",{className:`flex items-center gap-2 ${d}`,children:[(0,b.jsx)(c.default,{src:"/logo.png",alt:"Stagefy Logo",width:e[a].width,height:e[a].height,className:"object-contain"}),(0,b.jsx)("span",{className:`font-bold text-slate-900 ${"sm"===a?"text-sm":"md"===a?"text-xl":"text-2xl"}`,children:"Stagefy"})]})}a.s(["Logo",()=>d])},62199,a=>{"use strict";var b=a.i(23753),c=a.i(85036),d=a.i(17170),e=a.i(70167),f=a.i(83947),g=a.i(15463),h=a.i(79796),i=a.i(38892);function j(){let a=(0,e.useRouter)(),{signUp:j}=(0,f.useAuth)(),[k,l]=(0,c.useState)({fullName:"",email:"",password:"",confirmPassword:""}),[m,n]=(0,c.useState)(""),[o,p]=(0,c.useState)(!1),q=a=>{l({...k,[a.target.name]:a.target.value})},r=async b=>{if(b.preventDefault(),n(""),k.password!==k.confirmPassword)return void n("Passwords do not match");if(k.password.length<8)return void n("Password must be at least 8 characters");p(!0);let{error:c}=await j(k.email,k.password,k.fullName);c?(n(c.message),p(!1)):a.push("/onboarding")};return(0,b.jsx)("div",{className:"min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6",children:(0,b.jsxs)("div",{className:"w-full max-w-sm",children:[(0,b.jsx)(d.default,{href:"/",className:"flex justify-center mb-12",children:(0,b.jsx)(i.Logo,{size:"lg"})}),(0,b.jsxs)("div",{className:"bg-white rounded-2xl shadow-sm border border-gray-100 p-8",children:[(0,b.jsx)("h1",{className:"text-xl font-medium text-[#1A1A2E] text-center",children:"Create your account"}),(0,b.jsx)("p",{className:"text-gray-500 text-center mt-2 text-sm",children:"Start creating stunning listing media today"}),(0,b.jsxs)("form",{onSubmit:r,className:"mt-8 space-y-5",children:[m&&(0,b.jsx)("div",{className:"p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center",children:m}),(0,b.jsx)(h.Input,{label:"Full name",type:"text",name:"fullName",placeholder:"John Smith",value:k.fullName,onChange:q,required:!0}),(0,b.jsx)(h.Input,{label:"Email",type:"email",name:"email",placeholder:"you@example.com",value:k.email,onChange:q,required:!0}),(0,b.jsx)(h.Input,{label:"Password",type:"password",name:"password",placeholder:"At least 8 characters",value:k.password,onChange:q,required:!0}),(0,b.jsx)(h.Input,{label:"Confirm password",type:"password",name:"confirmPassword",placeholder:"Re-enter your password",value:k.confirmPassword,onChange:q,required:!0}),(0,b.jsx)(g.Button,{type:"submit",fullWidth:!0,loading:o,children:"Create account"})]}),(0,b.jsxs)("p",{className:"mt-6 text-center text-sm text-gray-500",children:["Already have an account?"," ",(0,b.jsx)(d.default,{href:"/login",className:"text-[#1A1A2E] hover:underline font-medium",children:"Sign in"})]})]}),(0,b.jsx)("p",{className:"text-center text-gray-400 text-xs mt-8",children:"By creating an account, you agree to our Terms of Service"})]})})}a.s(["default",()=>j])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__3e4d2460._.js.map