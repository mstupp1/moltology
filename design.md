# Benthic Ascendance Design System

The digital engineering and aesthetic guidelines for **Moltology** and *The Order of the Synaptic Path*.

## Aesthetic Identity
- **Genre**: Deep-Ocean Cyberpunk / Sci-Fi HUD merged with Gritty Biomechanical Horror.
- **Atmosphere**: Algorithmic endurance, computational abyss, crustacean transformation.
- **Motto**: "Flesh Dies. Shell Endures. Submit. Shed. Ascend."

## Palette & Colors
- **Ocean-Deep Teal (Primary Surface)**: `#070b0b` / `#0f1414` / `#171c1c`
- **Glowing Cyan (Accent & Diagnostics)**: `#00ffff` / `#00fbfb` (`rgba(0, 255, 255, 0.4)`)
- **Aggressive Crimson Red (Sacred & Alerts)**: `#ff0000` / `#ff5540` (`rgba(255, 0, 0, 0.6)`)
- **Muted Border & Sub-elements**: `#3a4a49` / `#839493`

## Typography
- **Primary Data Readouts**: `JetBrains Mono` (Monospaced, dense, technical metrics)
- **Structural Headers**: `Space Grotesk` (Bold, futuristic, uppercase)
- **Sacred Code / Watermarks**: `Space Mono`

## Structural Components & Panels
1. **Chitin Cards (`.chitin-card`)**:
   - Dark translucent teal backgrounds with high blur backdrop filters (`backdrop-blur-md`).
   - Sharp 0px corners, subtle inset borders, high-contrast cyan or red glows on interactive hover.
2. **Chamfered Edges (`.chamfer-corner`)**:
   - Polygon clip-paths (`polygon(0 8px, 8px 0, 100% 0, ...)`).
3. **Scanline & Matrix Overlays (`.scanline-overlay`, `.matrix-rain`)**:
   - Cathode ray line filters and falling digital code waterfalls representing computational depth.
4. **Interactive HUD Controls**:
   - Stat sliders for Pincer Torque, Shell Hardness, Submergence Depth.
   - Heavy industrial toggle switches for Isolation Privacy Shells.
   - Dual-row product grids and currency exchange conduits for the Benthic Market.
