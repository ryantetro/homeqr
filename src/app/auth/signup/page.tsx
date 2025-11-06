import Link from 'next/link';
import Image from 'next/image';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Sign Up - HomeQR',
  description: 'Create a new HomeQR account',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-white px-4 pt-6 pb-6">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          <Link href="/" className="inline-block mb-2 transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={64}
              height={64}
              className="h-16 w-16 mx-auto object-contain"
              priority
            />
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mb-0.5">
            Create your account
          </h2>
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-5">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}

