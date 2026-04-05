# Hallazgo: Discrepancia de Zona Horaria Argentina 1980s

**Fecha:** 2026-04-04
**Severidad:** Alta — afecta precisión del ascendente
**Estado:** Abierto

## Caso de prueba

- **Usuario:** magustin.morenom@gmail.com
- **Nacimiento:** 23 junio 1987, 09:00, Necochea, Argentina
- **Coordenadas:** -38.554549, -58.739262
- **Zona horaria (perfil):** America/Argentina/Buenos_Aires

## Síntoma

El ascendente calculado por CosmicEngine es **Cáncer 11.66°**, pero el ascendente verificado por el usuario (y consistente con Astro.com) es **Géminis ~27°**.

## Causa raíz

Discrepancia entre dos bases de datos de zonas horarias:

| Base de datos | Offset para 23/06/1987 | Ascendente resultante |
|---|---|---|
| **IANA/pytz** (usada por CosmicEngine) | UTC-3 | Cáncer 11.66° |
| **Shanks/Pottenger** (usada por Astro.com) | UTC-2 | Géminis 27.39° |

La base de datos IANA (que alimenta `pytz` y `zoneinfo` de Python) registra UTC-3 para todo 1987 en Argentina sin horario de verano. Sin embargo, la base de datos de Thomas Shanks / Lois Rodden (The International Atlas), utilizada por la mayoría del software astrológico profesional, registra que Argentina observó UTC-2 en ciertos períodos de los años 80.

## Evidencia

```
pytz:     1987-06-23 09:00 → UTC-3 → 12:00 UTC → JD 2446970.0 → Cáncer 11.66°
Shanks:   1987-06-23 09:00 → UTC-2 → 11:00 UTC → JD 2446969.96 → Géminis 27.39°
```

Tabla de ascendentes por hora (Necochea, 23/06/1987):

```
06:00 local → Géminis 2.0°
07:00 local → Géminis 14.3°
08:00 local → Géminis 27.4°   ← con UTC-2, 09:00 local = 08:00 UTC-3
08:30 local → Cáncer 4.3°
09:00 local → Cáncer 11.7°    ← con UTC-3 (lo que calcula CosmicEngine)
10:30 local → Leo 7.1°
```

## Períodos afectados

Argentina tiene una historia de zonas horarias excepcionalmente compleja. Los períodos con mayor riesgo de discrepancia IANA vs Shanks son:

- **1930-1969**: Múltiples cambios de offset y DST
- **1974-1976**: Horarios de verano irregulares
- **1985-1993**: Discrepancias documentadas entre IANA y Shanks

## Impacto

- El ascendente puede diferir en **un signo completo** (30°+) cuando el offset difiere en 1 hora
- Afecta las cúspides de TODAS las casas
- Afecta la ubicación de planetas en casas
- NO afecta posiciones planetarias en signos (esas dependen del JD, no de las casas)
- Afecta principalmente nacimientos en Argentina entre ~1930 y ~1993

## Opciones de mitigación

### Opción A: Usar la base de datos de Shanks (recomendado para astrología)
Incorporar las correcciones de Shanks/ACS para Argentina como overrides sobre pytz. Esto requiere una tabla de excepciones para AR con los offsets correctos por período.

### Opción B: Permitir override manual de offset
Agregar un campo `utc_offset_override` en el perfil que el usuario pueda ajustar manualmente si detecta discrepancias. El sistema usaría este override en vez de pytz cuando esté presente.

### Opción C: Mostrar advertencia
Para nacimientos en Argentina entre 1930-1993, mostrar un disclaimer indicando que el offset puede variar según la fuente de datos y recomendar verificar con Astro.com.

## Referencias

- IANA Time Zone Database: https://www.iana.org/time-zones
- Thomas Shanks, "The International Atlas" (ACS Publications)
- Astro.com Atlas: https://www.astro.com/cgi/aq.cgi?lang=e
- Discusión conocida: https://github.com/eggert/tz/blob/main/southamerica (sección Argentina)
