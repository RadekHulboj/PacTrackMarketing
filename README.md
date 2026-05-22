# PacTrack Marketing Website

SEO-optimized marketing landing page for [pactrack.pl](https://pactrack.pl) — the comprehensive parcel tracking system for e-commerce.

## Tech Stack

- **Next.js 14+** — React framework with SSR/SSG for SEO
- **TypeScript** — Type safety
- **TailwindCSS** — Utility-first styling
- **next-intl** — Internationalization (PL/EN)
- **Markdown/MDX** — File-based blog CMS
- **Lucide React** — Icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Localized pages
│   │   ├── page.tsx       # Landing page
│   │   ├── blog/          # Blog listing + posts
│   │   └── layout.tsx     # Locale layout
│   ├── sitemap.ts         # Dynamic sitemap
│   ├── robots.ts          # Robots.txt
│   └── globals.css        # Global styles
├── components/            # UI components
├── i18n/                  # Internationalization config
├── lib/                   # Utilities (blog parser)
└── middleware.ts           # i18n middleware
content/
└── blog/                  # Markdown blog posts
    ├── pl/
    └── en/
messages/
├── pl.json                # Polish translations
└── en.json                # English translations
```

## Adding Blog Posts

Create a new `.md` file in `content/blog/{locale}/`:

```markdown
---
title: "Post Title"
description: "Short description for SEO"
date: "2025-01-15"
author: "Author Name"
category: "Category"
tags: ["tag1", "tag2"]
image: "/images/blog/image.jpg"
---

Your content here...
```

## SEO Features

- Server-Side Rendering (SSR)
- Dynamic sitemap.xml
- robots.txt
- Meta tags + Open Graph + Twitter Cards
- Schema.org structured data (Organization, Website, SoftwareApplication, Article)
- Canonical URLs
- hreflang tags for multi-language
- Core Web Vitals optimized

## Domain Configuration

- `pactrack.pl` → This marketing site
- `app.pactrack.pl` → Main application (Angular + Spring Boot)

## Deployment

On-prem Kubernetes via Helm:

```bash
./docker/k8s_build_and_load_marketing.sh
```

See `docs/KUBERNETES-SETUP.md` for details.
