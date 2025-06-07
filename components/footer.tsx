import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-700 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
        <div className="mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} GateLog. All rights reserved.
        </div>
        <nav className="flex space-x-4">
          <Link href="/terms-of-service" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/about-us" className="hover:underline">
            About Us
          </Link>
          <Link href="/contact-support" className="hover:underline">
            Contact Support
          </Link>
        </nav>
      </div>
    </footer>
  )
}
