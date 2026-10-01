# Yousef Al-Salqan

Personal engineering portfolio: [yousefalsalqan.github.io](https://yousefalsalqan.github.io/).

Static HTML, CSS and a small progressive-enhancement script. No runtime dependencies, build step, analytics, API keys or backend. GitHub Pages publishes `main` from the repository root.

## Preview and check

With Python 3 installed:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open http://localhost:4173. For browser checks, install Node.js 22+ and run:

```sh
npm ci
npx playwright install chromium
npm test
```

The check starts and stops its own Python server on port 4174. It verifies five viewport sizes in both themes, contrast, preserved links and sections, images, keyboard interaction, reduced motion, and the no-JavaScript fallback. Screenshots go into ignored `test-results/`.

Content lives in `index.html`, presentation in `styles.css`, and theme/reveal behavior in `script.js`. The theme defaults to the operating system and can be changed for the current visit. Navigation and the WealthGuide case-study disclosure work without JavaScript. No animation library is required.

## Assets and provenance

- `assets/maritime-hero.webp`: AI-generated concept illustration made with OpenAI's image-generation tool on October 1, 2026. It is not a photograph of LOOKOUT equipment. The caption and alternative text identify it as conceptual. The 480px/960px files and favicon are resized derivatives.
- `assets/wealthguide-plan.webp` and `assets/wealthguide-chat.webp`: actual [WealthGuide](https://github.com/YousefAlSalqan/WealthGuide) redesigned interface at commit `db4cdd7`. The plan comes from its latest browser checks; the chat was freshly captured October 1, 2026 using browser-only API fixtures, without paid AI calls or database writes. All figures and messages are synthetic, not customer records or evidence of live AI availability. The 640px plan is a resized derivative. Both screenshots are uncropped and link to full-size images.
- `assets/journey-search.png`, `assets/journey-fleet.png`, and `assets/journey-scene.png`: original LOOKOUT screenshots supplied by Yousef on October 1, 2026, with explicit approval to publish all three as provided, including visible names and the private-view label. The project copy credits ownership of the Journey Log filter suite, not the entire application.
- `assets/fonts/archivo-variable.woff2`: self-hosted Latin subset of [Archivo from Google Fonts](https://github.com/google/fonts/tree/main/ofl/archivo). The original [SIL Open Font License](assets/fonts/OFL.txt) is included.

The maritime illustration used this prompt:

> Use case: stylized-concept. Asset type: developer portfolio hero illustration, landscape 3:2 composition. Create a refined editorial image of a small unmarked research vessel seen directly from above crossing a slate-blue sea. The vessel sits slightly right of center with a distinct narrow white wake tracing a gentle diagonal across the water. Realistic water texture and directional natural light, restrained blue-gray and silver palette, a subtle deep magenta accent on one small part of the vessel to fit the portfolio's existing brand. This illustrates software meeting real maritime hardware; it is conceptual artwork, not a photograph of a real company or its technology. Crisp aerial composition, generous unoccupied water around the vessel, attractive at 600 pixels wide. No people, no logos, no letters, no captions, no UI, no radar rings, no bounding boxes, no fake technical overlays, no neon glow, no decorative borders. Produce one polished standalone image suitable for a professional software engineering portfolio.
