import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones — ASTRA",
  description:
    "Términos y condiciones de uso de ASTRA (theastra.xyz). Plataforma de cálculo esotérico-astronómico.",
};

export default function PaginaTerminos() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--shell-fondo)", color: "var(--shell-texto)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-md border-b"
        style={{
          background: "color-mix(in srgb, var(--shell-fondo) 85%, transparent)",
          borderColor: "var(--shell-borde)",
        }}
      >
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--color-acento)" }}>
            <span>ASTRA</span>
          </Link>
          <Link
            href="/"
            className="text-sm transition-colors hover:underline"
            style={{ color: "var(--shell-texto-secundario)" }}
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-sm mb-10" style={{ color: "var(--shell-texto-secundario)" }}>
          Última actualización: abril 2026
        </p>

        <div className="space-y-10 leading-relaxed" style={{ color: "var(--shell-texto)" }}>
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              1. Identificación del servicio
            </h2>
            <p>
              ASTRA es una plataforma digital accesible desde{" "}
              <strong>theastra.xyz</strong>, operada por <strong>Odín Technologies</strong> (en adelante,
              &ldquo;ASTRA&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;la plataforma&rdquo;). ASTRA ofrece
              herramientas de cálculo e interpretación basadas en astrología occidental, diseño humano,
              numerología, revoluciones solares y tránsitos planetarios.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              2. Aceptación de los términos
            </h2>
            <p>
              Al acceder, navegar o utilizar cualquier funcionalidad de ASTRA, usted declara haber leído,
              comprendido y aceptado estos Términos y Condiciones en su totalidad. Si no está de acuerdo con
              alguna disposición, le solicitamos que se abstenga de utilizar la plataforma.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              3. Requisitos de uso y mayoría de edad
            </h2>
            <p>
              Para utilizar ASTRA, usted debe ser mayor de 18 años o contar con el consentimiento verificable
              de su padre, madre o tutor legal. Al crear una cuenta, usted declara cumplir con este requisito.
              ASTRA no recopila intencionalmente datos de menores de edad sin autorización parental.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              4. Naturaleza del servicio
            </h2>
            <p>
              ASTRA proporciona interpretaciones astrológicas, numerológicas y de diseño humano con
              carácter <strong>orientativo, educativo y de entretenimiento</strong>. Los contenidos
              generados por la plataforma no constituyen asesoramiento profesional de ninguna índole,
              incluyendo pero no limitado a asesoramiento médico, psicológico, legal, financiero o
              terapéutico.
            </p>
            <p className="mt-3">
              Las lecturas, cálculos y reportes son el resultado de algoritmos basados en tradiciones
              esotéricas y astronómicas. Su valor reside en la reflexión personal y el autoconocimiento,
              no en la predicción literal de eventos futuros.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              5. Descargo importante
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Los cálculos astronómicos se realizan con la mayor precisión posible utilizando efemérides
                reconocidas (Swiss Ephemeris), pero pueden contener márgenes de error inherentes al método
                de cálculo o a la precisión de los datos proporcionados por el usuario.
              </li>
              <li>
                Las interpretaciones <strong>no constituyen verdades absolutas</strong> ni deben tomarse
                como tales. Son aproximaciones basadas en sistemas simbólicos tradicionales.
              </li>
              <li>
                ASTRA puede utilizar tecnologías de inteligencia artificial (IA) para generar
                interpretaciones, resúmenes y contenido personalizado. Dichos contenidos son generados
                algorítmicamente y deben evaluarse con criterio propio.
              </li>
              <li>
                El usuario es el único responsable de las decisiones que tome basándose en la información
                proporcionada por ASTRA.
              </li>
              <li>
                ASTRA no sustituye la consulta con profesionales habilitados en las áreas de salud,
                derecho, finanzas u otras disciplinas reguladas.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              6. Limitaciones de responsabilidad
            </h2>
            <p>
              ASTRA y Odín Technologies no serán responsables, en la máxima medida permitida por la ley
              aplicable, por daños directos, indirectos, incidentales, consecuentes o especiales derivados
              del uso o la imposibilidad de uso de la plataforma, incluyendo pero no limitado a pérdidas
              económicas, daño moral o perjuicio derivado de decisiones tomadas con base en el contenido
              de ASTRA.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              7. Uso indebido y conductas prohibidas
            </h2>
            <p>Queda expresamente prohibido:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                Realizar scraping, extracción masiva de datos o ingeniería inversa sobre la plataforma,
                sus algoritmos o su contenido.
              </li>
              <li>
                Revender, redistribuir o comercializar el contenido generado por ASTRA sin autorización
                escrita previa.
              </li>
              <li>
                Utilizar la plataforma para acosar, difamar, intimidar o realizar cualquier actividad
                ilícita contra terceros.
              </li>
              <li>
                Intentar acceder a cuentas de otros usuarios o a áreas restringidas del sistema sin
                autorización.
              </li>
              <li>
                Sobrecargar intencionalmente los servidores o interferir con el funcionamiento normal
                de la plataforma.
              </li>
            </ul>
            <p className="mt-3">
              El incumplimiento de estas disposiciones podrá dar lugar a la suspensión o terminación
              inmediata de la cuenta del usuario, sin perjuicio de las acciones legales que correspondan.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              8. Propiedad intelectual
            </h2>
            <p>
              Todo el contenido de ASTRA, incluyendo pero no limitado a textos, diseños, gráficos,
              logotipos, íconos, algoritmos, código fuente, bases de datos e interfaces de usuario, es
              propiedad de Odín Technologies o de sus licenciantes, y se encuentra protegido por las leyes
              de propiedad intelectual aplicables.
            </p>
            <p className="mt-3">
              Se concede al usuario una licencia limitada, no exclusiva, intransferible y revocable para
              utilizar la plataforma conforme a estos términos. Esta licencia no implica cesión de
              derechos de propiedad intelectual.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              9. Suscripciones, pagos, renovaciones y cancelaciones
            </h2>
            <p>
              ASTRA ofrece planes de suscripción con funcionalidades diferenciadas. Los pagos se procesan
              a través de <strong>MercadoPago</strong> u otros procesadores de pago habilitados.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Las suscripciones se renuevan automáticamente al finalizar cada período de facturación,
                salvo que el usuario las cancele previamente.
              </li>
              <li>
                El usuario puede cancelar su suscripción en cualquier momento desde su panel de cuenta.
                La cancelación será efectiva al finalizar el período de facturación en curso.
              </li>
              <li>
                No se realizarán reembolsos por períodos de suscripción ya consumidos o parcialmente
                utilizados, salvo que la legislación aplicable disponga lo contrario.
              </li>
              <li>
                ASTRA se reserva el derecho de modificar los precios de los planes con un aviso previo
                de al menos 30 días. Los cambios de precio no afectarán períodos ya facturados.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              10. Disponibilidad del servicio
            </h2>
            <p>
              ASTRA se esfuerza por mantener la plataforma disponible de forma continua. Sin embargo,
              no se garantiza un tiempo de actividad del 100 %. El servicio podrá interrumpirse temporal
              o permanentemente por mantenimiento programado, actualizaciones, fuerza mayor o causas
              ajenas a nuestro control. ASTRA no será responsable por interrupciones del servicio ni
              por la pérdida de datos derivada de dichas interrupciones.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              11. Modificaciones a los términos
            </h2>
            <p>
              ASTRA se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
              Las modificaciones serán publicadas en esta misma página con la fecha de actualización
              correspondiente. El uso continuado de la plataforma tras la publicación de cambios
              constituye la aceptación de los términos modificados.
            </p>
            <p className="mt-3">
              En caso de modificaciones sustanciales, ASTRA procurará notificar a los usuarios
              registrados por correo electrónico o mediante un aviso destacado en la plataforma.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              12. Terminación de cuentas
            </h2>
            <p>
              ASTRA se reserva el derecho de suspender o cancelar cuentas de usuario que infrinjan
              estos términos, que realicen un uso abusivo de la plataforma o que pongan en riesgo
              la seguridad, estabilidad o reputación del servicio. La suspensión o terminación podrá
              realizarse sin previo aviso cuando la gravedad de la infracción lo justifique.
            </p>
            <p className="mt-3">
              El usuario podrá solicitar la eliminación de su cuenta en cualquier momento, lo que
              conllevará la eliminación de sus datos personales conforme a nuestra Política de
              Privacidad.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              13. Privacidad
            </h2>
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link
                href="/politica-de-privacidad"
                className="underline font-medium"
                style={{ color: "var(--color-acento)" }}
              >
                Política de Privacidad
              </Link>
              , que forma parte integral de estos Términos y Condiciones. Le recomendamos leerla
              detenidamente para comprender cómo recopilamos, utilizamos y protegemos su información.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              14. Contacto
            </h2>
            <p>
              Para consultas, reclamos o solicitudes relacionadas con estos Términos y Condiciones,
              puede comunicarse con nosotros a través del siguiente correo electrónico:
            </p>
            <p className="mt-2">
              <a
                href="mailto:soporte@theastra.xyz"
                className="underline font-medium"
                style={{ color: "var(--color-acento)" }}
              >
                soporte@theastra.xyz
              </a>
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              15. Ley aplicable y jurisdicción
            </h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la <strong>República Argentina</strong>.
              Cualquier controversia derivada de la interpretación o aplicación de los presentes términos
              será sometida a la jurisdicción de los tribunales ordinarios competentes de la Ciudad
              Autónoma de Buenos Aires, República Argentina, renunciando las partes a cualquier otro fuero
              que pudiera corresponderles.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer
          className="mt-16 pt-8 border-t text-sm text-center"
          style={{ borderColor: "var(--shell-borde)", color: "var(--shell-texto-secundario)" }}
        >
          <p>
            ASTRA — Odín Technologies &copy; {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link
              href="/politica-de-privacidad"
              className="underline hover:opacity-80 transition-opacity"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              Política de Privacidad
            </Link>
            <span style={{ color: "var(--shell-borde)" }}>|</span>
            <Link
              href="/"
              className="underline hover:opacity-80 transition-opacity"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              Volver al inicio
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
