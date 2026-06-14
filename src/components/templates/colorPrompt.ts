export function buildColorPalettePrompt(colors: string[], fallbackLabel = 'Selected color palette'): string {
  const palette = colors.filter(color => typeof color === 'string' && color.trim())

  if (palette.length === 0) return ''

  const primary = palette[0]
  const secondary = palette[1] || primary
  const accent = palette[2] || primary

  return ` COLOR PALETTE REQUIREMENT: Use exactly this ${fallbackLabel}: ${palette.join(', ')}. Apply ${primary} as the dominant color/background (60%), ${secondary} as the secondary color (30%), and ${accent} as the accent/highlight color (10%) using the 60/30/10 design rule. Do NOT substitute another palette. Use these exact colors for headers, backgrounds, borders, icons, text accents, buttons, cards, and agent branding.`
}
