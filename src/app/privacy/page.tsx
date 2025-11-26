import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Privacy Policy - HomeQR',
  description: 'HomeQR Privacy Policy - Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold text-gray-900">HomeQR</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                HomeQR (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Chrome extension, website, and services (collectively, the &quot;Service&quot;).
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                By using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1. Personally Identifiable Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, brokerage name, and profile photo when you create an account</li>
                <li><strong>Lead Information:</strong> Name, email address, and phone number submitted by buyers through property microsite contact forms</li>
                <li><strong>Property Information:</strong> Property addresses, listing details, photos, and other property data you create or import through our extension</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2. Authentication Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect and store authentication credentials to secure your account:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Email address and password (encrypted) for account login</li>
                <li>Authentication tokens stored locally in your browser (Chrome extension) to enable QR code generation</li>
                <li>Session cookies to maintain your login state</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3. Location Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect location data for analytics purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>IP address and geographic region to show where property views originate</li>
                <li>This information is aggregated and used to provide analytics insights in your dashboard</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4. User Activity Data</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We track how you and your visitors interact with our Service:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>QR code scans and timestamps</li>
                <li>Property microsite page views</li>
                <li>Contact form submissions</li>
                <li>Extension usage (when you generate QR codes)</li>
                <li>Device type (mobile, tablet, desktop) and browser information</li>
                <li>Time of day when scans and views occur</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5. Website Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Chrome extension extracts property listing data from MLS websites:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Property addresses, prices, photos, and features from publicly available listing pages</li>
                <li>This data is extracted only when you actively click the extension icon on a listing page</li>
                <li>The extracted data is used solely to populate listing details for QR code generation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Create and manage your property listings and QR codes</li>
                <li>Generate branded property microsites</li>
                <li>Capture and store buyer leads from QR code scans</li>
                <li>Provide analytics and insights about your property marketing performance</li>
                <li>Process payments and manage subscriptions (via Stripe)</li>
                <li>Send you service-related communications (account updates, support responses)</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Service Providers</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Stripe:</strong> We use Stripe to process subscription payments. Stripe receives payment information (credit card numbers, billing addresses) but does not have access to your property listings or leads.</li>
                <li><strong>Supabase:</strong> We use Supabase to store and manage your data securely. All data is encrypted and stored in compliance with industry standards.</li>
                <li><strong>Vercel:</strong> We use Vercel to host our application. Vercel processes requests but does not have access to your stored data.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may disclose your information if required by law or in response to valid requests by public authorities (e.g., court orders, subpoenas).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Business Transfers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All data is encrypted in transit using HTTPS/TLS</li>
                <li>Passwords are hashed and never stored in plain text</li>
                <li>Authentication tokens are stored securely in browser storage</li>
                <li>Database access is protected by Row-Level Security (RLS) policies</li>
                <li>Regular security audits and updates</li>
                <li>Access controls to limit employee access to user data</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after account deletion</li>
                <li><strong>Property Listings:</strong> Retained while your account is active. You can delete listings at any time.</li>
                <li><strong>Analytics Data:</strong> Trial users: 30 days retention. Paid users: Unlimited retention.</li>
                <li><strong>Lead Data:</strong> Retained while your account is active. You can export or delete leads at any time.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Upon account deletion, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Access:</strong> You can access and update your account information at any time through your dashboard settings</li>
                <li><strong>Deletion:</strong> You can delete your account and all associated data by contacting us or using the account deletion feature</li>
                <li><strong>Export:</strong> You can export your leads and listing data to CSV format from your dashboard</li>
                <li><strong>Opt-Out:</strong> You can opt out of non-essential communications by updating your preferences in your account settings</li>
                <li><strong>Cookie Control:</strong> You can control cookies through your browser settings, though this may affect Service functionality</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Maintain your login session</li>
                <li>Track unique visitors to property microsites</li>
                <li>Remember your preferences</li>
                <li>Analyze Service usage and performance</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Service is not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately and we will delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-2">HomeQR</p>
                <p className="text-gray-700">
                  Email: <a href="mailto:privacy@home-qrcode.com" className="text-blue-600 hover:text-blue-700 underline">privacy@home-qrcode.com</a>
                </p>
                <p className="text-gray-700 mt-2">
                  Website: <a href="https://www.home-qrcode.com" className="text-blue-600 hover:text-blue-700 underline">www.home-qrcode.com</a>
                </p>
              </div>
            </section>
          </div>

          {/* Back to Home Link */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} HomeQR. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

