<p align="center">
  <img src="packages/client/public/logo.png" alt="MarketApp logo" width="200" />
</p>

# MarketApp — Supermarket Deals in One Place

A full-stack monorepo that collects weekly discount products from Turkish supermarket chains (BİM, ŞOK and Migros) and shows them in one web app, an admin panel and a mobile app.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?logo=react&logoColor=black)
![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black)

**Backend API (Render):** https://market-backend-oozv.onrender.com — health check at `/api/system/health`.

> **Status:** working prototype / personal project. The web client, admin panel and API are functional; the mobile app is
> an early version. Product data comes from the chains' public web pages and belongs to them.

## Overview

Supermarket chains publish their weekly "aktüel" deals on separate websites. MarketApp (shown as **MarketFırsat** in the web client) gathers them in one feed so a shopper can browse, search, filter by market and save favourites. Scraper scripts run on a schedule, normalise the products and send them to the API in bulk; admins manage markets and products from a separate panel.

## Features

- **Deals feed** — products from BİM, ŞOK and Migros with market filter, search, favourites and share button.
- **Accounts** — register / login with JWT, password hashing (bcryptjs), password reset flow.
- **Admin panel** — dashboard, market management and product management (create / edit / delete), scrape triggers.
- **Scrapers** — `scripts/scrape-bim.js`, `scrape-sok.js`, `scrape-migros.js` (axios + Cheerio) push data to `/api/products/bulk`, authenticated with a scraper API key.
- **Scheduled updates** — GitHub Actions workflow (`scrape-all.yml`) runs the scrapers four times a day with retries and wakes the free-tier API first.
- **API security** — Helmet, CORS allow-list, global and login rate limits, Zod request validation, admin-only routes, audit logging.
- **Web security headers** — the client's `vercel.json` sets a strict Content-Security-Policy, HSTS, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`.
- **Mobile app** (Expo / React Native) — sign-in screen with a Zustand auth store and a deals list with search and favourites (early version).

## Tech stack

| Part | Tools |
|---|---|
| Web client (`packages/client`) | React 19, TypeScript, Vite, React Router, Axios, Lucide icons |
| Admin panel (`packages/admin`) | React 19, TypeScript, Vite, React Router, Axios |
| API (`packages/server`) | Node.js, Express 5, TypeScript, Mongoose (MongoDB), JWT, bcryptjs, Zod, Helmet, express-rate-limit, node-cron, Cheerio |
| Mobile (`mobile`) | Expo, React Native, React Navigation, Zustand, AsyncStorage |
| Tooling & hosting | pnpm workspaces, GitHub Actions, Vercel (client, admin), Render (API) |

## Project structure

```text
marketapp/
├── packages/
│   ├── client/        # public web app (Vite + React)
│   ├── admin/         # admin panel (Vite + React)
│   └── server/        # Express API
│       └── src/
│           ├── routes/        # auth, markets, products, categories, favorites
│           ├── models/        # User, Market, Product, Category, Favorite
│           ├── middleware/    # auth, validation, audit logger
│           └── services/      # scraper service
├── mobile/            # Expo / React Native app
├── scripts/           # BİM / ŞOK / Migros scrapers used by GitHub Actions
├── .github/workflows/scrape-all.yml
├── scratch/           # development experiments and saved test pages
└── pnpm-workspace.yaml
```

## Getting started

Requires Node.js 20+, pnpm and a MongoDB database.

```bash
git clone https://github.com/CoskunerBerke/marketapp.git
cd marketapp
pnpm install

cp packages/server/.env.example packages/server/.env   # then fill in the values
pnpm dev            # runs server, client and admin in parallel
pnpm build          # builds all packages
```

Run a single part: `pnpm --filter ./packages/server dev` (API, default port 5000), `pnpm --filter ./packages/client dev`, `pnpm --filter ./packages/admin dev`.
Seed the first admin user: `pnpm --filter ./packages/server seed:admin`.
Mobile app: `cd mobile && npm install && npx expo start`.

### Environment variables (names only)

- **API:** `MONGODB_URI`, `PORT`, `JWT_SECRET`, `SCRAPER_API_KEY`, `NODE_ENV`, `CLIENT_ORIGIN`, `ADMIN_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- **Scrapers:** `SCRAPER_API_KEY`

## Deployment

- **Web client and admin:** Vercel (`packages/client/vercel.json`, `packages/admin/vercel.json`, root `vercel.json`).
- **API:** Render (`npm run build`, then `npm start`, which seeds the admin user and starts the server).
- **Data refresh:** GitHub Actions cron workflow in `.github/workflows/scrape-all.yml`.

---

## Türkçe

**MarketApp**, Türkiye'deki market zincirlerinin (BİM, ŞOK ve Migros) haftalık indirimli ürünlerini toplayıp tek bir web uygulamasında, yönetim panelinde ve mobil uygulamada gösteren tam yığın bir monorepo projesidir.

> **Durum:** çalışan prototip / kişisel proje. Web istemcisi, yönetim paneli ve API çalışıyor; mobil uygulama erken aşamada.
> Ürün verileri marketlerin herkese açık web sayfalarından alınır ve onlara aittir.

### Özellikler

- **Fırsat akışı:** BİM, ŞOK ve Migros ürünleri; market filtresi, arama, favoriler ve paylaşma.
- **Hesaplar:** JWT ile kayıt / giriş, şifre hash'leme, şifre sıfırlama akışı.
- **Yönetim paneli:** market ve ürün yönetimi (ekle / düzenle / sil), veri çekme tetikleyicileri.
- **Veri çekiciler:** BİM, ŞOK ve Migros betikleri ürünleri API'ye toplu olarak gönderir.
- **Zamanlanmış güncelleme:** GitHub Actions iş akışı günde dört kez çalışır.
- **Güvenlik:** Helmet, CORS izin listesi, istek sınırlama, Zod doğrulaması, yalnız yöneticiye açık uç noktalar, denetim kaydı ve sıkı güvenlik başlıkları.
- **Mobil uygulama** (Expo / React Native): giriş ekranı, fırsat listesi, arama ve favoriler (erken sürüm).

### Kurulum

Node.js 20+, pnpm ve bir MongoDB veritabanı gerekir.

```bash
git clone https://github.com/CoskunerBerke/marketapp.git
cd marketapp
pnpm install
cp packages/server/.env.example packages/server/.env   # değerleri doldurun
pnpm dev
```

Ortam değişkenlerinin adları yukarıdaki listededir; gerçek değerleri asla commit etmeyin. Web istemcisi ve yönetim paneli Vercel'de, API Render'da çalışacak şekilde yapılandırılmıştır.

---

Built by [Berke Coşkuner](https://github.com/CoskunerBerke)
