'use client';

import Card from '@/components/ui/Card';
import Image from 'next/image';

interface AgentCardProps {
  agent: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    brokerage: string | null;
    avatar_url: string | null;
    logo_url: string | null;
    license_number: string | null;
    calendly_url: string | null;
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const phoneNumber = formatPhone(agent.phone);
  const smsLink = agent.phone ? `sms:${agent.phone.replace(/\D/g, '')}` : null;
  const telLink = agent.phone ? `tel:${agent.phone.replace(/\D/g, '')}` : null;

  return (
    <Card className="border-0 shadow-xl bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="p-8">
        <div className="flex flex-col items-center text-center mb-6">
          {agent.avatar_url ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0 mb-4 ring-4 ring-white shadow-lg">
              <Image
                src={agent.avatar_url}
                alt={agent.full_name || 'Agent'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mb-4 ring-4 ring-white shadow-lg">
              <span className="text-4xl font-bold text-white">
                {agent.full_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
          )}
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {agent.full_name || 'Real Estate Agent'}
              </h3>
              {agent.license_number && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                  ✓ Verified
                </span>
              )}
            </div>
            {agent.brokerage && (
              <div className="flex items-center justify-center gap-2 mb-2">
                {agent.logo_url ? (
                  <div className="relative w-6 h-6 mr-1">
                    <Image
                      src={agent.logo_url}
                      alt={agent.brokerage}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : null}
                <p className="text-base font-medium text-gray-700">{agent.brokerage}</p>
              </div>
            )}
            {agent.license_number && (
              <p className="text-xs text-gray-600 font-medium">License #{agent.license_number}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {phoneNumber && (
            <div className="flex flex-col gap-2">
              {telLink && (
                <a
                  href={telLink}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Agent
                </a>
              )}
              {smsLink && (
                <a
                  href={smsLink}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Text Me This Property
                </a>
              )}
            </div>
          )}

          {agent.calendly_url && (
            <a
              href={agent.calendly_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold text-center hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule a Showing
            </a>
          )}

          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-center hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Agent
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

