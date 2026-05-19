"use client";

import { useMemo, useState } from "react";

const serviceSlugs = [
  "adp",
  "adyen",
  "amazon-seller",
  "anotes",
  "app-store-connect",
  "apple",
  "apple-maps",
  "apple-music",
  "apple-podcasts",
  "applecare",
  "applovin",
  "argo",
  "arxiv",
  "attio",
  "audible",
  "auth0",
  "aws",
  "azure",
  "backblaze",
  "baseten",
  "bilt",
  "bland",
  "brave-search",
  "brex",
  "browserbase",
  "canva",
  "canvas",
  "capcut",
  "clay",
  "clerk",
  "coderabbit",
  "coinbase",
  "concur",
  "coreweave",
  "craigslist",
  "crusoe",
  "databricks",
  "datadog",
  "decagon",
  "deel",
  "devin",
  "digitalocean",
  "discord",
  "docusign",
  "doordash",
  "doppler",
  "duke-energy",
  "e-trade",
  "ebay-seller",
  "eight-sleep",
  "elevenlabs",
  "ethos",
  "exa",
  "facebook-messenger",
  "fidelity",
  "figma",
  "fireworks",
  "flightradar24",
  "geico",
  "github",
  "gong",
  "goodreads",
  "google",
  "google-analytics",
  "google-classroom",
  "google-flights",
  "google-forms",
  "google-maps",
  "google-play",
  "grafana",
  "granola",
  "greptile",
  "gusto",
  "harvey",
  "hashicorp-vault",
  "hubspot",
  "huggingface",
  "imsg",
  "interactive-brokers",
  "intercom",
  "intuit",
  "jira",
  "joinwarp-payroll",
  "legalzoom",
  "legora",
  "lemonade",
  "lexis",
  "linear",
  "linkedin",
  "listenlabs",
  "lucent",
  "marketo",
  "mediawiki",
  "mercury",
  "metlife",
  "microsoft",
  "mintlify",
  "mixpanel",
  "mobbin",
  "modal",
  "mongoatlas",
  "neon",
  "netlify",
  "nextdoor",
  "nytimes",
  "oci",
  "oculus",
  "okta",
  "oura",
  "patreon",
  "paypal",
  "pinterest",
  "piratebay",
  "planetscale",
  "playstation",
  "postbridge",
  "posthog",
  "prime-music",
  "privy",
  "progressive",
  "proton-mail",
  "qualtrics",
  "quizlet",
  "ramp",
  "reddit",
  "reducto",
  "rentahuman",
  "replit",
  "resend",
  "retool",
  "rippling",
  "robinhood",
  "salesforce",
  "samsara",
  "schwab",
  "sentry",
  "servicenow",
  "shazam",
  "shipstation",
  "shopify",
  "sierra",
  "signal-messaging",
  "silurian",
  "siriusxm",
  "skyscanner",
  "slack",
  "snap",
  "snowflake",
  "sourcegraph",
  "spark",
  "spectrum",
  "spotify",
  "stainless",
  "statefarm",
  "steam",
  "stripe",
  "substack",
  "suno",
  "supabase",
  "surveymonkey",
  "symbolab",
  "telegram",
  "tiktok",
  "togetherai",
  "truemed",
  "tryprofound",
  "turbotax",
  "twilio",
  "uber",
  "uipath",
  "unifygtm",
  "unity-ads",
  "upstash",
  "usaa",
  "vercel",
  "weatherkit",
  "whatsapp",
  "whoop",
  "wikipedia",
  "wolfram",
  "workato",
  "workday",
  "x",
  "xbox",
  "yahoo-finance",
  "youtube",
  "youtube-music",
  "zapier",
];

const serviceNameOverrides: Record<string, string> = {
  adp: "ADP",
  api: "API",
  arxiv: "arXiv",
  aws: "AWS",
  coderabbit: "CodeRabbit",
  coreweave: "CoreWeave",
  digitalocean: "DigitalOcean",
  doordash: "DoorDash",
  "ebay-seller": "eBay Seller",
  elevenlabs: "ElevenLabs",
  exa: "EXA",
  github: "GitHub",
  "hashicorp-vault": "HashiCorp Vault",
  huggingface: "Hugging Face",
  imsg: "iMessage",
  "joinwarp-payroll": "JoinWarp Payroll",
  legalzoom: "LegalZoom",
  listenlabs: "Listen Labs",
  mediawiki: "MediaWiki",
  mongoatlas: "MongoDB Atlas",
  nytimes: "NYTimes",
  oci: "OCI",
  paypal: "PayPal",
  piratebay: "PirateBay",
  planetscale: "PlanetScale",
  playstation: "PlayStation",
  posthog: "PostHog",
  rentahuman: "Rent a Human",
  servicenow: "ServiceNow",
  shipstation: "ShipStation",
  "signal-messaging": "Signal",
  siriusxm: "SiriusXM",
  sourcegraph: "Sourcegraph",
  statefarm: "State Farm",
  surveymonkey: "SurveyMonkey",
  tiktok: "TikTok",
  togetherai: "Together AI",
  truemed: "TrueMed",
  tryprofound: "Profound",
  turbotax: "TurboTax",
  uipath: "UiPath",
  unifygtm: "UnifyGTM",
  usaa: "USAA",
  weatherkit: "WeatherKit",
  whatsapp: "WhatsApp",
  "yahoo-finance": "Yahoo Finance",
  youtube: "YouTube",
  "youtube-music": "YouTube Music",
};

function serviceName(slug: string): string {
  return (
    serviceNameOverrides[slug] ??
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function HeroTerminal({ pixelFont }: { pixelFont: string }) {
  const [portless, setPortless] = useState(true);
  const services = useMemo(
    () => serviceSlugs.map((slug, index) => ({ name: serviceName(slug), port: 4000 + index, slug })),
    [],
  );
  const maxNameLen = useMemo(() => Math.max(...services.map((service) => service.name.length)), [services]);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 shadow-lg dark:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        </div>
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-neutral-500">
          <span className={portless ? "text-emerald-400" : ""}>{portless ? "HTTPS" : "HTTP"}</span>
          <button
            onClick={() => setPortless((p) => !p)}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              portless ? "bg-emerald-500" : "bg-neutral-700"
            }`}
            aria-label="Toggle portless"
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                portless ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
          <a
            href="https://portless.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            portless
          </a>
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto p-5 text-[13px] leading-relaxed text-neutral-400 font-mono">
        <code>
          <span className="text-neutral-500">$</span>{" "}
          <span className="text-neutral-200">npx -p api-emulator api{portless ? " --portless" : ""}</span>
          {"\n\n"}
          <span className={`${pixelFont} text-neutral-200`}>api-emulator</span>
          {" v0.6.0"}
          <span className="text-neutral-500">{"  api-emulator-registry: "}</span>
          <span className="text-emerald-400">{services.length}</span>
          <span className="text-neutral-500">{" services"}</span>
          {"\n\n"}
          {services.map((s) => (
            <span key={s.name}>
              {"  "}
              <span className="text-neutral-500">{s.name.padEnd(maxNameLen + 2)}</span>
              <span className="text-emerald-400">
                {portless ? `https://${s.slug}.api-emulator.localhost` : `http://localhost:${s.port}`}
              </span>
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
