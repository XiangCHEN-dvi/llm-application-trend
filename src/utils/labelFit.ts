/** Fit concept name to band width (SVG viewBox units) */
export function fitBandLabel(
  name: string,
  bandWidth: number,
): {
  fontSize: number;
  textLength?: number;
  lengthAdjust?: "spacingAndGlyphs";
} {
  const padding = 6;
  const available = Math.max(4, bandWidth - padding);
  const maxFs = 11;
  const minFs = 4.5;
  const charWidthEm = 0.56;

  let fontSize = maxFs;
  while (fontSize > minFs && name.length * fontSize * charWidthEm > available) {
    fontSize -= 0.5;
  }

  if (name.length * fontSize * charWidthEm > available) {
    return {
      fontSize: minFs,
      textLength: available,
      lengthAdjust: "spacingAndGlyphs",
    };
  }

  return { fontSize };
}
