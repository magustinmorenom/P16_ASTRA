import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — ASTRA",
  description:
    "Política de privacidad de ASTRA (theastra.xyz). Cómo recopilamos, utilizamos y protegemos sus datos personales.",
};

export default function PaginaPoliticaPrivacidad() {
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
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-sm mb-10" style={{ color: "var(--shell-texto-secundario)" }}>
          Última actualización: abril 2026
        </p>

        <div className="space-y-10 leading-relaxed" style={{ color: "var(--shell-texto)" }}>
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              1. Introducción
            </h2>
            <p>
              En ASTRA (<strong>theastra.xyz</strong>), operado por <strong>Odín Technologies</strong>,
              nos comprometemos a proteger la privacidad y los datos personales de nuestros usuarios.
              Esta Política de Privacidad describe qué información recopilamos, cómo la utilizamos,
              con quién la compartimos y qué derechos tiene usted sobre sus datos.
            </p>
            <p className="mt-3">
              Al utilizar ASTRA, usted acepta las prácticas descritas en esta política. Le recomendamos
              leerla en su totalidad junto con nuestros{" "}
              <Link
                href="/terminos"
                className="underline font-medium"
                style={{ color: "var(--color-acento)" }}
              >
                Términos y Condiciones
              </Link>
              .
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              2. Datos que recopilamos
            </h2>
            <p>Recopilamos las siguientes categorías de información:</p>

            <h3 className="text-base font-semibold mt-4 mb-2">2.1. Datos de cuenta</h3>
            <p>
              Al registrarse, recopilamos su nombre, dirección de correo electrónico y, si utiliza
              inicio de sesión social (Google), los datos básicos de su perfil público proporcionados
              por el proveedor de autenticación.
            </p>

            <h3 className="text-base font-semibold mt-4 mb-2">2.2. Datos de nacimiento</h3>
            <p>
              Para generar sus lecturas personalizadas, recopilamos su fecha de nacimiento, hora de
              nacimiento y lugar de nacimiento. Estos datos son esenciales para los cálculos
              astrológicos, numerológicos y de diseño humano.
            </p>

            <h3 className="text-base font-semibold mt-4 mb-2">2.3. Datos de uso</h3>
            <p>
              Registramos información sobre cómo interactúa con la plataforma, incluyendo las
              secciones visitadas, las funcionalidades utilizadas, la frecuencia de uso y las
              preferencias de configuración.
            </p>

            <h3 className="text-base font-semibold mt-4 mb-2">2.4. Datos técnicos</h3>
            <p>
              Recopilamos automáticamente información técnica como tipo de dispositivo, sistema
              operativo, navegador, dirección IP, idioma preferido y zona horaria.
            </p>

            <h3 className="text-base font-semibold mt-4 mb-2">2.5. Datos de suscripción y facturación</h3>
            <p>
              Si adquiere una suscripción, recopilamos los datos necesarios para procesar el pago
              a través de nuestro procesador de pagos (MercadoPago). ASTRA no almacena números de
              tarjeta de crédito ni datos financieros sensibles; estos son gestionados directamente
              por el procesador de pagos conforme a sus propias políticas de seguridad.
            </p>

            <h3 className="text-base font-semibold mt-4 mb-2">2.6. Preferencias y configuración</h3>
            <p>
              Almacenamos sus preferencias de tema visual, idioma, configuración de notificaciones
              y cualquier personalización que realice en la plataforma.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              3. Uso de los datos
            </h2>
            <p>Utilizamos su información para los siguientes fines:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Prestación del servicio:</strong> generar cartas astrales, cálculos
                numerológicos, perfiles de diseño humano, revoluciones solares, tránsitos y demás
                lecturas personalizadas.
              </li>
              <li>
                <strong>Personalización:</strong> adaptar la experiencia de usuario, las
                recomendaciones y el contenido a su perfil y preferencias.
              </li>
              <li>
                <strong>Mejora del servicio:</strong> analizar patrones de uso para optimizar la
                plataforma, corregir errores y desarrollar nuevas funcionalidades.
              </li>
              <li>
                <strong>Facturación:</strong> procesar pagos, gestionar suscripciones y emitir
                comprobantes.
              </li>
              <li>
                <strong>Comunicación:</strong> enviar notificaciones relevantes sobre su cuenta,
                actualizaciones del servicio, cambios en los términos o novedades de la plataforma.
              </li>
              <li>
                <strong>Seguridad:</strong> detectar y prevenir actividades fraudulentas, accesos
                no autorizados y abusos del servicio.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              4. Bases legales del tratamiento
            </h2>
            <p>El tratamiento de sus datos se fundamenta en las siguientes bases legales:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Consentimiento:</strong> usted consiente el tratamiento de sus datos al
                registrarse y utilizar la plataforma, especialmente en lo referido a datos de
                nacimiento utilizados para lecturas personalizadas.
              </li>
              <li>
                <strong>Ejecución contractual:</strong> el tratamiento es necesario para cumplir
                con la relación contractual derivada de la aceptación de los Términos y Condiciones
                y la prestación del servicio.
              </li>
              <li>
                <strong>Interés legítimo:</strong> mejora del servicio, seguridad de la plataforma
                y prevención de fraude.
              </li>
              <li>
                <strong>Cumplimiento legal:</strong> obligaciones fiscales, contables y regulatorias
                aplicables.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              5. Proveedores y terceros
            </h2>
            <p>
              Podemos compartir datos con terceros proveedores que nos asisten en la prestación del
              servicio, bajo estrictas obligaciones de confidencialidad:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Proveedores de infraestructura (hosting):</strong> servicios de computación
                en la nube para alojar la plataforma y sus bases de datos.
              </li>
              <li>
                <strong>Procesadores de pago:</strong> MercadoPago para la gestión de suscripciones
                y cobros. MercadoPago opera bajo sus propias políticas de privacidad y seguridad.
              </li>
              <li>
                <strong>Proveedores de inteligencia artificial:</strong> servicios de IA para
                generar interpretaciones personalizadas y contenido contextual. Los datos enviados
                a estos proveedores se limitan a la información estrictamente necesaria para la
                generación del contenido.
              </li>
              <li>
                <strong>Servicios de analítica:</strong> herramientas de análisis para comprender
                el uso de la plataforma y mejorar la experiencia del usuario.
              </li>
              <li>
                <strong>Servicios de correo electrónico:</strong> para el envío de notificaciones
                transaccionales y comunicaciones del servicio.
              </li>
            </ul>
            <p className="mt-3">
              No vendemos, alquilamos ni cedemos sus datos personales a terceros con fines
              comerciales o publicitarios.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              6. Tratamiento automatizado
            </h2>
            <p>
              ASTRA utiliza procesos automatizados para generar sus lecturas y reportes personalizados.
              Esto incluye:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Cálculos astronómicos automatizados:</strong> basados en sus datos de
                nacimiento (fecha, hora y lugar), utilizando efemérides astronómicas reconocidas
                (Swiss Ephemeris) para determinar posiciones planetarias, casas astrológicas, aspectos
                y configuraciones celestes.
              </li>
              <li>
                <strong>Interpretaciones generadas por IA:</strong> algunos contenidos interpretativos
                son generados mediante modelos de inteligencia artificial, tomando como entrada los
                resultados de los cálculos astronómicos y numerológicos. Estas interpretaciones tienen
                carácter orientativo y no constituyen asesoramiento profesional.
              </li>
              <li>
                <strong>Cálculos numerológicos:</strong> basados en su nombre y fecha de nacimiento,
                aplicando sistemas de correspondencia numérica tradicionales.
              </li>
            </ul>
            <p className="mt-3">
              Estos procesos no implican la elaboración de perfiles con efectos jurídicos o
              significativos sobre su persona, sino que se limitan a ofrecer contenido informativo
              y de entretenimiento.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              7. Conservación de datos
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Datos de cuenta y perfil:</strong> se conservan mientras su cuenta permanezca
                activa. Puede solicitar la eliminación en cualquier momento.
              </li>
              <li>
                <strong>Datos de facturación:</strong> se conservan durante los plazos exigidos por
                la legislación fiscal y contable aplicable (mínimo 10 años en Argentina, conforme
                al Código de Comercio).
              </li>
              <li>
                <strong>Datos de uso y técnicos:</strong> se conservan de forma agregada y
                anonimizada para fines estadísticos. Los registros individuales se eliminan
                periódicamente.
              </li>
              <li>
                <strong>Eliminación a solicitud:</strong> al solicitar la eliminación de su cuenta,
                procederemos a borrar sus datos personales en un plazo razonable, excepto aquellos
                que debamos conservar por obligación legal.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              8. Seguridad
            </h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas razonables para proteger
              sus datos personales contra el acceso no autorizado, la alteración, divulgación o
              destrucción. Entre estas medidas se incluyen:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Cifrado de contraseñas mediante algoritmos de hash seguros (bcrypt).</li>
              <li>Comunicaciones protegidas mediante protocolo HTTPS/TLS.</li>
              <li>Tokens de autenticación con expiración y renovación controlada (JWT).</li>
              <li>Separación de entornos de desarrollo, pruebas y producción.</li>
              <li>Control de acceso basado en roles y permisos.</li>
            </ul>
            <p className="mt-3">
              No obstante, ningún sistema de seguridad es infalible. No podemos garantizar la
              seguridad absoluta de sus datos, y usted reconoce que la transmisión de información
              por Internet conlleva riesgos inherentes.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              9. Derechos del usuario
            </h2>
            <p>
              Usted tiene los siguientes derechos sobre sus datos personales, que puede ejercer
              contactándonos a{" "}
              <a
                href="mailto:privacidad@theastra.xyz"
                className="underline font-medium"
                style={{ color: "var(--color-acento)" }}
              >
                privacidad@theastra.xyz
              </a>
              :
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Acceso:</strong> solicitar una copia de los datos personales que tenemos
                sobre usted.
              </li>
              <li>
                <strong>Rectificación:</strong> corregir datos inexactos o incompletos.
              </li>
              <li>
                <strong>Supresión:</strong> solicitar la eliminación de sus datos personales,
                sujeto a obligaciones legales de conservación.
              </li>
              <li>
                <strong>Portabilidad:</strong> solicitar la entrega de sus datos en un formato
                estructurado y de uso común, cuando sea técnicamente factible.
              </li>
              <li>
                <strong>Oposición:</strong> oponerse al tratamiento de sus datos en determinadas
                circunstancias.
              </li>
              <li>
                <strong>Revocación del consentimiento:</strong> retirar su consentimiento en
                cualquier momento, sin que ello afecte la licitud del tratamiento previo.
              </li>
            </ul>
            <p className="mt-3">
              Responderemos a su solicitud en un plazo máximo de 30 días hábiles. En caso de
              considerar que sus derechos no han sido debidamente atendidos, podrá presentar un
              reclamo ante la Agencia de Acceso a la Información Pública (AAIP) de la República
              Argentina.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              10. Transferencias internacionales
            </h2>
            <p>
              Los proveedores de infraestructura, inteligencia artificial y servicios auxiliares
              que utilizamos pueden procesar datos en servidores ubicados fuera de la República
              Argentina, incluyendo Estados Unidos, la Unión Europea y otras jurisdicciones.
            </p>
            <p className="mt-3">
              En estos casos, nos aseguramos de que existan garantías adecuadas para la protección
              de sus datos, tales como cláusulas contractuales tipo, certificaciones de seguridad
              o el cumplimiento de marcos normativos equivalentes. Utilizamos proveedores que
              cumplen con estándares reconocidos de protección de datos.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              11. Cookies y tecnologías similares
            </h2>
            <p>
              ASTRA utiliza cookies y tecnologías similares de forma mínima y con los siguientes
              propósitos:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Cookies de sesión:</strong> necesarias para mantener su sesión activa
                mientras navega por la plataforma.
              </li>
              <li>
                <strong>Cookies de preferencias:</strong> para recordar su configuración de tema
                visual y otras preferencias de interfaz.
              </li>
              <li>
                <strong>Cookies de analítica:</strong> para recopilar información agregada sobre
                el uso de la plataforma y mejorar el servicio. Estas cookies no identifican
                personalmente al usuario.
              </li>
            </ul>
            <p className="mt-3">
              Puede configurar su navegador para rechazar cookies, aunque esto podría afectar
              la funcionalidad de la plataforma.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              12. Menores de edad
            </h2>
            <p>
              ASTRA no está dirigido a menores de 18 años. No recopilamos intencionalmente datos
              de menores de edad sin el consentimiento verificable de un padre, madre o tutor legal.
              Si tomamos conocimiento de que hemos recopilado datos de un menor sin la debida
              autorización, procederemos a eliminar dicha información de forma inmediata.
            </p>
            <p className="mt-3">
              Si usted es padre, madre o tutor y cree que su hijo/a menor ha proporcionado datos
              a ASTRA sin su consentimiento, le rogamos que se comunique con nosotros para que
              podamos tomar las medidas correspondientes.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              13. Cambios en esta política
            </h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier
              momento. Las modificaciones serán publicadas en esta página con la fecha de
              actualización correspondiente.
            </p>
            <p className="mt-3">
              En caso de cambios significativos, procuraremos notificar a los usuarios registrados
              mediante un aviso en la plataforma o por correo electrónico. El uso continuado de
              ASTRA tras la publicación de cambios constituye la aceptación de la política
              actualizada.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-acento)" }}>
              14. Contacto
            </h2>
            <p>
              Para consultas, solicitudes de ejercicio de derechos o cualquier inquietud
              relacionada con el tratamiento de sus datos personales, puede contactarnos a:
            </p>
            <p className="mt-2">
              <a
                href="mailto:privacidad@theastra.xyz"
                className="underline font-medium"
                style={{ color: "var(--color-acento)" }}
              >
                privacidad@theastra.xyz
              </a>
            </p>
            <p className="mt-3" style={{ color: "var(--shell-texto-secundario)" }}>
              Responsable del tratamiento: Odín Technologies
              <br />
              Sitio web: theastra.xyz
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
              href="/terminos"
              className="underline hover:opacity-80 transition-opacity"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              Términos y Condiciones
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
