export const Logo = ({ className = "h-6 w-6" }) => (
  // Plain image only. Every call site (Navbar, RoleSidebar, AuthShell) already
  // wraps the logo in its own <Link>/<span>; rendering a <Link> here too would
  // nest <a> inside <a> — invalid HTML that triggers React hydration error #418.
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/icon0.svg" alt="Fitino" className={className} />
);
