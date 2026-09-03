import Link from 'next/link'

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

const faqs = [
  {
    category: "AI & Content Generation",
    items: [
      {
        q: "Is the AI-generated content accurate?",
        a: "AI-generated descriptions, scripts, and text content are for reference purposes only. They may contain inaccuracies, outdated information, or content that does not comply with applicable laws (including property regulations, fair housing laws, and advertising standards). You MUST review and verify all AI-generated content before using it in any marketing, listing, or public-facing material."
      },
      {
        q: "Can the AI generate inappropriate or misleading content?",
        a: "Yes. AI models can produce inaccurate, misleading, biased, or even inappropriate content. The prompts you provide and the source images you upload can significantly affect the output. Stagefy is not responsible for the quality, accuracy, or appropriateness of AI-generated content. Always review, fact-check, and edit any AI output before publishing."
      },
      {
        q: "What should I do before using AI-generated content?",
        a: "Before using any AI-generated content, you must: (1) Review every detail for accuracy and compliance; (2) Verify all facts against official property records and documentation; (3) Ensure compliance with local real estate laws, Fair Housing regulations, and truth-in-advertising standards; (4) Remove or redact any sensitive personal information; (5) Do not include AI-generated photos or videos that misrepresent the actual property. Stagefy is not liable for any consequences arising from the use of AI-generated content."
      }
    ]
  },
  {
    category: "Image & Video Generation",
    items: [
      {
        q: "Are the AI-generated images and videos of the actual property?",
        a: "No. AI image-to-video and image generation features use machine learning models to create content based on prompts and source images. The results may not accurately represent the actual property, room dimensions, colors, or features. You MUST clearly disclose to potential buyers that AI-generated media is synthetic and not an accurate representation of the property. Do not use AI-generated images in listing photos without clear disclosure."
      },
      {
        q: "How can I ensure AI-generated media is accurate?",
        a: "AI-generated media should only be used for creative concepts, marketing visuals, and conceptual presentations. For any public-facing listings, always use actual property photography and videos. If you use AI-generated media, prominently disclose it as such and verify that it does not violate any real estate advertising laws in your area."
      },
      {
        q: "What are the risks of AI-edited photos?",
        a: "AI editing can alter property features, remove or add elements, and change room appearances. Overly edited photos can mislead buyers, violate Fair Housing laws, or breach local advertising regulations. Some jurisdictions prohibit or severely restrict altered listing photos. Always check local laws and ensure compliance with MLS and broker guidelines."
      }
    ]
  },
  {
    category: "Credits & Billing",
    items: [
      {
        q: "Do my credits expire?",
        a: "No, purchased credits never expire. They remain in your account until used."
      },
      {
        q: "What happens when I run out of credits?",
        a: "You won't be able to use AI features until you purchase more credits. You'll receive a notification when your balance is low."
      },
      {
        q: "Can I get a refund on credits?",
        a: "All credit purchases are non-refundable. This includes unused credits. Please contact support with any billing disputes."
      }
    ]
  },
  {
    category: "Legal & Liability",
    items: [
      {
        q: "Is Stagefy liable for AI-generated content?",
        a: "NO. Stagefy provides AI tools as assistance only. You are solely responsible for all content you create, publish, and distribute using our tools. This includes but is not limited to: property listing descriptions, marketing materials, photos, videos, social media posts, and any other content. You must comply with all applicable laws, regulations, and professional standards. Stagefy is not liable for any damages, legal action, regulatory violations, or other consequences arising from your use of AI-generated content."
      },
      {
        q: "Can I be held responsible for AI-generated content?",
        a: "Yes. As a real estate professional, you are responsible for ensuring that all marketing materials comply with fair housing laws, truth-in-advertising standards, and local regulations. AI-generated content that misrepresents a property or includes false information can result in legal liability, license suspension, fines, or lawsuits. Always review and approve all content before publishing."
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-slate-600 mb-8">
          Your guide to Stagefy's AI tools, credits, and content policies.
        </p>

        {faqs.map((category) => (
          <div key={category.category} className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">{category.category}</h2>
            <div className="space-y-4">
              {category.items.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
