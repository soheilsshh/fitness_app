// app/admin/dashboard/_components/DashboardShell.jsx
export default function DashboardShell({ title, children }) {
  return (
    <div className="relative space-y-4">
      {children}
    </div>
  );
}
