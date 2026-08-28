// ─── DermaScanAI Design System ─────────────────────────────────────────────
// Base theme: Light Mint  +  multi-colour feature accents
// All screens import from this single source of truth.

export const colors = {
  // ── Primary Mint Palette ────────────────────────────────────────────────
  primary: {
    mint:          "#4ECBA0",   // main light-mint brand colour
    darkMint:      "#2E9D72",   // deeper mint for buttons / headers
    midMint:       "#3DB48A",   // mid-tone for gradients
    lightMint:     "#B2EACF",   // ultra-light mint for tinted surfaces
    paleMint:      "#E8F8F2",   // near-white mint for backgrounds
    softMint:      "#D4F2E6",   // card tint / hover fill
  },

  // ── Background Gradients (used across all screens) ──────────────────────
  gradient: {
    pageTop:      "#F0FBF6",   // very light mint-white page start
    pageBottom:   "#C9EBD8",   // soft mint page end
    headerStart:  "#3DB48A",   // header gradient start
    headerEnd:    "#2E9D72",   // header gradient end
    buttonStart:  "#4ECBA0",   // CTA button gradient start
    buttonEnd:    "#2E9D72",   // CTA button gradient end
    cardStart:    "#F0FBF6",   // card inner gradient start
    cardEnd:      "#DDF5EB",   // card inner gradient end
  },

  // ── Feature Accent Colours ───────────────────────────────────────────────
  // Each feature keeps its own personality while staying on-palette.
  accent: {
    // Skin Analysis — teal
    teal:         "#00B4A6",
    tealLight:    "#E0F5F4",
    tealDark:     "#007B72",
    // Chatbot — soft violet
    violet:       "#7C5CBF",
    violetLight:  "#EDE7F6",
    violetDark:   "#512DA8",
    // Routine Scheduler — warm amber
    amber:        "#F59E0B",
    amberLight:   "#FEF3C7",
    amberDark:    "#B45309",
    // Product Scanner — sky blue
    sky:          "#0EA5E9",
    skyLight:     "#E0F2FE",
    skyDark:      "#0369A1",
    // Skin Quiz — rose
    rose:         "#F43F5E",
    roseLight:    "#FFE4E6",
    roseDark:     "#BE123C",
    // Weather — ocean blue
    ocean:        "#2563EB",
    oceanLight:   "#DBEAFE",
    oceanDark:    "#1D4ED8",
    // Disease Result — coral
    coral:        "#EF6C47",
    coralLight:   "#FDE8E0",
    coralDark:    "#C0441F",
  },

  // ── Disease / Result Palette ─────────────────────────────────────────────
  disease: {
    darkTeal:       "#0A7A6A",
    tealAccent:     "#4ECBA0",
    darkGreen:      "#0D5A47",
    lightGreen:     "#2C7A52",
    lightBg:        "#F0FBF6",
    lightCardBg:    "#DDF5EB",
    cardGradientEnd:"#B2EACF",
    alertBg:        "#FFF7ED",
    alertBorder:    "#F59E0B",
  },

  // ── Neutral / UI Chrome ──────────────────────────────────────────────────
  neutral: {
    white:       "#FFFFFF",
    offWhite:    "#F8FDFB",   // warm mint-tinted off-white
    lightGray:   "#E8F5EE",
    mediumGray:  "#64748B",
    darkGray:    "#1E293B",
    border:      "#CBD5E1",
    placeholder: "#94A3B8",
    text:        "#1E293B",
    subtext:     "#475569",
  },

  // ── Status / Feedback ────────────────────────────────────────────────────
  status: {
    success: "#22C55E",
    error:   "#EF4444",
    warning: "#F59E0B",
    info:    "#0EA5E9",
  },
  feedback: {
    error:   "#EF4444",
    warning: "#F59E0B",
    success: "#22C55E",
  },

  // ── Overlay / Shadow ─────────────────────────────────────────────────────
  overlay: {
    dark:       "rgba(15, 40, 28, 0.65)",
    light:      "rgba(78, 203, 160, 0.12)",
    cardShadow: "rgba(46, 157, 114, 0.15)",
    black:      "rgba(0, 0, 0, 0.08)",
  },
}

// Typography
export const typography = {
  sizes: {
    title: 22,
    heading: 20,
    large: 16,
    default: 14,
    small: 13,
    tiny: 12,
  },
  weights: {
    bold: "bold" as const,
    semibold: "600" as const,
    normal: "normal" as const,
  },
}

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 15,
  xl: 20,
  xxl: 25,
  xxxl: 30,
}

// Border Radius
export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 20,
  xl: 20,
  full: 21,
}

// Shadow
export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#2E9D72",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  card: {
    shadowColor: "#2E9D72",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
}

