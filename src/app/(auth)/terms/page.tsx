import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, ArrowLeft, FileText } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl">Terms of Service</CardTitle>
        <p className="text-sm text-muted-foreground">Last updated: April 15, 2026</p>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using OmniBIZ (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not
            access or use the Service. These Terms apply to all visitors, users, and others who
            access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>
            OmniBIZ is a cloud-based point-of-sale and billing platform designed for Indian
            retailers. The Service includes billing, inventory management, customer management,
            reporting, and related features. We reserve the right to modify, suspend, or
            discontinue any part of the Service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. Account Registration</h2>
          <p className="mb-2">
            To use the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access</li>
            <li>Immediately notify us of any unauthorized use of your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Subscription and Payments</h2>
          <p className="mb-2">
            By selecting a paid plan, you agree to pay the applicable subscription fees. All prices
            are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated
            otherwise. Subscription fees are billed monthly in advance. We reserve the right to
            change our pricing with 30 days&apos; prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Free Trial</h2>
          <p>
            We offer a 14-day free trial for new accounts. During the trial period, you will not
            be charged. At the end of the trial, your selected plan subscription will begin and
            you will be billed accordingly. You may cancel at any time before the trial ends
            without being charged.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. User Responsibilities</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Upload content that is unlawful, harmful, or infringes on others&apos; rights</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use the Service to compete directly with OmniBIZ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Data and Content</h2>
          <p>
            You retain ownership of all data and content you upload to the Service. By using
            OmniBIZ, you grant us a limited license to process your data solely for the purpose
            of providing the Service. We will not access your data except as necessary to provide
            support, maintain the Service, or as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. GST Compliance</h2>
          <p>
            OmniBIZ generates GST-compliant invoices as per Indian tax regulations. However,
            you are solely responsible for ensuring the accuracy of your GST configuration,
            tax rates, and compliance with all applicable tax laws. OmniBIZ is not liable for
            any tax compliance issues arising from incorrect configuration.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">9. Termination</h2>
          <p>
            Either party may terminate this agreement at any time. Upon termination, your right
            to use the Service will cease immediately. We will provide you access to export your
            data for a period of 30 days following termination. After 30 days, your data may
            be permanently deleted, subject to legal retention requirements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, OmniBIZ shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the
            Service. Our total liability shall not exceed the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes arising under these Terms
            shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">12. Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@omnibiz.in" className="text-primary hover:underline">
              legal@omnibiz.in
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