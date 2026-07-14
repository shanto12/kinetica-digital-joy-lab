# KINETICA — Digital Joy Lab

KINETICA is an interactive, motion-rich editorial playground built with Next.js and React. It combines draggable objects, three motion modes, three tempos, a persistent four-theme mood mixer, global motion controls, reduced-motion support, and a fully responsive art direction.

## Local development

```bash
npm install
npm run dev
```

## Release checks

```bash
npm run verify
```

`npm run build` creates the Cloudflare-compatible Sites build. `npm run build:netlify` creates the native Next.js build used by Netlify.

## Accessibility

- Native links, buttons, radio groups, landmarks, and one logical heading hierarchy
- Keyboard-movable lab objects with visible focus styles
- Global pause/resume control persisted on the device
- Automatic `prefers-reduced-motion` support
- Touch-safe targets and responsive layouts down to 320px
- Polite live status updates for lab actions
