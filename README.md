# NUVAYA — Full-Stack Modest Fashion E-Commerce Platform

## 1. Run Backend (Spring Boot 3 + Java 17 + Persistent H2)
cd nuvaya-backend
mvn spring-boot:run
# Runs on http://localhost:8083
# Default Admin Login: admin / Nuvaya@2026!

## 2. Run Frontend (React + Vite)
cd nuvaya-frontend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:5173
