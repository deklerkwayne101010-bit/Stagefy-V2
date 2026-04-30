(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,35687,(e,s,l)=>{s.exports=e.r(79890)},45807,e=>{"use strict";var s=e.i(74097);function l({variant:e="primary",size:l="md",loading:t=!1,fullWidth:a=!1,icon:r,children:i,className:n="",disabled:o,...d}){let c=`
    inline-flex items-center justify-center font-medium
    rounded-xl transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    shadow-sm hover:shadow-md active:scale-[0.98]
  `,u={primary:`
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
    `};return(0,s.jsxs)("button",{className:`${c} ${u[e]} ${{sm:"px-4 py-2 text-sm gap-2",md:"px-5 py-2.5 text-base gap-2",lg:"px-6 py-3 text-lg gap-2.5"}[l]} ${a?"w-full":""} ${n}`,disabled:o||t,...d,children:[t&&(0,s.jsxs)("svg",{className:"animate-spin h-4 w-4",viewBox:"0 0 24 24",children:[(0,s.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),(0,s.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),r&&!t&&(0,s.jsx)("span",{className:"flex-shrink-0",children:r}),i]})}e.s(["Button",()=>l])},17753,e=>{"use strict";var s=e.i(74097);function l({children:e,className:l="",padding:t="md",hover:a=!1,onClick:r}){return(0,s.jsx)("div",{className:`
        bg-white 
        rounded-2xl 
        border border-slate-100
        shadow-sm
        ${{none:"",sm:"p-4",md:"p-6",lg:"p-8"}[t]} 
        ${a?"hover:shadow-lg hover:border-blue-100 cursor-pointer transition-all duration-300 ease-out":""} 
        ${l}
      `,onClick:r,children:e})}function t({title:e,subtitle:l,action:t}){return(0,s.jsxs)("div",{className:"flex items-start justify-between mb-4",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{className:"text-lg font-semibold text-slate-900",children:e}),l&&(0,s.jsx)("p",{className:"text-sm text-slate-500 mt-1",children:l})]}),t&&(0,s.jsx)("div",{children:t})]})}function a({children:e,className:l=""}){return(0,s.jsx)("div",{className:l,children:e})}e.s(["Card",()=>l,"CardContent",()=>a,"CardHeader",()=>t])},73582,e=>{"use strict";var s=e.i(74097);function l({label:e,error:l,icon:t,helper:a,className:r="",...i}){return(0,s.jsxs)("div",{className:"w-full",children:[e&&(0,s.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:e}),(0,s.jsxs)("div",{className:"relative",children:[t&&(0,s.jsx)("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400",children:t}),(0,s.jsx)("input",{className:`
            w-full rounded-xl
            bg-white
            border ${l?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
            px-4 py-3
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2
            transition-all duration-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${t?"pl-10":""}
            ${r}
          `,...i})]}),l&&(0,s.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:l}),a&&!l&&(0,s.jsx)("p",{className:"mt-1.5 text-sm text-slate-500",children:a})]})}function t({label:e,error:l,className:t="",...a}){return(0,s.jsxs)("div",{className:"w-full",children:[e&&(0,s.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:e}),(0,s.jsx)("textarea",{className:`
          w-full rounded-xl
          bg-white
          border ${l?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
          px-4 py-3
          text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:ring-2
          transition-all duration-200
          disabled:bg-slate-50 disabled:text-slate-500
          resize-none
          ${t}
        `,...a}),l&&(0,s.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:l})]})}function a({label:e,error:l,options:t,className:a="",...r}){return(0,s.jsxs)("div",{className:"w-full",children:[e&&(0,s.jsx)("label",{className:"block text-sm font-medium text-slate-700 mb-2",children:e}),(0,s.jsx)("select",{className:`
          w-full rounded-xl
          bg-white
          border ${l?"border-red-300 focus:border-red-500 focus:ring-red-200":"border-slate-200 focus:border-blue-500 focus:ring-blue-100"}
          px-4 py-3
          text-slate-900
          focus:outline-none focus:ring-2
          transition-all duration-200
          disabled:bg-slate-50 disabled:text-slate-500
          cursor-pointer
          ${a}
        `,...r,children:t.map(e=>(0,s.jsx)("option",{value:e.value,children:e.label},e.value))}),l&&(0,s.jsx)("p",{className:"mt-1.5 text-sm text-red-600",children:l})]})}e.s(["Input",()=>l,"Select",()=>a,"Textarea",()=>t])},33246,e=>{"use strict";var s=e.i(74097),l=e.i(16763),t=e.i(35687),a=e.i(3480),r=e.i(41706),i=e.i(45807),n=e.i(73582),o=e.i(17753);let d=[{id:1,name:"About You",description:"Tell us about yourself"},{id:2,name:"Your Business",description:"About your brokerage"},{id:3,name:"Getting Started",description:"How will you use Stagefy?"}];function c(){let e=(0,t.useRouter)(),{user:c,refreshUser:u}=(0,a.useAuth)(),[m,x]=(0,l.useState)(1),[h,b]=(0,l.useState)(!1),[g,p]=(0,l.useState)({fullName:c?.full_name||"",brokerage:"",market:"",businessType:"residential",useCase:"all"}),f=e=>{p({...g,[e.target.name]:e.target.value})},v=async()=>{if(b(!0),!c){b(!1),e.push("/login");return}let{error:s}=await r.supabase.from("users").update({full_name:g.fullName,brokerage:g.brokerage,market:g.market,use_case:g.useCase}).eq("id",c.id);s?(console.error("Error updating user:",s),b(!1)):(await u(),e.push("/dashboard"))};return(0,s.jsx)("div",{className:"min-h-screen bg-gray-50 flex items-center justify-center p-6",children:(0,s.jsxs)("div",{className:"w-full max-w-2xl",children:[(0,s.jsx)("div",{className:"mb-8",children:(0,s.jsx)("div",{className:"flex items-center justify-between",children:d.map((e,t)=>(0,s.jsxs)(l.default.Fragment,{children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[(0,s.jsx)("div",{className:`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${m>=e.id?"bg-blue-600 text-white":"bg-gray-200 text-gray-500"}`,children:m>e.id?(0,s.jsx)("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,s.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M5 13l4 4L19 7"})}):e.id}),(0,s.jsxs)("div",{className:"hidden sm:block",children:[(0,s.jsx)("p",{className:`font-medium ${m>=e.id?"text-gray-900":"text-gray-500"}`,children:e.name}),(0,s.jsx)("p",{className:"text-sm text-gray-500",children:e.description})]})]}),t<d.length-1&&(0,s.jsx)("div",{className:`flex-1 h-0.5 mx-4 ${m>e.id?"bg-blue-600":"bg-gray-200"}`})]},e.id))})}),(0,s.jsxs)(o.Card,{padding:"lg",children:[1===m&&(0,s.jsxs)("div",{className:"space-y-6",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-xl font-semibold text-gray-900",children:"Welcome to Stagefy!"}),(0,s.jsx)("p",{className:"text-gray-500 mt-1",children:"Let's get to know you better."})]}),(0,s.jsx)(n.Input,{label:"What's your name?",name:"fullName",placeholder:"John Smith",value:g.fullName,onChange:f,required:!0}),(0,s.jsx)(n.Input,{label:"What's your brokerage?",name:"brokerage",placeholder:"Keller Williams, RE/MAX, etc.",value:g.brokerage,onChange:f,required:!0}),(0,s.jsx)(n.Input,{label:"What's your market/location?",name:"market",placeholder:"Los Angeles, CA",value:g.market,onChange:f,required:!0})]}),2===m&&(0,s.jsxs)("div",{className:"space-y-6",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-xl font-semibold text-gray-900",children:"Tell us about your business"}),(0,s.jsx)("p",{className:"text-gray-500 mt-1",children:"This helps us personalize your experience."})]}),(0,s.jsx)("div",{className:"grid grid-cols-2 gap-4",children:[{value:"residential",label:"Residential",desc:"Single family homes",icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"},{value:"commercial",label:"Commercial",desc:"Retail, office, industrial",icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"},{value:"luxury",label:"Luxury",desc:"High-end properties",icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"},{value:"all",label:"All Types",desc:"I work with everything",icon:"M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"}].map(e=>(0,s.jsx)("div",{className:`p-4 rounded-xl border-2 cursor-pointer transition-all ${g.businessType===e.value?"border-blue-500 bg-blue-50":"border-gray-200 hover:border-gray-300"}`,onClick:()=>p({...g,businessType:e.value}),children:(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[(0,s.jsx)("div",{className:`w-10 h-10 rounded-lg flex items-center justify-center ${g.businessType===e.value?"bg-blue-100":"bg-gray-100"}`,children:(0,s.jsx)("svg",{className:`w-5 h-5 ${g.businessType===e.value?"text-blue-600":"text-gray-600"}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,s.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:e.icon})})}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"font-medium text-gray-900",children:e.label}),(0,s.jsx)("p",{className:"text-sm text-gray-500",children:e.desc})]})]})},e.value))})]}),3===m&&(0,s.jsxs)("div",{className:"space-y-6",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-xl font-semibold text-gray-900",children:"How will you use Stagefy?"}),(0,s.jsx)("p",{className:"text-gray-500 mt-1",children:"Select your primary use case to get started."})]}),(0,s.jsx)("div",{className:"space-y-3",children:[{value:"photos",label:"AI Photo Editing",icon:"🖼️",desc:"Virtual staging, declutter, day-to-dusk"},{value:"video",label:"Image to Video",icon:"🎬",desc:"Convert photos to engaging videos"},{value:"templates",label:"AI Templates",icon:"📋",desc:"Create listing promos and social media"},{value:"all",label:"All Features",icon:"✨",desc:"Get the most out of Stagefy"}].map(e=>(0,s.jsx)("div",{className:`p-4 rounded-xl border-2 cursor-pointer transition-all ${g.useCase===e.value?"border-blue-500 bg-blue-50":"border-gray-200 hover:border-gray-300"}`,onClick:()=>p({...g,useCase:e.value}),children:(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsx)("span",{className:"text-2xl",children:e.icon}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"font-medium text-gray-900",children:e.label}),(0,s.jsx)("p",{className:"text-sm text-gray-500",children:e.desc})]})]})},e.value))}),(0,s.jsx)("div",{className:"bg-blue-50 rounded-lg p-4",children:(0,s.jsxs)("p",{className:"text-sm text-blue-700",children:["🎉 ",(0,s.jsx)("strong",{children:"You're all set!"})," You'll get 10 free credits to try out Stagefy. Start creating amazing listing media right away!"]})})]}),(0,s.jsxs)("div",{className:"flex items-center justify-between mt-8 pt-6 border-t border-gray-200",children:[(0,s.jsx)(i.Button,{variant:"ghost",onClick:()=>{m>1&&x(m-1)},disabled:1===m,children:"Back"}),(0,s.jsx)(i.Button,{onClick:()=>{m<d.length?x(m+1):v()},loading:h,children:m===d.length?"Get Started":"Continue"})]})]})]})})}e.s(["default",()=>c])}]);