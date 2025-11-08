'use client';

export default function ExtensionLink() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert(
      'Install the HomeQR Chrome extension to generate QR codes from Zillow listings'
    );
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      Generate QR from Zillow
    </a>
  );
}

