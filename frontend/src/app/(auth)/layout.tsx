import LayoutAuth from "@/componentes/layouts/layout-auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutAuth>{children}</LayoutAuth>;
}
