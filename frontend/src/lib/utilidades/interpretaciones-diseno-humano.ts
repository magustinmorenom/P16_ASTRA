import type { Activacion, Canal, CruzEncarnacion, DisenoHumano } from "@/lib/tipos";

export type SeleccionContextualHD =
  | { tipo: "default" }
  | { tipo: "tipo" }
  | { tipo: "autoridad" }
  | { tipo: "perfil" }
  | { tipo: "definicion" }
  | { tipo: "bodygraph" }
  | { tipo: "centro"; clave: string; estado: string }
  | { tipo: "canal"; canal: Canal }
  | {
      tipo: "cruz";
      clave: keyof CruzEncarnacion;
      etiqueta: string;
      puerta: number | null;
    }
  | {
      tipo: "activacion";
      activacion: Activacion;
      origen: "consciente" | "inconsciente";
    };

export interface DetalleContextualHD {
  sobrelinea: string;
  titulo: string;
  resumen: string;
  significadoUsuario: string;
  claves: string[];
  tecnico: Array<{ etiqueta: string; valor: string }>;
}

interface DescriptorBasico {
  titulo: string;
  queEs: string;
  practica: string;
}

const DESCRIPCIONES_TIPO: Record<string, DescriptorBasico> = {
  generador: {
    titulo: "Generador",
    queEs:
      "Los Generadores sostienen energía vital estable. Su estrategia consiste en responder a lo que la vida les presenta en lugar de empujar desde la mente.",
    practica:
      "Tu claridad aparece cuando algo en el cuerpo se enciende de verdad. Si no hay respuesta, no hay que forzar movimiento.",
  },
  "generador manifestante": {
    titulo: "Generador Manifestante",
    queEs:
      "Combina la fuerza sostenida del Generador con la velocidad del Manifestante. Responde primero y luego acelera, optimiza y abre caminos.",
    practica:
      "En vos la energía quiere avanzar rápido, pero funciona mejor cuando primero hubo una respuesta corporal genuina y después se informa el movimiento.",
  },
  manifestador: {
    titulo: "Manifestador",
    queEs:
      "Los Manifestadores están diseñados para iniciar y abrir ciclos. Su estrategia es informar antes de actuar para reducir resistencia en el entorno.",
    practica:
      "Tu energía se ordena cuando respetás tu impulso inicial y lo comunicás con claridad antes de mover piezas.",
  },
  proyector: {
    titulo: "Proyector",
    queEs:
      "Los Proyectores están diseñados para guiar, leer sistemas y dirigir energía ajena con precisión. Su estrategia es esperar reconocimiento e invitación.",
    practica:
      "Tu valor aparece más fuerte cuando tu mirada es recibida. No necesitás producir más; necesitás ser bien visto.",
  },
  reflector: {
    titulo: "Reflector",
    queEs:
      "Los Reflectores leen el estado del entorno completo. Su estrategia es esperar un ciclo lunar antes de decisiones grandes para ganar perspectiva.",
    practica:
      "Tu diseño no busca fijar una identidad rígida. Tu don está en percibir calidad de ambientes, ritmos y personas.",
  },
};

const DESCRIPCIONES_AUTORIDAD: Record<string, DescriptorBasico> = {
  emocional: {
    titulo: "Autoridad Emocional",
    queEs:
      "La verdad no aparece en el primer impulso sino a través de una ola emocional. Las decisiones importantes necesitan tiempo para asentarse.",
    practica:
      "En tu caso, la calma después de la intensidad vale más que la urgencia del momento. Dormir la decisión suele mejorar la lectura.",
  },
  sacral: {
    titulo: "Autoridad Sacral",
    queEs:
      "La decisión aparece como una respuesta corporal inmediata: expansión, sonido, impulso o cierre visceral. Es binaria y muy concreta.",
    practica:
      "Tu cuerpo ya sabe antes que tu cabeza. Cuando la respuesta es tibia o confusa, conviene esperar otra señal.",
  },
  esplenica: {
    titulo: "Autoridad Esplénica",
    queEs:
      "La claridad llega como una intuición instantánea, silenciosa y muy física. No se repite demasiado: se siente una vez y pasa.",
    practica:
      "En vos conviene afinar la escucha de lo sutil. Si lo intuís y el cuerpo se afloja, ahí suele estar la señal.",
  },
  ego: {
    titulo: "Autoridad del Ego",
    queEs:
      "La decisión nace desde la voluntad, el deseo verdadero y la capacidad de comprometer energía propia. Lo correcto se siente como un sí con fuerza.",
    practica:
      "Tu diseño necesita honestidad radical con lo que realmente querés sostener. Si no hay deseo real, el compromiso pesa.",
  },
  auto: {
    titulo: "Autoridad Auto-Proyectada",
    queEs:
      "La claridad aparece al escucharte decir la decisión en voz alta. Tu identidad y dirección interna son la guía principal.",
    practica:
      "Hablar con la persona correcta o escucharte a vos mismo ordena la respuesta. La voz revela lo que el cuerpo ya sabe.",
  },
  lunar: {
    titulo: "Autoridad Lunar",
    queEs:
      "La claridad del Reflector necesita recorrer un ciclo lunar completo. La decisión madura observando el cambio de perspectiva con el tiempo.",
    practica:
      "Tu mejor herramienta es la paciencia ritual. Lo que sigue siendo verdadero con el paso de los días suele ser lo correcto.",
  },
};

const DESCRIPCIONES_DEFINICION: Record<string, DescriptorBasico> = {
  unica: {
    titulo: "Definición Única",
    queEs:
      "La energía definida circula de manera continua dentro de un solo bloque. Hay sensación de coherencia interna y acceso más directo a la propia señal.",
    practica:
      "En vos las piezas internas conversan sin demasiados puentes externos. Lo importante es no tapar esa coherencia con sobreanálisis.",
  },
  simple: {
    titulo: "Definición Simple",
    queEs:
      "La energía definida circula de manera continua dentro de un solo bloque. Hay sensación de coherencia interna y acceso más directo a la propia señal.",
    practica:
      "En vos las piezas internas conversan sin demasiados puentes externos. Lo importante es no tapar esa coherencia con sobreanálisis.",
  },
  partida: {
    titulo: "Definición Partida",
    queEs:
      "La definición está separada en dos áreas internas que no siempre se enlazan de forma directa. Algunas personas o contextos pueden hacer de puente.",
    practica:
      "Tu claridad suele mejorar en conversación o vínculo. No porque te falte algo, sino porque ciertos espejos ordenan tus conexiones.",
  },
  split: {
    titulo: "Definición Partida",
    queEs:
      "La definición está separada en dos áreas internas que no siempre se enlazan de forma directa. Algunas personas o contextos pueden hacer de puente.",
    practica:
      "Tu claridad suele mejorar en conversación o vínculo. No porque te falte algo, sino porque ciertos espejos ordenan tus conexiones.",
  },
  triple: {
    titulo: "Triple Split",
    queEs:
      "La energía definida se organiza en tres grupos. Necesita movimiento, variedad y tiempo para integrar lo que siente y piensa.",
    practica:
      "En vos el procesamiento mejora cuando no te quedás encerrado en una sola atmósfera. Caminar, cambiar de espacio o hablar con varios perfiles ayuda.",
  },
  cuadruple: {
    titulo: "Cuádruple Split",
    queEs:
      "La definición se reparte en varios bloques separados. La integración llega por ritmo, exposición y tiempo, no por presión mental inmediata.",
    practica:
      "Tu diseño agradece los procesos lentos y el contacto con distintas personas. No te conviene exigir una síntesis instantánea.",
  },
};

const DESCRIPCIONES_CENTROS: Record<
  string,
  {
    titulo: string;
    queEs: string;
    definido: string;
    abierto: string;
  }
> = {
  cabeza: {
    titulo: "Cabeza / Corona",
    queEs:
      "Es el centro de inspiración, preguntas y presión mental por resolver algo.",
    definido:
      "Cuando está definido, la presión por pensar nace de forma consistente desde adentro.",
    abierto:
      "Cuando está abierto, tendés a amplificar preguntas y urgencias mentales del entorno.",
  },
  ajna: {
    titulo: "Ajna",
    queEs:
      "Es el centro de conceptualización, opinión y procesamiento mental de patrones e ideas.",
    definido:
      "Definido indica una forma estable de entender y organizar ideas.",
    abierto:
      "Abierto indica flexibilidad mental, pero también tendencia a intentar estar demasiado seguro.",
  },
  garganta: {
    titulo: "Garganta",
    queEs:
      "Es el centro de expresión, visibilidad y manifestación hacia afuera.",
    definido:
      "Definida vuelve consistente tu manera de expresar, nombrar o mover acción.",
    abierto:
      "Abierta hace que tu expresión cambie según el ambiente y la dinámica del momento.",
  },
  g: {
    titulo: "Identidad / G",
    queEs:
      "Es el centro de identidad, amor y dirección vital.",
    definido:
      "Definido da una sensación más estable de quién sos y hacia dónde querés ir.",
    abierto:
      "Abierto te vuelve muy sensible a lugares y vínculos; el entorno correcto es parte de tu dirección.",
  },
  corazon: {
    titulo: "Corazón / Ego",
    queEs:
      "Es el centro de voluntad, promesa, recursos y autoestima ligada al hacer.",
    definido:
      "Definido aporta fuerza de voluntad consistente y capacidad de comprometer energía con claridad.",
    abierto:
      "Abierto puede empujarte a demostrar valor. El aprendizaje es no medir tu valía por productividad o promesas.",
  },
  plexo_solar: {
    titulo: "Plexo Solar",
    queEs:
      "Es el centro de emoción, sensibilidad y ola afectiva.",
    definido:
      "Definido significa que tu emocionalidad tiene un ritmo propio y no conviene decidir en el pico de la ola.",
    abierto:
      "Abierto vuelve muy receptivo a emociones ajenas. La clave es diferenciar qué sentís vos y qué estás amplificando.",
  },
  sacral: {
    titulo: "Sacral",
    queEs:
      "Es el centro de energía vital sostenida, trabajo, deseo y respuesta corporal.",
    definido:
      "Definido aporta combustible constante y una señal corporal muy concreta para responder.",
    abierto:
      "Abierto indica energía variable. Forzarte a sostener ritmos ajenos agota más rápido.",
  },
  bazo: {
    titulo: "Bazo",
    queEs:
      "Es el centro de instinto, salud, percepción inmediata y sentido de lo seguro.",
    definido:
      "Definido da intuición estable y percepción espontánea de lo sano o insano.",
    abierto:
      "Abierto puede hacerte retener por miedo lo que ya no es sano. La conciencia corporal es la llave.",
  },
  raiz: {
    titulo: "Raíz",
    queEs:
      "Es el centro de presión para actuar, resolver y metabolizar estrés.",
    definido:
      "Definida transforma presión en impulso de forma constante y relativamente estable.",
    abierto:
      "Abierta amplifica la presión externa y puede confundirte entre urgencia real y urgencia prestada.",
  },
};

const DESCRIPCIONES_PLANETAS: Record<string, string> = {
  sol: "identidad central y tema dominante",
  tierra: "anclaje, equilibrio y estabilidad",
  luna: "motor emocional e impulso recurrente",
  mercurio: "mensaje y forma de expresar sentido",
  venus: "valores, gusto y límites relacionales",
  marte: "aprendizaje por fricción e inmadurez fértil",
  jupiter: "expansión, confianza y ley interna",
  saturno: "responsabilidad, estructura y madurez",
  urano: "diferenciación, rareza y mutación",
  neptuno: "misterio, inspiración y zonas difusas",
  pluton: "transformación profunda y verdad que no negocia",
};

const DESCRIPCIONES_LINEAS: Record<number, string> = {
  1: "la línea 1 investiga, busca base y necesita sentir suelo antes de abrirse",
  2: "la línea 2 funciona por naturalidad y necesita espacios donde su talento pueda emerger sin presión",
  3: "la línea 3 aprende probando, corrigiendo y descubriendo por experiencia directa",
  4: "la línea 4 expande a través de vínculos, confianza y red",
  5: "la línea 5 proyecta soluciones y carga expectativas del entorno",
  6: "la línea 6 observa, madura por etapas y termina enseñando con el ejemplo",
};

const DESCRIPCIONES_COLOR: Record<number, string> = {
  1: "enfatiza base, foco y necesidad de fundamento",
  2: "subraya dirección, gusto y selección natural",
  3: "mueve a prueba, adaptación y ajuste fino",
  4: "organiza desde red, cercanía y sostén humano",
  5: "activa proyección, impacto y resolución práctica",
  6: "lleva a visión amplia, sensibilidad y perspectiva",
};

const DESCRIPCIONES_LINEA_PERFIL: Record<number, { titulo: string; texto: string }> = {
  1: {
    titulo: "Investigador",
    texto: "Necesita base, contexto y profundidad antes de confiar del todo.",
  },
  2: {
    titulo: "Natural",
    texto: "Su talento aparece mejor sin exceso de exposición o presión externa.",
  },
  3: {
    titulo: "Experimentador",
    texto: "Aprende con ensayo, error y resiliencia aplicada.",
  },
  4: {
    titulo: "Conector",
    texto: "Su influencia crece en redes, vínculos y círculos de confianza.",
  },
  5: {
    titulo: "Pragmático",
    texto: "Recibe proyecciones del entorno y suele ser llamado a resolver.",
  },
  6: {
    titulo: "Modelo de Rol",
    texto: "Ordena experiencia en etapas hasta transformarla en perspectiva viva.",
  },
};

function normalizar(valor: string | null | undefined): string {
  return (valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function normalizarClaveHD(valor: string): string {
  return normalizar(valor);
}

export function nombreCentroHD(clave: string): string {
  const normalizada = normalizar(clave);
  if (normalizada === "corona") return DESCRIPCIONES_CENTROS.cabeza.titulo;
  if (normalizada === "ego") return DESCRIPCIONES_CENTROS.corazon.titulo;
  if (normalizada === "emocional") return DESCRIPCIONES_CENTROS.plexo_solar.titulo;
  if (normalizada === "sacro") return DESCRIPCIONES_CENTROS.sacral.titulo;
  if (normalizada === "esplenico") return DESCRIPCIONES_CENTROS.bazo.titulo;
  return DESCRIPCIONES_CENTROS[normalizada]?.titulo ?? clave;
}

function descriptorTipo(tipo: string): DescriptorBasico {
  const clave = normalizar(tipo);
  if (clave.includes("generadormanifestante")) {
    return DESCRIPCIONES_TIPO["generador manifestante"];
  }
  if (clave.includes("generador")) return DESCRIPCIONES_TIPO.generador;
  if (clave.includes("manifestador")) return DESCRIPCIONES_TIPO.manifestador;
  if (clave.includes("proyector")) return DESCRIPCIONES_TIPO.proyector;
  if (clave.includes("reflector")) return DESCRIPCIONES_TIPO.reflector;
  return {
    titulo: tipo,
    queEs: "Es la mecánica general con la que tu energía entra en relación con la vida.",
    practica: "En tu diseño conviene leer este dato junto a la autoridad y a los centros definidos.",
  };
}

function descriptorAutoridad(autoridad: string): DescriptorBasico {
  const clave = normalizar(autoridad);
  if (clave.includes("emocional") || clave.includes("plexo")) {
    return DESCRIPCIONES_AUTORIDAD.emocional;
  }
  if (clave.includes("sacral")) return DESCRIPCIONES_AUTORIDAD.sacral;
  if (clave.includes("esplen")) return DESCRIPCIONES_AUTORIDAD.esplenica;
  if (clave.includes("ego") || clave.includes("corazon")) {
    return DESCRIPCIONES_AUTORIDAD.ego;
  }
  if (clave.includes("auto") || clave.includes("self")) {
    return DESCRIPCIONES_AUTORIDAD.auto;
  }
  if (clave.includes("lunar")) return DESCRIPCIONES_AUTORIDAD.lunar;
  return {
    titulo: autoridad,
    queEs: "Es el mecanismo interno que conviene priorizar para decidir bien.",
    practica: "Tu claridad mejora cuando esta señal tiene más peso que la prisa mental.",
  };
}

function descriptorDefinicion(definicion: string): DescriptorBasico {
  const clave = normalizar(definicion);
  if (clave.includes("unica")) return DESCRIPCIONES_DEFINICION.unica;
  if (clave.includes("simple")) return DESCRIPCIONES_DEFINICION.simple;
  if (clave.includes("triple")) return DESCRIPCIONES_DEFINICION.triple;
  if (clave.includes("cuadruple")) return DESCRIPCIONES_DEFINICION.cuadruple;
  if (clave.includes("partida") || clave.includes("split")) {
    return DESCRIPCIONES_DEFINICION.partida;
  }
  return {
    titulo: definicion,
    queEs: "Describe cómo se enlazan tus áreas definidas por dentro.",
    practica: "Conviene leerla junto a los centros y canales para entender dónde fluye tu señal.",
  };
}

function descriptorCentro(clave: string) {
  const normalizada = normalizar(clave);
  if (normalizada === "corona") return DESCRIPCIONES_CENTROS.cabeza;
  if (normalizada === "ego") return DESCRIPCIONES_CENTROS.corazon;
  if (normalizada === "emocional") return DESCRIPCIONES_CENTROS.plexo_solar;
  if (normalizada === "sacro") return DESCRIPCIONES_CENTROS.sacral;
  if (normalizada === "esplenico") return DESCRIPCIONES_CENTROS.bazo;
  return DESCRIPCIONES_CENTROS[normalizada];
}

function obtenerLineasPerfil(perfil: string): number[] {
  return perfil
    .split("/")
    .map((parte) => Number(parte.trim()))
    .filter((valor) => Number.isFinite(valor) && valor > 0);
}

export function crearIdCanal(canal: Canal): string {
  return `${canal.puertas[0]}-${canal.puertas[1]}`;
}

export function obtenerCanalesDeCentro(datos: DisenoHumano, claveCentro: string): Canal[] {
  const centroNormalizado = normalizar(claveCentro);

  return (datos.canales ?? []).filter((canal) =>
    canal.centros.some((centro) => normalizar(centro) === centroNormalizado),
  );
}

function resumenCruz(clave: keyof CruzEncarnacion) {
  if (clave === "sol_consciente") return "Muestra el foco que más conscientemente irradiás.";
  if (clave === "tierra_consciente") return "Marca cómo te estabilizás cuando tu expresión está alineada.";
  if (clave === "sol_inconsciente") return "Describe un tono profundo que opera de forma más corporal e instintiva.";
  if (clave === "tierra_inconsciente") return "Indica el sostén menos visible pero muy estructural de tu diseño.";
  return "Es uno de los ejes que organizan tu cruz de encarnación.";
}

export function construirTitularEditorialHD(datos: DisenoHumano): string {
  const tipo = descriptorTipo(datos.tipo).titulo;
  const autoridad = descriptorAutoridad(datos.autoridad).titulo.toLowerCase();

  if (normalizar(tipo).includes("generador")) {
    return "Tu diseño florece cuando respondés antes de acelerar.";
  }
  if (normalizar(tipo).includes("proyector")) {
    return "Tu claridad crece cuando tu mirada es reconocida.";
  }
  if (normalizar(tipo).includes("manifestador")) {
    return "Tu impulso abre camino cuando se comunica con intención.";
  }
  if (normalizar(tipo).includes("reflector")) {
    return "Tu diseño necesita tiempo para leer bien el clima completo.";
  }

  return `Tu brújula principal hoy es la autoridad ${autoridad}.`;
}

export function construirBajadaEditorialHD(datos: DisenoHumano): string {
  const centrosDefinidos = Object.values(datos.centros ?? {}).filter(
    (valor) => valor === "definido",
  ).length;

  return `Leé primero tu ${descriptorAutoridad(datos.autoridad).titulo.toLowerCase()}, después mirá cómo dialogan ${centrosDefinidos} centros definidos y ${(
    datos.canales ?? []
  ).length} canal(es) activos en tu gráfico.`;
}

export function construirDetalleContextualHD(
  seleccion: SeleccionContextualHD,
  datos: DisenoHumano,
): DetalleContextualHD {
  if (seleccion.tipo === "default" || seleccion.tipo === "bodygraph") {
    const centrosDefinidos = Object.values(datos.centros ?? {}).filter(
      (valor) => valor === "definido",
    ).length;

    return {
      sobrelinea: "Cabina de lectura",
      titulo: `${descriptorTipo(datos.tipo).titulo} · ${descriptorAutoridad(datos.autoridad).titulo}`,
      resumen:
        "Leé tu diseño desde adentro hacia afuera: tipo, autoridad, centros, canales y activaciones. El gráfico no es el destino; es el mapa.",
      significadoUsuario: `${descriptorTipo(datos.tipo).practica} En tu caso, la autoridad ${descriptorAutoridad(
        datos.autoridad,
      ).titulo.toLowerCase()} es la llave para interpretar el resto del sistema sin quedarte solo en lo técnico.`,
      claves: [
        `${centrosDefinidos} centro(s) definidos sostienen tu señal más estable.`,
        `${(datos.canales ?? []).length} canal(es) muestran dónde esa energía circula con continuidad.`,
        `El perfil ${datos.perfil} indica cómo vivís tu proceso y cómo te encuentra el entorno.`,
      ],
      tecnico: [
        { etiqueta: "Tipo", valor: datos.tipo },
        { etiqueta: "Autoridad", valor: datos.autoridad },
        { etiqueta: "Perfil", valor: datos.perfil },
        { etiqueta: "Definición", valor: datos.definicion },
      ],
    };
  }

  if (seleccion.tipo === "tipo") {
    const descriptor = descriptorTipo(datos.tipo);
    return {
      sobrelinea: "Mecánica base",
      titulo: descriptor.titulo,
      resumen: descriptor.queEs,
      significadoUsuario: `${descriptor.practica} En tu diseño esto tiene que coordinarse con una autoridad ${datos.autoridad.toLowerCase()} y con el ritmo que marcan tus centros definidos.`,
      claves: [
        `No tomes este dato aislado: se activa de verdad cuando la autoridad acompaña.`,
        `Tu perfil ${datos.perfil} le da estilo relacional a esta mecánica.`,
        `Los canales activos muestran dónde esta energía se vuelve más visible.`,
      ],
      tecnico: [
        { etiqueta: "Tipo", valor: datos.tipo },
        { etiqueta: "Autoridad asociada", valor: datos.autoridad },
        { etiqueta: "Perfil", valor: datos.perfil },
      ],
    };
  }

  if (seleccion.tipo === "autoridad") {
    const descriptor = descriptorAutoridad(datos.autoridad);
    return {
      sobrelinea: "Toma de decisiones",
      titulo: descriptor.titulo,
      resumen: descriptor.queEs,
      significadoUsuario: `${descriptor.practica} Para vos este es el filtro principal antes de interpretar canales, centros o activaciones: si la autoridad no acompaña, el resto se vuelve ruido.`,
      claves: [
        `La autoridad vale más que la urgencia de la mente.`,
        `Tu tipo ${datos.tipo} necesita apoyarse en esta señal para moverse con menos resistencia.`,
        `Cuando dudás, revisá si estás decidiendo desde cuerpo, emoción o presión externa.`,
      ],
      tecnico: [
        { etiqueta: "Autoridad", valor: datos.autoridad },
        { etiqueta: "Tipo", valor: datos.tipo },
        { etiqueta: "Definición", valor: datos.definicion },
      ],
    };
  }

  if (seleccion.tipo === "perfil") {
    const lineas = obtenerLineasPerfil(datos.perfil);
    const lineaConsciente = DESCRIPCIONES_LINEA_PERFIL[lineas[0]];
    const lineaInconsciente = DESCRIPCIONES_LINEA_PERFIL[lineas[1]];

    return {
      sobrelinea: "Estilo de aprendizaje",
      titulo: `Perfil ${datos.perfil}`,
      resumen:
        "El perfil combina dos líneas: la primera describe cómo vivís tu proceso de forma más consciente y la segunda muestra cómo te encuentra el mundo.",
      significadoUsuario: `En vos conviven ${
        lineaConsciente?.titulo.toLowerCase() ?? "una línea consciente"
      } y ${lineaInconsciente?.titulo.toLowerCase() ?? "una línea inconsciente"}. Eso hace que tu diseño no solo tenga una mecánica energética, sino también un estilo particular para aprender, vincularte y ser leído.`,
      claves: [
        lineaConsciente
          ? `Línea ${lineas[0]}: ${lineaConsciente.texto}`
          : "Tu primera línea muestra cómo te vivís por dentro.",
        lineaInconsciente
          ? `Línea ${lineas[1]}: ${lineaInconsciente.texto}`
          : "Tu segunda línea explica cómo suele percibirte el entorno.",
        "Leer el perfil junto al tipo evita convertirlo en una etiqueta rígida.",
      ],
      tecnico: [
        { etiqueta: "Perfil", valor: datos.perfil },
        { etiqueta: "Línea consciente", valor: String(lineas[0] ?? "—") },
        { etiqueta: "Línea inconsciente", valor: String(lineas[1] ?? "—") },
      ],
    };
  }

  if (seleccion.tipo === "definicion") {
    const descriptor = descriptorDefinicion(datos.definicion);
    const centrosDefinidos = Object.values(datos.centros ?? {}).filter(
      (valor) => valor === "definido",
    ).length;

    return {
      sobrelinea: "Arquitectura interna",
      titulo: descriptor.titulo,
      resumen: descriptor.queEs,
      significadoUsuario: `${descriptor.practica} En tu gráfico esto se refleja en ${centrosDefinidos} centro(s) definidos y en cómo tus canales conectan bloques internos de energía.`,
      claves: [
        "La definición habla de integración interna, no de valor personal.",
        "Si hay partes separadas, el vínculo correcto puede ordenar la percepción sin completarte.",
        "Conviene leerla junto a centros y canales, no en abstracto.",
      ],
      tecnico: [
        { etiqueta: "Definición", valor: datos.definicion },
        {
          etiqueta: "Centros definidos",
          valor: String(centrosDefinidos),
        },
        { etiqueta: "Canales activos", valor: String((datos.canales ?? []).length) },
      ],
    };
  }

  if (seleccion.tipo === "centro") {
    const descriptor = descriptorCentro(seleccion.clave);
    const definido = normalizar(seleccion.estado) === "definido";
    const canales = obtenerCanalesDeCentro(datos, seleccion.clave);
    const autoridadTocaCentro =
      (normalizar(datos.autoridad).includes("emocional") &&
        normalizar(seleccion.clave).includes("plexo")) ||
      (normalizar(datos.autoridad).includes("sacral") &&
        normalizar(seleccion.clave).includes("sacral")) ||
      (normalizar(datos.autoridad).includes("esplen") &&
        normalizar(seleccion.clave).includes("bazo"));

    return {
      sobrelinea: "Centro energético",
      titulo: descriptor?.titulo ?? nombreCentroHD(seleccion.clave),
      resumen: descriptor
        ? `${descriptor.queEs} ${definido ? descriptor.definido : descriptor.abierto}`
        : "Un centro muestra una función del diseño y cómo esa energía se estabiliza o se vuelve receptiva.",
      significadoUsuario: definido
        ? `En vos este centro trabaja de manera más constante. ${
            autoridadTocaCentro
              ? "Además, toca directamente tu autoridad, así que conviene escucharlo con prioridad en decisiones."
              : "Eso hace que este tema se note con continuidad en tu forma de vivir."
          }`
        : `En vos este centro funciona como zona abierta: capta, amplifica y aprende por experiencia. ${
            autoridadTocaCentro
              ? "Como además roza tu autoridad, distinguir lo propio de lo ambiental es clave."
              : "La práctica consiste en observar cuándo estás sintiendo algo tuyo y cuándo algo prestado."
          }`,
      claves: [
        definido ? "La consistencia es recurso." : "La apertura es sensibilidad, no carencia.",
        canales.length > 0
          ? `${canales.length} canal(es) activos conectan este centro con el resto del gráfico.`
          : "Sin canales activos, este centro se entiende más por estado que por conexión fija.",
        autoridadTocaCentro
          ? "Este centro participa directamente en tu forma de decidir."
          : "Leelo junto a la autoridad para no sobredimensionar su voz.",
      ],
      tecnico: [
        { etiqueta: "Centro", valor: nombreCentroHD(seleccion.clave) },
        { etiqueta: "Estado", valor: definido ? "Definido" : "Abierto" },
        { etiqueta: "Canales conectados", valor: String(canales.length) },
      ],
    };
  }

  if (seleccion.tipo === "canal") {
    return {
      sobrelinea: "Circuito definido",
      titulo: seleccion.canal.nombre,
      resumen:
        "Un canal une dos centros y muestra por dónde la energía circula con continuidad. Cuando está definido, ese puente se vuelve una firma estable de tu diseño.",
      significadoUsuario: `En tu caso este canal enlaza ${seleccion.canal.centros[0]} y ${seleccion.canal.centros[1]}. Eso hace que el tema de este canal no aparezca como algo ocasional, sino como una cualidad que tiende a repetirse con constancia en tu manera de funcionar.`,
      claves: [
        `Puertas ${seleccion.canal.puertas[0]}–${seleccion.canal.puertas[1]}.`,
        `Conecta ${seleccion.canal.centros[0]} con ${seleccion.canal.centros[1]}.`,
        "Leelo como un tono estable, no como una tarea para forzar.",
      ],
      tecnico: [
        { etiqueta: "Canal", valor: seleccion.canal.nombre },
        {
          etiqueta: "Puertas",
          valor: `${seleccion.canal.puertas[0]}–${seleccion.canal.puertas[1]}`,
        },
        {
          etiqueta: "Centros",
          valor: `${seleccion.canal.centros[0]} · ${seleccion.canal.centros[1]}`,
        },
      ],
    };
  }

  if (seleccion.tipo === "cruz") {
    return {
      sobrelinea: "Propósito estructural",
      titulo: seleccion.etiqueta,
      resumen:
        "La cruz de encarnación reúne cuatro activaciones eje. No describe una misión rígida, sino un patrón recurrente de enfoque, tensión y dirección.",
      significadoUsuario: `${resumenCruz(seleccion.clave)} En tu diseño esta pieza aparece como puerta ${
        seleccion.puerta ?? "—"
      }, así que conviene leerla como parte del tono vital que organiza tu presencia más que como una tarea literal.`,
      claves: [
        "La cruz se entiende mejor como clima de vida que como mandato.",
        "Cada eje toma más sentido cuando se mira junto al tipo y la autoridad.",
        "Las cuatro activaciones trabajan en conjunto; ninguna explica todo sola.",
      ],
      tecnico: [
        { etiqueta: "Eje", valor: seleccion.etiqueta },
        { etiqueta: "Puerta", valor: String(seleccion.puerta ?? "—") },
        { etiqueta: "Perfil", valor: datos.perfil },
      ],
    };
  }

  const planeta = normalizar(seleccion.activacion.planeta);
  const descripcionPlaneta =
    DESCRIPCIONES_PLANETAS[planeta] ?? "un matiz específico de tu diseño";
  const descripcionLinea =
    DESCRIPCIONES_LINEAS[seleccion.activacion.linea] ??
    "la línea agrega un tono particular a la activación";
  const descripcionColor =
    DESCRIPCIONES_COLOR[seleccion.activacion.color] ??
    "el color ajusta el matiz fino con que se expresa la activación";

  return {
    sobrelinea:
      seleccion.origen === "consciente"
        ? "Activación consciente"
        : "Activación inconsciente",
    titulo: `${seleccion.activacion.planeta} · Puerta ${seleccion.activacion.puerta}.${seleccion.activacion.linea}`,
    resumen:
      "Una activación muestra cómo un planeta se imprime en una puerta y línea específicas del diseño. Es una pieza técnica, pero su valor aparece cuando se integra al resto del gráfico.",
    significadoUsuario: `Acá ${seleccion.activacion.planeta} trae el tema de ${descripcionPlaneta} a la puerta ${seleccion.activacion.puerta}. En vos se expresa a través de ${descripcionLinea}. Al vivirla en la capa ${
      seleccion.origen === "consciente" ? "consciente" : "inconsciente"
    }, este matiz puede sentirse ${
      seleccion.origen === "consciente"
        ? "más identificable y narrable"
        : "más corporal, automático o menos verbal"
    }.`,
    claves: [
      `Línea ${seleccion.activacion.linea}: ${descripcionLinea}.`,
      `Color ${seleccion.activacion.color}: ${descripcionColor}.`,
      `Leela junto a tu tipo ${datos.tipo} y tu autoridad ${datos.autoridad} para darle contexto.`,
    ],
    tecnico: [
      { etiqueta: "Planeta", valor: seleccion.activacion.planeta },
      { etiqueta: "Puerta", valor: String(seleccion.activacion.puerta) },
      { etiqueta: "Línea", valor: String(seleccion.activacion.linea) },
      { etiqueta: "Color", valor: String(seleccion.activacion.color) },
      {
        etiqueta: "Capa",
        valor:
          seleccion.origen === "consciente" ? "Consciente" : "Inconsciente",
      },
    ],
  };
}
