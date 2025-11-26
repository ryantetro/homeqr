import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          </Link>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} HomeQR. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

