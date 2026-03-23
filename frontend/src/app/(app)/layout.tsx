import LayoutApp from "@/componentes/layouts/layout-app";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutApp>{children}</LayoutApp>;
}
