import { Link } from '@tanstack/react-router'
import { HeaderBrand } from './HeaderBrand'

/** Main-site identity, stacked and centered on mobile. */
export function FooterBrand() {
  return (
    <Link
      to="/"
      className="inline-flex items-center cursor-pointer group select-none max-w-fit rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
    >
      <HeaderBrand className="flex-col md:flex-row" />
    </Link>
  )
}
