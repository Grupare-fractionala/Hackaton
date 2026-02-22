# Portal Intern Primarie - Frontend

Aplicatie React + Vite pentru suport intern in institutie:
- autentificare angajati
- chat AI intern (tehnic / HR / legislativ)
- escalare automata in tichet daca AI nu poate rezolva
- management tichete
- categorie Documente interne (upload + filtrare pe departament)

## Stack
- React + Vite
- React Router v6 (`createBrowserRouter`)
- Axios + interceptori
- TanStack Query
- Zustand
- Tailwind CSS

## Rulare locala
1. Instaleaza Node.js 20+.
2. Ruleaza:
   - `npm install`
   - `npm run dev`

## Deploy live pe GitHub Pages (frontend 24/7)
1. Urca proiectul pe GitHub in branch-ul `main`.
2. In repo: `Settings -> Pages -> Build and deployment` si selecteaza `GitHub Actions`.
3. Workflow-ul `deploy-pages.yml` va rula automat la fiecare push pe `main`.
4. Link-ul live va fi de forma:
   - `https://<user>.github.io/<repo>/`

Comenzi utile local:
- `npm run build:pages` (genereaza build + fallback `404.html` pentru rute SPA)

## Rulare pe statii cu politici stricte (App Control)
Daca Windows blocheaza Vite/Rollup (mesaj de tip `Application Control policy has blocked this file`), ruleaza prin WSL:

1. Asigura-te ca ai Ubuntu + nvm in WSL si Node 20 (`nvm install 20`).
2. Din PowerShell, in folderul proiectului:
   - `.\run-dev.cmd`
3. Deschide:
   - `http://localhost:5173`

Optiuni utile:
- `.\run-dev.cmd -SkipInstall` (nu mai ruleaza `npm install`)
- `.\run-dev.cmd -Port 5174`

Daca preferi direct scriptul `.ps1`:
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dev.ps1 -SkipInstall`

## Conturi demo (mock)
- `secretara@primarie.local` / `Secretara123!` (angajat)
- `tehnic@primarie.local` / `Tehnic123!` (operator departament Tehnic)
- `hr@primarie.local` / `Hr123456!` (operator departament HR)
- `administrativ@primarie.local` / `AdminDep123!` (operator departament Administrativ)
- `admin@primarie.local` / `Admin123!` (admin global)

## Config
Copiaza `.env.example` in `.env`.

`VITE_USE_MOCK=true` ruleaza complet pe mock local pana e gata backend-ul.

Pentru integrare backend real:
- `VITE_USE_MOCK=false`
- `VITE_API_BASE_URL=https://api-domeniul-tau.ro/api`

## Rutare tichete
- `Tehnic` -> `Departament Tehnic`
- `HR` -> `Departament HR`
- `Legislativ` (si general) -> `Departament Administrativ`

## Documente interne
- pagina: `/documents` (compatibil si cu `/knowledge`)
- upload documente pe departamente: `General`, `Tehnic`, `HR`, `Administrativ`
- filtre dupa departament, categorie si cautare text

## Nota importanta despre backend/chatbox
GitHub Pages hosteaza doar frontend static. Pentru backend/chatbox live 24/7 foloseste separat un serviciu de backend (ex: Render, Railway, Fly.io, VPS), apoi conecteaza frontend-ul prin `VITE_API_BASE_URL`.
