import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl">Privacy Policy</CardTitle>
        <p className="text-sm text-muted-foreground">Last updated: April 15, 2026</p>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p className="mb-2">
            We collect information you provide directly when using Ezvento, including:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account information (name, email address, phone number)</li>
            <li>Business information (store name, GSTIN, address)</li>
            <li>Billing and payment information</li>
            <li>Transaction and inventory data you enter into the platform</li>
            <li>Communication records with our support team</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <p className="mb-2">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide, maintain, and improve Ezvento services</li>
            <li>Process transactions and send related notifications</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments, questions, and support requests</li>
            <li>Monitor and analyze trends and usage patterns</li>
            <li>Detect, investigate, and prevent fraudulent transactions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. Data Storage and Security</h2>
          <p>
            Your data is stored on secure servers with industry-standard encryption. We implement
            appropriate technical and organizational measures to protect your personal data against
            unauthorized access, alteration, disclosure, or destruction. All data is stored in
            compliance with applicable Indian data protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Data Sharing</h2>
          <p className="mb-2">
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>With payment processors to complete transactions</li>
            <li>With service providers who assist in operating our platform</li>
            <li>When required by law or to comply with legal obligations</li>
            <li>To protect the rights, property, or safety of Ezvento or our users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to collect information about your browsing
            activities. You can control cookies through your browser settings. Essential cookies
            required for the platform to function cannot be disabled.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal obligations)</li>
            <li>Export your data in a machine-readable format</li>
            <li>Withdraw consent for data processing where applicable</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to
            provide services. Upon account deletion, we will remove your data within 30 days,
            except where retention is required by law (e.g., GST-related records as per Indian
            tax regulations).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@ezvento.karth-21.com" className="text-primary hover:underline">
              privacy@ezvento.karth-21.com
            </a>{' '}
            or visit our{' '}
            <Link href="/support" className="text-primary hover:underline">
              support page
            </Link>
            .
          </p>
        </section>

        <div className="pt-4 border-t">
          <Link
            href="/signup"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}