(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,45807,e=>{"use strict";var t=e.i(74097);function s({variant:e="primary",size:s="md",loading:a=!1,fullWidth:r=!1,icon:l,children:i,className:o="",disabled:n,...d}){let c=`
    inline-flex items-center justify-center font-medium
    rounded-xl transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    shadow-sm hover:shadow-md active:scale-[0.98]
  `,x={primary:`
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
    `};return(0,t.jsxs)("button",{className:`${c} ${x[e]} ${{sm:"px-4 py-2 text-sm gap-2",md:"px-5 py-2.5 text-base gap-2",lg:"px-6 py-3 text-lg gap-2.5"}[s]} ${r?"w-full":""} ${o}`,disabled:n||a,...d,children:[a&&(0,t.jsxs)("svg",{className:"animate-spin h-4 w-4",viewBox:"0 0 24 24",children:[(0,t.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),(0,t.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),l&&!a&&(0,t.jsx)("span",{className:"flex-shrink-0",children:l}),i]})}e.s(["Button",()=>s])},17753,e=>{"use strict";var t=e.i(74097);function s({children:e,className:s="",padding:a="md",hover:r=!1,onClick:l}){return(0,t.jsx)("div",{className:`
        bg-white 
        rounded-2xl 
        border border-slate-100
        shadow-sm
        ${{none:"",sm:"p-4",md:"p-6",lg:"p-8"}[a]} 
        ${r?"hover:shadow-lg hover:border-blue-100 cursor-pointer transition-all duration-300 ease-out":""} 
        ${s}
      `,onClick:l,children:e})}function a({title:e,subtitle:s,action:a}){return(0,t.jsxs)("div",{className:"flex items-start justify-between mb-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-lg font-semibold text-slate-900",children:e}),s&&(0,t.jsx)("p",{className:"text-sm text-slate-500 mt-1",children:s})]}),a&&(0,t.jsx)("div",{children:a})]})}function r({children:e,className:s=""}){return(0,t.jsx)("div",{className:s,children:e})}e.s(["Card",()=>s,"CardContent",()=>r,"CardHeader",()=>a])},73582,e=>{"use strict";var t=e.i(74097);function s({label:e,error:s,icon:a,helper:r,className:l="",...i}){return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:e}),(0,t.jsxs)("div",{className:"relative",children:[a&&(0,t.jsx)("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400",children:a}),(0,t.jsx)("input",{className:`
            w-full rounded-xl
            bg-white
            border ${s?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
            px-4 py-3
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2
            transition-all duration-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${a?"pl-10":""}
            ${l}
          `,...i})]}),s&&(0,t.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:s}),r&&!s&&(0,t.jsx)("p",{className:"mt-1.5 text-sm text-slate-500",children:r})]})}function a({label:e,error:s,className:a="",...r}){return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:e}),(0,t.jsx)("textarea",{className:`
          w-full rounded-xl
          bg-white
          border ${s?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
          px-4 py-3
          text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:ring-2
          transition-all duration-200
          disabled:bg-slate-50 disabled:text-slate-500
          resize-none
          ${a}
        `,...r}),s&&(0,t.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:s})]})}function r({label:e,error:s,options:a,className:r="",...l}){return(0,t.jsxs)("div",{className:"w-full",children:[e&&(0,t.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:e}),(0,t.jsx)("select",{className:`
          w-full rounded-xl
          bg-white
          border ${s?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
          px-4 py-3
          text-slate-900
          focus:outline-none focus:ring-2
          transition-all duration-200
          disabled:bg-slate-50 disabled:text-slate-500
          cursor-pointer
          ${r}
        `,...l,children:a.map(e=>(0,t.jsx)("option",{value:e.value,children:e.label},e.value))}),s&&(0,t.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:s})]})}e.s(["Input",()=>s,"Select",()=>r,"Textarea",()=>a])},64021,e=>{"use strict";var t=e.i(74097),s=e.i(16763),a=e.i(3480),r=e.i(57895),l=e.i(14700);function i({title:i,subtitle:o}){let{user:n,signOut:d}=(0,a.useAuth)(),[c,x]=(0,s.useState)(!1),[u,m]=(0,s.useState)(!1),[h,b]=(0,s.useState)([]),[f,p]=(0,s.useState)(0),[j,g]=(0,s.useState)(!1),v=async()=>{if(n?.id){g(!0);try{let{supabase:t}=await e.A(85824),{data:{session:s}}=await t.auth.getSession(),a=await fetch("/api/notifications",{headers:s?.access_token?{Authorization:`Bearer ${s.access_token}`}:{}});if(a.ok){let e=await a.json();b(e.notifications||[]),p(e.unreadCount||0)}}catch(e){console.error("Failed to fetch notifications:",e)}finally{g(!1)}}};(0,s.useEffect)(()=>{n?.id&&v()},[n?.id]);let N=async()=>{if(x(!c),!c&&f>0)try{let{supabase:t}=await e.A(85824),{data:{session:s}}=await t.auth.getSession();await fetch("/api/notifications/read",{method:"PUT",headers:{"Content-Type":"application/json",...s?.access_token?{Authorization:`Bearer ${s.access_token}`}:{}},body:JSON.stringify({markAllRead:!0})}),b(e=>e.map(e=>({...e,is_read:!0}))),p(0)}catch(e){console.error("Failed to mark notifications as read:",e)}};return(0,t.jsx)("header",{className:"bg-white px-8 py-6",children:(0,t.jsxs)("div",{className:"flex items-center justify-between",children:[(0,t.jsxs)("div",{children:[i&&(0,t.jsx)("h1",{className:"text-2xl font-bold text-slate-900",children:i}),o&&(0,t.jsx)("p",{className:"text-base text-slate-500 mt-1",children:o})]}),(0,t.jsxs)("div",{className:"flex items-center gap-4",children:[n&&(0,t.jsx)("div",{className:"hidden md:block",children:(0,t.jsx)(r.CreditBadge,{credits:n.credits})}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsxs)("button",{onClick:N,className:"relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors",children:[(0,t.jsx)("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"})}),f>0&&(0,t.jsx)("span",{className:"absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium",children:f})]}),c&&(0,t.jsxs)("div",{className:"absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50",children:[(0,t.jsx)("div",{className:"p-4 border-b border-slate-100",children:(0,t.jsx)("h3",{className:"font-semibold text-slate-900",children:"Notifications"})}),(0,t.jsx)("div",{className:"max-h-96 overflow-y-auto",children:h.map(e=>{let s,a,r,i;return(0,t.jsx)("div",{className:(0,l.cn)("p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors",!e.is_read&&"bg-blue-50/50"),children:(0,t.jsxs)("div",{className:"flex items-start gap-3",children:[(0,t.jsx)("div",{className:(0,l.cn)("w-2 h-2 mt-2.5 rounded-full",e.is_read?"bg-slate-300":"bg-blue-500")}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)("p",{className:"text-sm font-medium text-slate-900",children:e.title}),(0,t.jsx)("p",{className:"text-sm text-slate-500 mt-0.5",children:e.message}),(0,t.jsx)("p",{className:"text-xs text-slate-400 mt-1",children:(s=new Date(e.created_at),i=Math.floor((r=Math.floor((a=Math.floor((new Date().getTime()-s.getTime())/6e4))/60))/24),a<1?"Just now":a<60?`${a}m ago`:r<24?`${r}h ago`:i<7?`${i}d ago`:s.toLocaleDateString())})]})]})},e.id)})}),(0,t.jsx)("div",{className:"p-3 border-t border-slate-100",children:(0,t.jsx)("button",{className:"w-full text-sm text-blue-600 hover:text-blue-700 font-medium",children:"View all notifications"})})]})]}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsxs)("button",{onClick:()=>m(!u),className:"flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors",children:[(0,t.jsx)("div",{className:"w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center",children:(0,t.jsx)("span",{className:"text-sm font-medium text-slate-600",children:n?.full_name?.charAt(0)||"U"})}),(0,t.jsx)("svg",{className:"w-4 h-4 text-slate-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M19 9l-7 7-7-7"})})]}),u&&(0,t.jsxs)("div",{className:"absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50",children:[(0,t.jsxs)("div",{className:"p-4 border-b border-slate-100",children:[(0,t.jsx)("p",{className:"font-medium text-slate-900",children:n?.full_name}),(0,t.jsx)("p",{className:"text-sm text-slate-500",children:n?.email})]}),(0,t.jsxs)("div",{className:"p-2",children:[(0,t.jsxs)("a",{href:"/settings",className:"flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors",children:[(0,t.jsxs)("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:[(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"}),(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"})]}),"Settings"]}),(0,t.jsxs)("a",{href:"/billing",className:"flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors",children:[(0,t.jsx)("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"})}),"Billing"]}),(0,t.jsxs)("button",{onClick:d,className:"w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors",children:[(0,t.jsx)("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"})}),"Sign out"]})]})]})]})]})]})})}e.s(["Header",()=>i])}]);