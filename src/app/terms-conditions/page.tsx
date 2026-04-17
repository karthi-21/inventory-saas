'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-sm sm:prose max-w-none text-gray-600">
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using Ezvento (&quot;Service&quot;), you agree to be bound by these Terms & Conditions (&quot;Agreement&quot;). If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on Ezvento for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the platform</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or &quot;mirroring&quot; the materials on any other server</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="mb-4">As a user, you are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring all information you provide is accurate and up-to-date</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Not using the service for unlawful purposes or in violation of these terms</li>
              <li>Not engaging in fraudulent activities, unauthorized access, or hacking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Subscription and Billing</h2>
            <p className="mb-4">
              Ezvento offers subscription-based services with different pricing tiers:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed monthly unless otherwise agreed</li>
              <li>Billing will commence on the start date of your subscription</li>
              <li>You authorize us to charge the payment method on file for billing</li>
              <li>Prices are subject to change with 30 days&apos; notice</li>
              <li>Refunds are limited to the current billing cycle if you cancel within 7 days of subscription commencement</li>
              <li>Cancellations take effect at the end of the current billing period</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Data Ownership and Control</h2>
            <p className="mb-4">
              You retain full ownership of all data, transactions, and content you upload or create on Ezvento (&quot;Your Data&quot;). We act as a service provider and will not use Your Data except to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide the service as described</li>
              <li>Generate analytics and insights with your consent</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-4">
              You are responsible for backing up Your Data and Ezvento is not liable for loss of data due to user negligence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">6. Acceptable Use Policy</h2>
            <p className="mb-4">
              You agree not to use Ezvento for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Illegal activities or violating any laws</li>
              <li>Transmitting malware, viruses, or harmful code</li>
              <li>Harassing, threatening, or abusing other users or our staff</li>
              <li>Spamming, phishing, or conducting fraud</li>
              <li>Scraping, crawling, or automated data extraction without permission</li>
              <li>Attempting unauthorized access to our systems</li>
              <li>Creating multiple accounts to abuse free trials or promotions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
            <p>
              All materials in Ezvento, including but not limited to text, graphics, logos, images, and software, are the intellectual property of Ezvento or its content suppliers and are protected by Indian and international copyright laws. You may not reproduce, distribute, or transmit any content without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
            <p className="mb-4">
              Ezvento is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, express or implied, regarding:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The accuracy, completeness, or reliability of the service</li>
              <li>That the service will be uninterrupted or error-free</li>
              <li>That any defects will be corrected</li>
              <li>That the service will meet your specific requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Ezvento shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business interruption, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Ezvento and its officers, directors, and employees from any claims, damages, losses, or expenses arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">11. Service Modifications and Termination</h2>
            <p className="mb-4">
              Ezvento reserves the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify, suspend, or discontinue the service or any feature with 30 days&apos; notice</li>
              <li>Terminate your account if you violate these terms</li>
              <li>Perform maintenance or updates that may affect service availability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">12. Third-Party Services</h2>
            <p>
              Ezvento integrates with third-party payment processors (Razorpay, PhonePe, etc.), GST verification services, and other vendors. You agree to comply with the terms and policies of these third-party services. We are not responsible for their actions or omissions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">13. Compliance with Indian Laws</h2>
            <p className="mb-4">
              As users of Ezvento, you agree to comply with all applicable Indian laws and regulations, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>GST Act, 2017 and related rules</li>
              <li>Income Tax Act, 1961</li>
              <li>Information Technology Act, 2000</li>
              <li>Consumer Protection Act, 2019</li>
              <li>FSSAI regulations (if applicable to your business)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">14. Dispute Resolution</h2>
            <p className="mb-4">
              These terms and conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">15. Changes to Terms</h2>
            <p>
              Ezvento reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Continued use of the service after changes constitutes your acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
            <p>
              For questions about these Terms & Conditions, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">Ezvento Support</p>
              <p className="text-sm">Email: support@ezvento.com</p>
              <p className="text-sm">Website: ezvento.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
