import Link from 'next/link'

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

const helpSections = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How do I create an account?",
        a: "Sign up on our website using your email and password, or log in with your Google or Microsoft account. You'll receive 3 free credits to try our features."
      },
      {
        q: "How do I use my credits?",
        a: "Credits are deducted automatically when you use AI features. Check the Credit Costs on the Billing page for pricing on each tool."
      },
      {
        q: "How do I buy more credits?",
        a: "Visit the Billing page and select a credit package. Payments are processed securely through PayFast. Credits are added immediately after payment."
      }
    ]
  },
  {
    title: "AI Tools & Features",
    items: [
      {
        q: "What is Video Maker Studio?",
        a: "Video Maker Studio generates short video clips from property photos using AI. It creates transitions, calling cards, and optional background music. Each export costs 1 credit."
      },
      {
        q: "What is the Photo Editor?",
        a: "Our AI Photo Editor enhances and edits listing photos. You can adjust lighting, remove clutter, and improve image quality. Each edit costs 1 credit."
      },
      {
        q: "What is Image-to-Video?",
        a: "Turn static property photos into short video clips with motion effects. Choose 3s, 5s, 10s, or 15s durations. Pricing varies by duration."
      },
      {
        q: "What are the risks of AI-generated content?",
        a: "IMPORTANT: AI-generated descriptions, scripts, images, and videos may contain inaccuracies, biases, or inappropriate content. They may not comply with Fair Housing laws, truth-in-advertising standards, or local real estate regulations. You MUST review all AI output before using it in any professional context. Stagefy is not liable for any consequences from AI-generated content."
      }
    ]
  },
  {
    title: "AI Content Risks & Responsibilities",
    items: [
      {
        q: "Why is human review critical?",
        a: "AI models can generate content that:\n\n• Contains factual errors or outdated information\n• Includes biased, discriminatory, or inappropriate language\n• Violates Fair Housing laws (e.g., mentioning protected characteristics)\n• Misrepresents property features, room sizes, or conditions\n• Includes personal information (addresses, phone numbers, emails) without consent\n• Is plagiarized from other sources\n\nYou are responsible for reviewing and approving ALL AI-generated content before use."
      },
      {
        q: "How do prompts affect AI output?",
        a: "Your prompts directly influence AI results. Vague or poorly worded prompts often produce inaccurate, generic, or problematic content. Be specific but neutral in your prompts. Avoid prompts that could lead to discrimination, exaggeration, or misleading claims."
      },
      {
        q: "What should I check before using AI-generated content?",
        a: "Before publishing any AI-generated content:\n\n1. Verify all facts (prices, amenities, dimensions, conditions)\n2. Check for Fair Housing compliance (no mention of protected classes)\n3. Remove any personally identifiable information\n4. Ensure trademark/copyright compliance (no brand names without permission)\n5. Review for accuracy and marketing compliance\n6. Get approval from your broker if required\n\nStagefy is not liable for any legal, regulatory, or professional consequences."
      },
      {
        q: "What if AI-generated media misrepresents a property?",
        a: "AI-generated images and videos are synthetic and may not accurately represent the actual property. Using synthetic media that misleads buyers can result in: legal liability, license suspension, MLS violations, broker penalties, and buyer claims. Always use actual property photos for listings. If using AI-generated media, clearly disclose it as conceptual/synthetic."
      }
    ]
  },
  {
    title: "Technical Support",
    items: [
      {
        q: "What if my export fails?",
        a: "Check the logs panel during export for specific error messages. Common issues include: missing clips, unsupported file formats, or browser memory limits. Try fewer clips or lower resolution format. Contact support with the error details if the issue persists."
      },
      {
        q: "What browsers are supported?",
        a: "Stagefy works best on the latest versions of Chrome, Edge, and Safari. Firefox is supported but may have reduced performance for video processing."
      },
      {
        q: "Can I get help from support?",
a: "Yes, email admin@stagefy.co.za for assistance with technical issues, billing questions, or account problems. Include details about your browser, the feature you're using, and any error messages."
      }
    ]
  }
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Help Center</h1>
        <p className="text-slate-600 mb-8">
          Resources and support for using Stagefy's AI tools effectively and responsibly.
        </p>

        {helpSections.map((section) => (
          <div key={section.title} className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.items.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">{item.q}</h3>
                  <div
                    className="text-slate-600 text-sm leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: item.a.replace(/\n/g, '<br>') }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-blue-50 rounded-xl p-6 mt-12">
          <h2 className="font-semibold text-slate-900 mb-2">Still need help?</h2>
          <p className="text-slate-600 text-sm mb-3">
            Email us at admin@stagefy.co.za with your questions, concerns, or technical issues.
          </p>
        </div>
      </div>
    </div>
  )
}
