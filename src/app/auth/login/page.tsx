import Link from 'next/link';
import Image from 'next/image';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Login - HomeQR',
  description: 'Sign in to your HomeQR account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-white px-4 pt-16 pb-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4 transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={80}
              height={80}
              className="h-20 w-20 mx-auto object-contain"
              priority
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Sign in to HomeQR
          </h2>
          <p className="text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              create a new account
            </Link>
          </p>
        </div>
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-6">
          <AuthForm mode="login" />
          <div className="mt-4 text-center">
            <Link
              href="/auth/reset"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

