export const Logo = ({ className = "h-10 w-10 object-contain" }) => (
  // Plain image only. Every call site (Navbar, RoleSidebar, AuthShell) already
  // wraps the logo in its own <Link>/<span>; rendering a <Link> here too would
  // nest <a> inside <a> — invalid HTML that triggers React hydration error #418.
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/fitino-logo.png" alt="فیتینو" className={className} />
);
