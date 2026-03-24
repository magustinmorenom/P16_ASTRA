/**
 * Layout público para páginas post-checkout de MercadoPago.
 * NO requiere autenticación — MP abre el back_url en su browser in-app
 * donde no existe la sesión JWT del usuario.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo p-6">
      {children}
    </div>
  );
}
