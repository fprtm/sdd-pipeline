# Neumorphism / Soft UI

**When to use**: Minimal control panels, smart-home apps, wellness/lifestyle apps wanting a tactile, physical, monochrome feel.
**Palette example**: #E0E5EC (base neutral bg), #FFFFFF (light shadow source), #A3B1C6 (dark shadow source), #6E8CFB (rare accent)
**Typography**: Poppins (headings) / Nunito Sans (body)
**Visual traits**:
- Elements same color as background, extruded via dual soft shadows (light top-left, dark bottom-right)
- Very low contrast, near-flat color palette, rounded corners (16-24px)
- Pressed/inset state flips shadow direction for "pushed button" feel
**Not this if**: Accessibility/contrast is critical, or dark-mode-first — neumorphism relies on subtle light-mode shadow gradients that break in dark themes.

For deeper technique detail (exact CSS/animation implementation), web-search for "neumorphism soft UI CSS design" rather than guessing — this file gives direction, not a full spec.
