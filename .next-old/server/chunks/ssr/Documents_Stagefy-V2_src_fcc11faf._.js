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
    `};return(0,b.jsxs)("button",{className:`${k} ${l[a]} ${{sm:"px-4 py-2 text-sm gap-2",md:"px-5 py-2.5 text-base gap-2",lg:"px-6 py-3 text-lg gap-2.5"}[c]} ${e?"w-full":""} ${h}`,disabled:i||d,...j,children:[d&&(0,b.jsxs)("svg",{className:"animate-spin h-4 w-4",viewBox:"0 0 24 24",children:[(0,b.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),(0,b.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),f&&!d&&(0,b.jsx)("span",{className:"flex-shrink-0",children:f}),g]})}a.s(["Button",()=>c])},3145,a=>{"use strict";var b=a.i(23753),c=a.i(85036),d=a.i(70167),e=a.i(17170),f=a.i(83947),g=a.i(15463);function h(){let a=(0,d.useSearchParams)(),{user:h,loading:i,refreshUser:j}=(0,f.useAuth)(),k=a.get("type")||"",l=a.get("package")||"",m=a.get("plan")||"";if((0,c.useEffect)(()=>{j()},[j]),i)return(0,b.jsx)("div",{className:"min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center",children:(0,b.jsxs)("div",{className:"text-center",children:[(0,b.jsx)("div",{className:"w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"}),(0,b.jsx)("p",{className:"text-slate-600",children:"Loading..."})]})});let n={"50-credits":{name:"50 Credits",credits:50},"100-credits":{name:"100 Credits",credits:100},"250-credits":{name:"250 Credits",credits:250},"500-credits":{name:"500 Credits",credits:500}}[l]||{name:"Credit Package",credits:0},o={basic:{name:"Basic",credits:50},pro:{name:"Pro",credits:150},enterprise:{name:"Enterprise",credits:300}}[m]||{name:"Subscription Plan",credits:0};return(0,b.jsx)("div",{className:"min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4",children:(0,b.jsx)("div",{className:"max-w-md w-full",children:(0,b.jsxs)("div",{className:"bg-white rounded-2xl shadow-xl p-8 text-center",children:[(0,b.jsx)("div",{className:"w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6",children:(0,b.jsx)("svg",{className:"w-10 h-10 text-green-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 13l4 4L19 7"})})}),(0,b.jsx)("h1",{className:"text-2xl font-bold text-slate-900 mb-2",children:"Payment Successful!"}),(0,b.jsx)("p",{className:"text-slate-600 mb-6",children:"subscription"===k?`Your ${o.name} subscription is now active.`:"Your credits have been added to your account."}),"credits"===k&&n.credits>0&&(0,b.jsxs)("div",{className:"bg-blue-50 rounded-xl p-4 mb-6",children:[(0,b.jsx)("p",{className:"text-sm text-blue-600 mb-1",children:"Credits Added"}),(0,b.jsx)("p",{className:"text-3xl font-bold text-blue-700",children:n.credits})]}),"subscription"===k&&o.credits>0&&(0,b.jsxs)("div",{className:"bg-purple-50 rounded-xl p-4 mb-6",children:[(0,b.jsx)("p",{className:"text-sm text-purple-600 mb-1",children:"Monthly Credits"}),(0,b.jsx)("p",{className:"text-3xl font-bold text-purple-700",children:o.credits})]}),(0,b.jsxs)("div",{className:"space-y-3 mb-6",children:[(0,b.jsx)("p",{className:"text-sm text-slate-500",children:"What would you like to do next?"}),(0,b.jsx)(e.default,{href:"/dashboard",children:(0,b.jsx)(g.Button,{className:"w-full",size:"lg",children:"Go to Dashboard"})}),(0,b.jsx)(e.default,{href:"/photo-edit",children:(0,b.jsx)(g.Button,{variant:"outline",className:"w-full",size:"lg",children:"Start Editing Photos"})}),(0,b.jsx)(e.default,{href:"/billing",children:(0,b.jsx)(g.Button,{variant:"ghost",className:"w-full",size:"lg",children:"View Billing History"})})]}),(0,b.jsx)("p",{className:"text-xs text-slate-400",children:"A confirmation email has been sent to your registered email address."})]})})})}function i(){return(0,b.jsx)("div",{className:"min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center",children:(0,b.jsxs)("div",{className:"text-center",children:[(0,b.jsx)("div",{className:"w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"}),(0,b.jsx)("p",{className:"text-slate-600",children:"Loading..."})]})})}function j(){return(0,b.jsx)(f.AuthProvider,{children:(0,b.jsx)(c.Suspense,{fallback:(0,b.jsx)(i,{}),children:(0,b.jsx)(h,{})})})}a.s(["default",()=>j])}];

//# sourceMappingURL=Documents_Stagefy-V2_src_fcc11faf._.js.map