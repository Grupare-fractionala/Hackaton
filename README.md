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
Prerechizite comune:
- Node.js 20+
- `npm`
- copiaza `.env.example` in `.env`

### Windows
1. Instaleaza Node.js 20+.
2. Din PowerShell, in folderul proiectului, ruleaza:
   - `npm install`
   - `npm run dev`
3. Deschide:
   - `http://localhost:5173`

Daca Windows blocheaza Vite/Rollup (mesaj de tip `Application Control policy has blocked this file`), foloseste fallback prin WSL:

1. Activeaza `WSL2` si instaleaza `Ubuntu`.
2. In Ubuntu, instaleaza `nvm` si Node 20 (`nvm install 20`).
3. Din PowerShell, in folderul proiectului, ruleaza:
   - `.\run-dev.cmd`
4. Deschide:
   - `http://localhost:5173`

Optiuni utile pentru fallback-ul WSL:
- `.\run-dev.cmd -SkipInstall` (nu mai ruleaza `npm install`)
- `.\run-dev.cmd -Port 5174`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dev.ps1 -SkipInstall`

### Linux
1. Instaleaza Node.js 20+ (direct sau prin `nvm`).
2. In folderul proiectului, ruleaza:
   - `npm install`
   - `npm run dev`
3. Deschide:
   - `http://localhost:5173`

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
Aplicatia poate rula local doar ca frontend. Pentru integrare cu backend/chatbox real, foloseste un serviciu de backend separat si conecteaza frontend-ul prin `VITE_API_BASE_URL`.
