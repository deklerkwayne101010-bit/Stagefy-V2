module.exports=[15463,a=>{"use strict";var b=a.i(23753);function c({variant:a="primary",size:c="md",loading:d=!1,fullWidth:e=!1,icon:f,children:g,className:h="",disabled:i,...j}){let k=`
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
    `};return(0,b.jsxs)("button",{className:`${k} ${l[a]} ${{sm:"px-4 py-2 text-sm gap-2",md:"px-5 py-2.5 text-base gap-2",lg:"px-6 py-3 text-lg gap-2.5"}[c]} ${e?"w-full":""} ${h}`,disabled:i||d,...j,children:[d&&(0,b.jsxs)("svg",{className:"animate-spin h-4 w-4",viewBox:"0 0 24 24",children:[(0,b.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),(0,b.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),f&&!d&&(0,b.jsx)("span",{className:"flex-shrink-0",children:f}),g]})}a.s(["Button",()=>c])},16173,a=>{"use strict";var b=a.i(23753),c=a.i(85036),d=a.i(17170),e=a.i(83947),f=a.i(15463);function g(){let{user:a,loading:c}=(0,e.useAuth)();return c?(0,b.jsx)("div",{className:"min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center",children:(0,b.jsxs)("div",{className:"text-center",children:[(0,b.jsx)("div",{className:"w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"}),(0,b.jsx)("p",{className:"text-slate-600",children:"Loading..."})]})}):(0,b.jsx)("div",{className:"min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4",children:(0,b.jsx)("div",{className:"max-w-md w-full",children:(0,b.jsxs)("div",{className:"bg-white rounded-2xl shadow-xl p-8 text-center",children:[(0,b.jsx)("div",{className:"w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6",children:(0,b.jsx)("svg",{className:"w-10 h-10 text-amber-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),(0,b.jsx)("h1",{className:"text-2xl font-bold text-slate-900 mb-2",children:"Payment Cancelled"}),(0,b.jsx)("p",{className:"text-slate-600 mb-6",children:"You cancelled the payment process. No charges were made to your account."}),(0,b.jsxs)("div",{className:"bg-slate-50 rounded-xl p-4 mb-6",children:[(0,b.jsx)("p",{className:"text-sm font-medium text-slate-700 mb-2",children:"No problem! You can:"}),(0,b.jsxs)("ul",{className:"text-sm text-slate-600 text-left space-y-2",children:[(0,b.jsxs)("li",{className:"flex items-start gap-2",children:[(0,b.jsx)("svg",{className:"w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"})}),"Try again with the same payment method"]}),(0,b.jsxs)("li",{className:"flex items-start gap-2",children:[(0,b.jsx)("svg",{className:"w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"})}),"Choose a different credit package or plan"]}),(0,b.jsxs)("li",{className:"flex items-start gap-2",children:[(0,b.jsx)("svg",{className:"w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"})}),"Contact our support team for assistance"]})]})]}),(0,b.jsxs)("div",{className:"space-y-3 mb-6",children:[(0,b.jsx)(d.default,{href:"/billing",children:(0,b.jsx)(f.Button,{className:"w-full",size:"lg",children:"Return to Billing"})}),(0,b.jsx)(d.default,{href:"/dashboard",children:(0,b.jsx)(f.Button,{variant:"outline",className:"w-full",size:"lg",children:"Go to Dashboard"})})]}),(0,b.jsx)("p",{className:"text-xs text-slate-400",children:"If you experienced any issues with the payment process, please do not hesitate to reach out to our support team."})]})})})}function h(){return(0,b.jsx)("div",{className:"min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center",children:(0,b.jsxs)("div",{className:"text-center",children:[(0,b.jsx)("div",{className:"w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"}),(0,b.jsx)("p",{className:"text-slate-600",children:"Loading..."})]})})}function i(){return(0,b.jsx)(e.AuthProvider,{children:(0,b.jsx)(c.Suspense,{fallback:(0,b.jsx)(h,{}),children:(0,b.jsx)(g,{})})})}a.s(["default",()=>i])}];

//# sourceMappingURL=Documents_Stagefy-V2_src_e2d8c291._.js.map