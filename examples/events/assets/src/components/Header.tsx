import { Link } from '@tanstack/react-router'

import HeaderNav from './HeaderNav'
import { showRemyAssistant } from './RemyAssistant'

export default function Header() {
  const handleRemyClick = () => {
    showRemyAssistant.setState(() => true)
  }

  return (
    <>
      <HeaderNav />
      <header className="font-display font-semibold fixed top-20 left-0 right-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50 transition-all">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex gap-2 justify-between items-center">
          <div className="flex flex-row items-center space-x-10">
            <Link to="/" className="group flex items-center gap-3">
              <img 
                src="/conference-logo.png" 
                alt="Haute Pâtisserie 2026" 
                className="h-14 w-auto"
              />
            </Link>
            <div className="flex gap-8 text-lg">
              <Link
                to="/schedule"
                className="text-cream/80 hover:text-gold transition-colors"
                activeProps={{ className: 'text-gold' }}
              >
                Schedule
              </Link>
              <Link
                to="/speakers"
                className="text-cream/80 hover:text-gold transition-colors"
                activeProps={{ className: 'text-gold' }}
              >
                Speakers
              </Link>
              <Link
                to="/talks"
                className="text-cream/80 hover:text-gold transition-colors"
                activeProps={{ className: 'text-gold' }}
              >
                Sessions
              </Link>
            </div>
          </div>
          <button
            onClick={handleRemyClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-copper to-copper-dark hover:from-copper-light hover:to-copper text-charcoal font-semibold text-sm transition-all hover:shadow-lg hover:shadow-copper/20 hover:scale-[1.02] border border-gold/20"
          >
            <span className="text-base">👨‍🍳</span>
            <span className="tracking-wide">Ask Remy</span>
          </button>
        </nav>
      </header>
    </>
  )
}
