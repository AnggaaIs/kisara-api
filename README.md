# 🚀 Kisara API

![Kisara API]([https://i.ibb.co.com/wh8PJ6JQ/image.png](https://media-hosting.imagekit.io/a147089a56db4988/screenshot_1743780736862.png?Expires=1838388734&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=p5zzRLUgS~3flVRdth9QFJ8~GJ02s~SHELRAxbrcPkbyUm6UbDd8405~ymz3yvPzF3SUlsEinHy4pwyb2JYZ8URPe70dIhojxLbOG5ENs5CeglK8iyhiNXKklTA-SjnTyNY~V14Et6j0rtjfr8hcgABh5POcczmX-nTuA987O7JaA81pntyAD7hyH4YYSElW63jw55qBiUMCkUHzVrrEf6oLqxKl36W2qntloZnyz0NJ8TFgAkCIsDHtsJFCv0l9-PDexGyeU8frlmINBLv1t9XunEJyJymeLal0Oka5jSqdnSmsfgUYpKm~3bvco9OaOiNn8xdQWIX1J30fQfJGnA__))

## ✨ Apa Itu Kisara API?

Kisara API adalah backend super cepat dan ringan untuk website [kisara.my.id](https://kisara.my.id), dibangun dengan **Fastify** dan **Mikro-ORM**. Dirancang untuk performa tinggi, skalabilitas, dan tentunya kemudahan penggunaan! 🎯

API ini bertujuan untuk memberikan layanan yang efisien dalam menangani data pengguna, autentikasi, serta berbagai fitur lainnya yang mendukung ekosistem Kisara.

## 🔥 Fitur Unggulan

- ⚡ **Fastify** – Framework Node.js yang super cepat!
- 🗃 **Mikro-ORM** – ORM ringan untuk PostgreSQL dengan fitur powerful
- 🔐 **Autentikasi JWT** – Keamanan tinggi dengan token-based authentication
- 📊 **Logging dengan Pino** – Debugging lebih nyaman dengan format log yang jelas
- 📌 **Validasi skema pakai TypeBox** – Data lebih rapi, lebih aman, dan lebih mudah dikelola
- 🌍 **CORS & Rate Limiting** – Hindari abuse API dari luar
- 🚀 **Google OAuth** – Login mudah menggunakan akun Google

## 📥 Instalasi

### 🛠 Clone dulu repository-nya

```sh
git clone https://github.com/AnggaaIs/kisara-api.git
cd kisara-api
```

### 📦 Install dependencies

Kamu bisa pakai package manager favoritmu:

```sh
# Menggunakan pnpm (disarankan)
pnpm install

# Atau gunakan npm
npm install

# Atau gunakan yarn
yarn install
```

### ⚙️ Atur konfigurasi

Buat file `.env` dan isi dengan konfigurasi yang dibutuhkan:

```
# Environment
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=dummy_user
DB_PASSWORD=dummy_password
DB_NAME=dummy_database
DB_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=dummy_google_client_id
GOOGLE_CLIENT_SECRET=dummy_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=dummy_jwt_secret
JWT_EXPIRES_IN=8640000

# CORS
CORS_ORIGIN=http://localhost:3000,https://kisara.my.id,https://www.kisara.my.id
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
```

### 🚀 Jalankan API-nya

#### Mode Pengembangan (Auto-restart kalau ada perubahan)

```sh
pnpm dev  # atau npm run dev / yarn dev
```

#### Mode Produksi (Build & Jalankan)

```sh
pnpm build && pnpm start  # atau npm run build && npm start / yarn build && yarn start
```

## 📂 Struktur Proyek

```
src/
├── config/        # Konfigurasi database & environment
├── entities/      # Definisi tabel/database dengan Mikro-ORM
├── middlewares/   # Middleware untuk auth, error handling, dll.
├── repositories/  # Abstraksi untuk operasi database
├── routes/        # Routing API
├── services/      # Logika bisnis aplikasi
├── controllers/   # Handler request
├── utils/         # Helper utilities
└── index.ts       # Entry point utama
```

## 🤝 Kontribusi

Kami sangat terbuka untuk kontribusi dari komunitas! Jika ingin berkontribusi, silakan buat _pull request_ atau buka _issue_ di repo ini.

## 📜 Lisensi

Proyek ini open-source dan dirilis di bawah lisensi [**MIT**](LICENSE). Silakan gunakan, modifikasi, dan kontribusikan kembali! 🚀
