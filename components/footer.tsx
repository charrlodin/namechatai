'use client'

export function Footer() {
  return (
    <footer className="py-8 bg-black border-t border-gray-800" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} Name Check AI. All rights reserved.
          </div>
          <nav aria-label="Footer Navigation">
            <ul className="flex flex-wrap gap-6 justify-center">
              <li>
                <a 
                  href="/terms" 
                  className="text-sm text-gray-400 hover:text-white focus:text-white transition-colors focus:outline-none focus:underline"
                  aria-label="Terms of Service"
                >
                  Terms
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm text-gray-400 hover:text-white focus:text-white transition-colors focus:outline-none focus:underline"
                  aria-label="Privacy Policy"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm text-gray-400 hover:text-white focus:text-white transition-colors focus:outline-none focus:underline"
                  aria-label="Contact Us"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
