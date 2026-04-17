'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              Ezvento (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or &quot;Company&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, business name, address, GST/PAN details when you create an account</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by our payment partners)</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, device information, IP address, browser type</li>
              <li><strong>Store Data:</strong> Inventory, product catalogs, sales transactions, customer information (which you control)</li>
              <li><strong>Communication Data:</strong> Messages sent to our support team, feedback, survey responses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send billing information</li>
              <li>Send administrative notifications and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Enforce our Terms & Conditions and legal agreements</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Personalize your experience and improve our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do NOT sell your personal information. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Payment processors, email providers, cloud hosting providers, analytics services</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
              <li><strong>Your Consent:</strong> When you explicitly authorize us to share information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p>
              We implement industry-standard security measures including SSL/TLS encryption, secure password hashing, and regular security audits. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security, but we take reasonable precautions to protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p>
              We retain personal information for as long as necessary to provide services and fulfill legal obligations. You can request deletion of your account and associated data at any time, subject to legal retention requirements. Transaction data may be retained for compliance with Indian tax and accounting regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Download your data in a portable format</li>
              <li>Restrict certain processing activities</li>
            </ul>
            <p className="mt-4">To exercise these rights, contact us at privacy@ezvento.com</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under 18 years old. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of those websites. We encourage you to review their privacy policies before providing personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p>
              Your information is stored and processed in India. If you access our services from outside India, you consent to the transfer of your information to India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">11. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar technologies to enhance your experience. You can control cookies through your browser settings. Some features may not work if you disable cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">12. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be effective immediately upon posting to the website. We encourage you to review this policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">Ezvento Support</p>
              <p className="text-sm">Email: privacy@ezvento.com</p>
              <p className="text-sm">Website: ezvento.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
