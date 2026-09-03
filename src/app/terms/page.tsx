import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-slate">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
        <p className="text-slate-500">Last updated: September 3, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Stagefy (the "Service"), you agree to be bound by these Terms of Service
          ("Terms"). If you do not agree with all the terms, you are prohibited from using the Service.
        </p>

        <h2>2. Use of AI-Generated Content</h2>
        <p>
          The Service provides AI-powered tools for generating text descriptions, images, videos, and other content
          for real estate listings and marketing materials ("AI Content"). You acknowledge and agree that:
        </p>
        <ul>
          <li>AI Content may contain inaccuracies, biases, or inappropriate material</li>
          <li>AI Content may not comply with real estate laws, Fair Housing regulations, or advertising standards</li>
          <li>You are solely responsible for reviewing, verifying, and approving all AI Content before use</li>
          <li>You must not use AI-generated images or videos that misrepresent actual property features</li>
          <li>You must clearly disclose AI-generated content in all marketing materials as required by law</li>
        </ul>

        <h2>3. User Responsibilities and Liabilities</h2>
        <p>
          You are solely and fully responsible for:
        </p>
        <ul>
          <li><strong>Compliance with Laws:</strong> Ensuring all content complies with applicable federal, state, provincial, and local laws, including but not limited to Fair Housing laws, truth-in-advertising regulations, real estate licensing requirements, and MLS rules.</li>
          <li><strong>Accuracy of Content:</strong> Verifying the accuracy of all facts, figures, property details, prices, amenities, and descriptions in any content published using the Service.</li>
          <li><strong>Review of AI Output:</strong> Reviewing all AI-generated content for factual errors, discriminatory language, bias, personal information, trademark violations, and compliance with professional standards before publishing.</li>
          <li><strong>Lawful Use:</strong> Using the Service in a lawful manner and ensuring content does not defame, harass, or harm any person or entity.</li>
        </ul>

        <h2>4. Disclaimer of Liability for AI-Generated Content</h2>
        <p>
          <strong>STAGEFY DISCLAIMS ALL LIABILITY FOR AI-GENERATED CONTENT. THE SERVICE AND ALL AI CONTENT ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong>
        </p>
        <p>
          You acknowledge that Stagefy does not verify, validate, or guarantee the accuracy, completeness, or appropriateness
          of any AI-generated content. To the fullest extent permitted by law, Stagefy shall not be liable for any direct,
          indirect, incidental, special, consequential, or exemplary damages, including but not limited to:
        </p>
        <ul>
          <li>Legal action, claims, or proceedings brought by third parties against you</li>
          <li>Regulatory investigations, fines, penalties, or sanctions</li>
          <li>License suspension, revocation, or professional discipline</li>
          <li>Loss of sales, deals, or business opportunities</li>
          <li>Reputational damage or harm to professional standing</li>
          <li>Any damages arising from the use of or reliance on AI-generated content</li>
        </ul>
        <p>
          By using the Service, you agree to indemnify, defend, and hold harmless Stagefy, its affiliates, officers, directors,
          employees, agents, licensors, and suppliers from and against any claims, damages, losses, or expenses (including
          reasonable attorneys' fees) arising out of your use of AI-generated content or violation of these Terms.
        </p>

        <h2>5. No Warranty for AI Output</h2>
        <p>
          The Service is provided on an "as is" and "as available" basis. Stagefy does not warrant that:
        </p>
        <ul>
          <li>The Service will be uninterrupted, secure, or error-free</li>
          <li>AI-generated content will be accurate, reliable, or suitable for any purpose</li>
          <li>Defects will be corrected or the Service will be uninterrupted</li>
          <li>The AI models used will not produce biased, discriminatory, or harmful output</li>
        </ul>

        <h2>6. Content Ownership</h2>
        <p>
          Content you create or upload remains your property. However, you grant Stagefy a non-exclusive license to
          use, store, and display content solely to provide and improve the Service. Stagefy may use anonymized
          content to improve AI models, but will not disclose personally identifiable information.
        </p>

        <h2>7. Credit Policy</h2>
        <p>
          Credits are consumed immediately when AI processing begins and are non-refundable, even if processing
          fails or the output is unsatisfactory. Credits do not expire. Stagefy reserves the right to modify
          credit pricing and costs at any time.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Stagefy's total liability for any claim, whether in contract,
          tort (including negligence), strict liability, or otherwise, shall not exceed the amount you paid
          to Stagefy in the twelve (12) months immediately preceding the claim.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of South Africa. Any disputes shall be resolved in the courts
          of Cape Town, South Africa.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. The "Last updated" date at the top reflects the most
          recent changes. Your continued use of the Service after changes constitutes acceptance of the new Terms.
        </p>

        <h2>11. Contact Information</h2>
        <p>
          For questions about these Terms, contact us at: legal@stagefy.co.za
        </p>
      </div>
    </div>
  )
}
