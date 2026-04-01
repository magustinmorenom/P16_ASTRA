/**
 * Interpretaciones cortas y personales para tooltips de la rueda zodiacal.
 * Cada frase responde a "¿qué significa ESTO para mí?" en 1 línea.
 */

// ── Planeta × Signo → frase personal ──

const SOL: Record<string, string> = {
  Aries: "Tu esencia es puro arranque, liderazgo y coraje.",
  Tauro: "Tu centro es la estabilidad, el disfrute y la constancia.",
  "Géminis": "Tu identidad vive en la curiosidad y la comunicación.",
  "Cáncer": "De acá viene tu sensibilidad, intuición y protección.",
  Leo: "Naciste para brillar, crear y ser visto.",
  Virgo: "Tu propósito pasa por el detalle, el servicio y la mejora.",
  Libra: "Buscás equilibrio, belleza y relaciones justas.",
  Escorpio: "Tu fuerza es la transformación profunda y la intensidad.",
  Sagitario: "Tu esencia es expansión, aventura y búsqueda de sentido.",
  Capricornio: "Tu motor es el logro, la disciplina y construir algo duradero.",
  Acuario: "Viniste a innovar, romper moldes y pensar diferente.",
  Piscis: "Tu naturaleza es la empatía, la imaginación y lo trascendente.",
};

const LUNA: Record<string, string> = {
  Aries: "Emocionalmente necesitás acción y autonomía.",
  Tauro: "Tu zona segura es la calma, la rutina y lo tangible.",
  "Géminis": "Procesás emociones hablando, escribiendo, moviéndote.",
  "Cáncer": "Sentís todo muy profundo — el hogar es tu refugio.",
  Leo: "Necesitás reconocimiento emocional y expresarte con drama.",
  Virgo: "Te tranquiliza el orden, analizar y sentir que controlás.",
  Libra: "Tu bienestar depende de relaciones armoniosas.",
  Escorpio: "Tus emociones son intensas, absolutas y transformadoras.",
  Sagitario: "Te nutre la libertad, la filosofía y los horizontes amplios.",
  Capricornio: "Emocionalmente sos reservado/a y te exigís mucho.",
  Acuario: "Necesitás espacio emocional y procesás desde la razón.",
  Piscis: "Absorbés emociones ajenas — tu sensibilidad no tiene límites.",
};

const MERCURIO: Record<string, string> = {
  Aries: "Pensás rápido, hablás directo, decidís en el momento.",
  Tauro: "Tu mente es metódica — pensás despacio pero con certeza.",
  "Géminis": "Tu cabeza es una máquina de ideas, conexiones y palabras.",
  "Cáncer": "Pensás con el corazón — tu memoria emocional es enorme.",
  Leo: "Comunicás con carisma y convicción, te gusta el escenario.",
  Virgo: "Tu mente es analítica, precisa y orientada al detalle.",
  Libra: "Pensás en pares, comparás opciones, buscás lo justo.",
  Escorpio: "Tu mente va al fondo — investigás, descubrís, no te conformás.",
  Sagitario: "Pensás en grande, en filosofía, en el panorama completo.",
  Capricornio: "Tu mente es estratégica, estructurada y práctica.",
  Acuario: "Pensás fuera de la caja — ideas originales y vanguardistas.",
  Piscis: "Tu pensamiento es intuitivo, visual y a veces difuso.",
};

const VENUS: Record<string, string> = {
  Aries: "Amás con intensidad, conquista y pasión directa.",
  Tauro: "Disfrutás lo sensorial — el placer, la belleza, la calma.",
  "Géminis": "Te enamora la conversación, el ingenio, la novedad.",
  "Cáncer": "Amás cuidando, nutriendo, creando un nido seguro.",
  Leo: "En el amor sos generoso/a, dramático/a y leal.",
  Virgo: "Demostrás amor con actos concretos y atención al detalle.",
  Libra: "El amor es tu terreno — buscás elegancia y reciprocidad.",
  Escorpio: "Amás con todo o nada, con profundidad y posesividad.",
  Sagitario: "Necesitás libertad en el amor y compartir aventuras.",
  Capricornio: "Tu amor es serio, comprometido y a largo plazo.",
  Acuario: "Amás desde la amistad, la libertad y lo no convencional.",
  Piscis: "Tu amor es romántico, idealista y sin fronteras.",
};

const MARTE: Record<string, string> = {
  Aries: "Tu forma de actuar es directa, impulsiva y valiente.",
  Tauro: "Actuás con paciencia, pero cuando arrancás no parás.",
  "Géminis": "Tu energía se dispersa — hacés mil cosas a la vez.",
  "Cáncer": "Tu fuerza se activa cuando protegés lo que amás.",
  Leo: "Actuás con confianza, dramatismo y determinación.",
  Virgo: "Tu acción es precisa, metódica y enfocada en mejorar.",
  Libra: "Preferís negociar antes que pelear — evitás el conflicto.",
  Escorpio: "Tu fuerza es estratégica, implacable y magnética.",
  Sagitario: "Actuás con entusiasmo, fe y apuntando alto.",
  Capricornio: "Tu acción es disciplinada, ambiciosa y persistente.",
  Acuario: "Actuás por causas, ideales y cambio social.",
  Piscis: "Tu energía es sutil — actuás desde la intuición y el sacrificio.",
};

const JUPITER: Record<string, string> = {
  Aries: "Crecés tomando la iniciativa y arriesgándote.",
  Tauro: "La abundancia te llega a través de lo material y estable.",
  "Géminis": "Tu expansión viene del conocimiento y las conexiones.",
  "Cáncer": "Crecés nutriendo, cuidando y confiando en tu intuición.",
  Leo: "La generosidad y la autoexpresión te abren puertas.",
  Virgo: "Crecés perfeccionando, sirviendo y siendo útil.",
  Libra: "Las alianzas y relaciones son tu fuente de expansión.",
  Escorpio: "Crecés a través de crisis y transformaciones profundas.",
  Sagitario: "Tu fe y optimismo natural te llevan lejos.",
  Capricornio: "La disciplina y la paciencia son tu camino al éxito.",
  Acuario: "Crecés innovando y conectando con comunidades.",
  Piscis: "Tu compasión y espiritualidad te expanden el horizonte.",
};

const SATURNO: Record<string, string> = {
  Aries: "Tu lección es aprender a ser paciente antes de actuar.",
  Tauro: "Aprendés a construir seguridad real, no solo material.",
  "Géminis": "Tu desafío es profundizar en vez de saltar entre temas.",
  "Cáncer": "Tu lección es sostener emocionalmente sin cerrarte.",
  Leo: "Aprendés a brillar con humildad y esfuerzo genuino.",
  Virgo: "El perfeccionismo puede ser tu maestro o tu trampa.",
  Libra: "Tu lección pasa por relaciones maduras y compromisos reales.",
  Escorpio: "Aprendés a soltar el control y confiar en el proceso.",
  Sagitario: "Tu desafío es darle estructura a tus grandes ideas.",
  Capricornio: "La responsabilidad es tu zona — pero cuidá de no endurecerte.",
  Acuario: "Tu lección es equilibrar individualidad con pertenencia.",
  Piscis: "Aprendés a poner límites sin perder tu sensibilidad.",
};

const PLANETAS_EXTERIORES: Record<string, Record<string, string>> = {
  Urano: {
    _default: "Marca dónde rompés esquemas y buscás libertad.",
  },
  Neptuno: {
    _default: "Señala tu conexión con lo espiritual y lo imaginario.",
  },
  "Plutón": {
    _default: "Indica dónde vivís transformaciones profundas.",
  },
  "Nodo Norte": {
    _default: "La dirección hacia donde tu alma necesita crecer.",
  },
  "Nodo Sur": {
    _default: "Los talentos que traés — y los patrones que te toca soltar.",
  },
};

const MAPA_PLANETAS: Record<string, Record<string, string>> = {
  Sol: SOL,
  Luna: LUNA,
  Mercurio: MERCURIO,
  Venus: VENUS,
  Marte: MARTE,
  "Júpiter": JUPITER,
  Saturno: SATURNO,
};

/**
 * Devuelve la interpretación personal corta de un planeta en un signo.
 */
export function interpretacionPlaneta(nombre: string, signo: string): string {
  const mapa = MAPA_PLANETAS[nombre];
  if (mapa) return mapa[signo] ?? `${nombre} en ${signo} te da una energía única.`;

  const ext = PLANETAS_EXTERIORES[nombre];
  if (ext) return ext[signo] ?? ext._default ?? `${nombre} marca una influencia generacional.`;

  return `${nombre} influye en tu carta de forma sutil.`;
}

// ── Casas → frase personal ──

export const INTERPRETACION_CASA: Record<number, string> = {
  1: "Cómo te presentás al mundo y la primera impresión que das.",
  2: "Tu relación con el dinero, los recursos y lo que valorás.",
  3: "Cómo pensás, hablás y te conectás con tu entorno.",
  4: "Tus raíces, tu hogar y tu mundo emocional más íntimo.",
  5: "Tu creatividad, lo que te divierte y cómo vivís el romance.",
  6: "Tu rutina diaria, tu salud y cómo servís a los demás.",
  7: "Qué buscás en una pareja y cómo te vinculás en sociedad.",
  8: "Tus procesos de transformación y lo que compartís con otros.",
  9: "Tu filosofía de vida, viajes largos y búsqueda de verdad.",
  10: "Tu vocación, reputación pública y metas de vida.",
  11: "Tus ideales, amistades y los grupos donde encontrás lugar.",
  12: "Tu mundo interior, espiritualidad y lo que no se ve.",
};

// ── Ejes → frase personal ──

export const INTERPRETACION_EJE: Record<string, string> = {
  As: "Tu ascendente — la máscara que el mundo ve primero.",
  Ds: "Tu descendente — lo que buscás en el otro para complementarte.",
  Mc: "Tu medio cielo — hacia dónde apunta tu vocación.",
  Ic: "Tu fondo de cielo — de dónde venís y qué te sostiene.",
};

// ── Signos → frase rápida ──

export const INTERPRETACION_SIGNO: Record<string, string> = {
  Aries: "Impulso, acción, coraje. El que arranca primero.",
  Tauro: "Estabilidad, placer, perseverancia. Lo que perdura.",
  "Géminis": "Curiosidad, comunicación, adaptabilidad. La mente inquieta.",
  "Cáncer": "Sensibilidad, protección, memoria. El corazón del zodíaco.",
  Leo: "Creatividad, brillo, generosidad. El centro del escenario.",
  Virgo: "Análisis, servicio, perfeccionamiento. El ojo del detalle.",
  Libra: "Equilibrio, belleza, justicia. El arte de relacionarse.",
  Escorpio: "Intensidad, transformación, poder. Lo que no se ve.",
  Sagitario: "Expansión, filosofía, aventura. El buscador eterno.",
  Capricornio: "Disciplina, ambición, estructura. El constructor.",
  Acuario: "Innovación, libertad, comunidad. El que piensa distinto.",
  Piscis: "Empatía, imaginación, trascendencia. El soñador del zodíaco.",
};
