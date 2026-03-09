# 🚗 Car Rent Booking System

## Requirements
- Node.js >= 20
- Docker
- npm >= 10


## 📌 Overview
ระบบจัดการการจองรถเช่า สำหรับองค์กร
พัฒนาด้วย Next.js App Router + TypeScript + MySQL + Docker

ฟีเจอร์หลัก:
- ระบบจองรถ
- จัดการรถ
- จัดการลูกค้า
- จัดการพนักงาน
- ระบบแจ้งเตือน
- Dashboard รายงาน
- ระบบสิทธิ์ผู้ใช้งาน

---

## Tech Stack / Versions
### Core
- Next.js 16.0.4
- React 19
- TypeScript 5

### Database & Auth
- MySQL
- Drizzle ORM 0.44.7
- Drizzle Kit 0.31.7
- NextAuth 4.24.13
- mysql2 3.15.3

### UI & Styling
- TailwindCSS 4.1.18
- Radix UI
- Lucide React 0.554.0
- Framer Motion 12.34.0
- clsx 2.1.1
- class-variance-authority 0.7.1

### Forms & Validation
- React Hook Form 7.66.1
- Zod 4.1.13

### Charts & Data Visualization
- Chart.js 4.5.1
- react-chartjs-2 5.3.1
- Recharts 3.7.0

### i18n
- i18next 25.7.4
- react-i18next 16.5.1
- next-intl 4.5.7
- i18next-browser-languagedetector 8.2.0
- i18next-http-backend 3.0.2

### Utilities
- date-fns 4.1.0
- uuid 13.0.0
- react-icons 5.5.0
- tailwind-merge 3.4.0
- tailwind-scrollbar-hide 4.0.0

### Dev Dependencies
- ESLint 9
- eslint-config-next 16.0.4
- Jest 30.2.0
- Testing Library
- PostCSS 8.5.6
- Autoprefixer 10.4.23
- tsx 4.21.0

---



## Setup (Development)
```bash
1. clone repo
2. create .env
3. docker compose up -d
4. npm install
5. npm run dev
```

## ENV
copy จาก:
.env.example
แล้วแก้ค่า:
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL

## Scripts
```bash
npm run dev
npm run build
npm start
```

## Database
Database ใช้งานผ่าน Docker
- start database: docker compose up -d
- เปิด phpMyAdmin: http://localhost:8080
- Import database จากไฟล์ SQL (ถ้ามี)

## Project Structure
src/
 ├─ app/
 │   ├─ admin/
 │   ├─ (main)/
 │   ├─ staff/
 │   └─ api/
 ├─ components/
 ├─ lib/
 │   ├─ db/
 │   │   ├─ schema.ts
 │   │   └─ db.ts
 │   ├─ service/
 │   └─ type/
 └─ proxy.ts
docker-compose.yml
.env

## Production
```bash
npm run build
npm start
```

## Contribution
- branch จาก dev
- PR ก่อน merge
- ห้าม push main โดยตรง
