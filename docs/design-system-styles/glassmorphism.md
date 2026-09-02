# Glassmorphism

**When to use**: Modern SaaS dashboards, fintech apps, product landing pages wanting a light, airy, premium feel over colorful backgrounds.
**Palette example**: #FFFFFF at 15-25% opacity (frosted panels), #7F5AF0 (violet accent), #2CB67D (mint accent), gradient backdrop #667EEA→#764BA2
**Typography**: Inter (headings) / Inter (body), tight tracking, medium weights
**Visual traits**:
- backdrop-filter: blur(12-20px) on translucent white/dark panels
- Thin 1px semi-transparent borders (rgba white 0.3) for glass edge
- Soft multi-layer drop shadows, sits atop vivid gradient or blurred image background
**Not this if**: Content-heavy or data-dense UIs where blur hurts legibility, or low-end devices where backdrop-filter tanks performance.

For deeper technique detail (exact CSS/animation implementation), web-search for "glassmorphism CSS design" rather than guessing — this file gives direction, not a full spec.
