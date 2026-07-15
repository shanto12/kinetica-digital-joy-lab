import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`https://kinetica.test${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete KINETICA experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>KINETICA — Digital Joy Lab<\/title>/i);
  assert.match(html, /Good things/);
  assert.match(html, /Don’t just look/);
  assert.match(html, /Motion mode/);
  assert.match(html, /Pick a/);
  assert.match(html, /Pause motion/);
  assert.match(html, /Skip to playground/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships production metadata and bespoke social imagery", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /property="og:title" content="KINETICA — Good things happen in motion"/i);
  assert.match(html, /property="og:image" content="https?:\/\/[^\"]+\/og\.png"/i);
  assert.match(html, /name="twitter:card" content="summary_large_image"/i);
  await access(new URL("../public/og.png", import.meta.url));
});

test("publishes crawl guidance and the canonical production URL", async () => {
  const [robotsResponse, sitemapResponse] = await Promise.all([
    render("/robots.txt"),
    render("/sitemap.xml"),
  ]);

  assert.equal(robotsResponse.status, 200);
  assert.match(
    robotsResponse.headers.get("content-type") ?? "",
    /^text\/plain\b/i,
  );
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent:\s*\*/i);
  assert.match(robots, /Allow:\s*\//i);
  assert.match(
    robots,
    /Sitemap:\s*https:\/\/kinetica-digital-joy-lab\.netlify\.app\/sitemap\.xml/i,
  );

  assert.equal(sitemapResponse.status, 200);
  assert.match(
    sitemapResponse.headers.get("content-type") ?? "",
    /^(?:application|text)\/xml\b/i,
  );
  const sitemap = await sitemapResponse.text();
  assert.match(
    sitemap,
    /<loc>https:\/\/kinetica-digital-joy-lab\.netlify\.app<\/loc>/i,
  );
});

test("keeps the finished source free of starter artifacts and includes release hardening", async () => {
  const [page, layout, css, packageJson, netlify, nextConfig] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../netlify.toml", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(`${page}${layout}${css}${packageJson}`, /_sites-preview|codex-preview|react-loading-skeleton/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(page, /localStorage\.setItem\("kinetica-mood"/);
  assert.match(page, /Drag it or use arrow keys/);
  assert.match(netlify, /npm run build:netlify/);
  assert.match(nextConfig, /Content-Security-Policy/);
  assert.match(nextConfig, /X-Content-Type-Options/);
});
