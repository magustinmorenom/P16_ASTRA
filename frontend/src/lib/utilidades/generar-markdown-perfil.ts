import type { Perfil, CalculosPerfil } from "@/lib/tipos";

/**
 * Genera un string Markdown con el perfil cósmico completo del usuario.
 * Función pura: datos → string.
 */
export function generarMarkdownPerfil(
  perfil: Perfil | null | undefined,
  calculos: CalculosPerfil | null | undefined
): string {
  const lineas: string[] = [];

  // Header
  const nombre = perfil?.nombre ?? "Usuario";
  lineas.push(`# Perfil Cósmico — ${nombre}`);
  lineas.push("");
  if (perfil) {
    lineas.push(`- **Nacimiento:** ${perfil.fecha_nacimiento} a las ${perfil.hora_nacimiento}`);
    lineas.push(`- **Lugar:** ${perfil.ciudad_nacimiento}, ${perfil.pais_nacimiento}`);
  }
  lineas.push(`- **Generado:** ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`);
  lineas.push("");
  lineas.push("---");
  lineas.push("");

  // Carta Astral
  lineas.push("## Carta Astral");
  lineas.push("");

  const natal = calculos?.natal;
  if (!natal) {
    lineas.push("_Datos no disponibles._");
    lineas.push("");
  } else {
    // Ascendente y MC
    if (natal.ascendente) {
      lineas.push(`**Ascendente:** ${natal.ascendente.signo} ${natal.ascendente.grado_en_signo.toFixed(1)}°`);
    }
    if (natal.medio_cielo) {
      lineas.push(`**Medio Cielo:** ${natal.medio_cielo.signo} ${natal.medio_cielo.grado_en_signo.toFixed(1)}°`);
    }
    lineas.push("");

    // Planetas
    if (natal.planetas?.length) {
      lineas.push("### Planetas");
      lineas.push("");
      lineas.push("| Planeta | Signo | Grado | Casa | R | Dignidad |");
      lineas.push("|---------|-------|-------|------|---|----------|");
      for (const p of natal.planetas) {
        const retro = p.retrogrado ? "R" : "";
        const dignidad = p.dignidad ?? "—";
        lineas.push(`| ${p.nombre} | ${p.signo} | ${p.grado_en_signo.toFixed(2)}° | ${p.casa} | ${retro} | ${dignidad} |`);
      }
      lineas.push("");
    }

    // Casas
    if (natal.casas?.length) {
      lineas.push("### Casas");
      lineas.push("");
      lineas.push("| Casa | Signo | Grado |");
      lineas.push("|------|-------|-------|");
      for (const c of natal.casas) {
        lineas.push(`| ${c.numero} | ${c.signo} | ${c.grado_en_signo.toFixed(2)}° |`);
      }
      lineas.push("");
    }

    // Aspectos
    if (natal.aspectos?.length) {
      lineas.push("### Aspectos");
      lineas.push("");
      lineas.push("| Planeta 1 | Aspecto | Planeta 2 | Orbe | Tipo |");
      lineas.push("|-----------|---------|-----------|------|------|");
      for (const a of natal.aspectos) {
        const tipo = a.aplicativo ? "Aplicativo" : "Separativo";
        lineas.push(`| ${a.planeta1} | ${a.tipo} | ${a.planeta2} | ${a.orbe.toFixed(2)}° | ${tipo} |`);
      }
      lineas.push("");
    }
  }

  lineas.push("---");
  lineas.push("");

  // Diseño Humano
  lineas.push("## Diseño Humano");
  lineas.push("");

  const hd = calculos?.diseno_humano;
  if (!hd) {
    lineas.push("_Datos no disponibles._");
    lineas.push("");
  } else {
    lineas.push(`- **Tipo:** ${hd.tipo}`);
    lineas.push(`- **Autoridad:** ${hd.autoridad}`);
    lineas.push(`- **Perfil:** ${hd.perfil}`);
    lineas.push(`- **Definición:** ${hd.definicion}`);

    if (hd.cruz_encarnacion?.puertas) {
      const puertas = hd.cruz_encarnacion.puertas.filter((p): p is number => p !== null).join(" / ");
      lineas.push(`- **Cruz de Encarnación:** ${puertas}`);
    }
    lineas.push("");

    // Centros
    if (hd.centros) {
      lineas.push("### Centros");
      lineas.push("");
      lineas.push("| Centro | Estado |");
      lineas.push("|--------|--------|");
      for (const [centro, estado] of Object.entries(hd.centros)) {
        lineas.push(`| ${centro.charAt(0).toUpperCase() + centro.slice(1)} | ${estado.charAt(0).toUpperCase() + estado.slice(1)} |`);
      }
      lineas.push("");
    }

    // Canales
    if (hd.canales?.length) {
      lineas.push("### Canales");
      lineas.push("");
      lineas.push("| Puertas | Nombre | Centros |");
      lineas.push("|---------|--------|---------|");
      for (const canal of hd.canales) {
        const puertas = `${canal.puertas[0]}-${canal.puertas[1]}`;
        const centros = `${canal.centros[0]} ↔ ${canal.centros[1]}`;
        lineas.push(`| ${puertas} | ${canal.nombre} | ${centros} |`);
      }
      lineas.push("");
    }

    // Activaciones conscientes
    if (hd.activaciones_conscientes?.length) {
      lineas.push("### Activaciones Conscientes (Personalidad)");
      lineas.push("");
      lineas.push("| Planeta | Puerta | Línea |");
      lineas.push("|---------|--------|-------|");
      for (const a of hd.activaciones_conscientes) {
        lineas.push(`| ${a.planeta} | ${a.puerta} | ${a.linea} |`);
      }
      lineas.push("");
    }

    // Activaciones inconscientes
    if (hd.activaciones_inconscientes?.length) {
      lineas.push("### Activaciones Inconscientes (Diseño)");
      lineas.push("");
      lineas.push("| Planeta | Puerta | Línea |");
      lineas.push("|---------|--------|-------|");
      for (const a of hd.activaciones_inconscientes) {
        lineas.push(`| ${a.planeta} | ${a.puerta} | ${a.linea} |`);
      }
      lineas.push("");
    }
  }

  lineas.push("---");
  lineas.push("");

  // Numerología
  lineas.push("## Numerología");
  lineas.push("");

  const num = calculos?.numerologia;
  if (!num) {
    lineas.push("_Datos no disponibles._");
    lineas.push("");
  } else {
    lineas.push(`**Sistema:** ${num.sistema.charAt(0).toUpperCase() + num.sistema.slice(1)}`);
    lineas.push("");

    const claves: [string, keyof typeof num][] = [
      ["Camino de Vida", "camino_de_vida"],
      ["Expresión", "expresion"],
      ["Impulso del Alma", "impulso_del_alma"],
      ["Personalidad", "personalidad"],
      ["Número de Nacimiento", "numero_nacimiento"],
      ["Año Personal", "anio_personal"],
    ];

    lineas.push("| Número | Valor | Descripción |");
    lineas.push("|--------|-------|-------------|");
    for (const [etiqueta, clave] of claves) {
      const dato = num[clave];
      if (dato && typeof dato === "object" && "numero" in dato) {
        lineas.push(`| ${etiqueta} | ${dato.numero} | ${dato.descripcion} |`);
      }
    }
    lineas.push("");

    if (num.numeros_maestros_presentes?.length) {
      lineas.push(`**Números Maestros presentes:** ${num.numeros_maestros_presentes.join(", ")}`);
      lineas.push("");
    }
  }

  // Footer
  lineas.push("---");
  lineas.push("");
  lineas.push(`_Generado por ASTRA · CosmicEngine_`);

  return lineas.join("\n");
}
