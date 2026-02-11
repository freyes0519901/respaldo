# Tipster Portal - Director de Riesgos

Portal de análisis y seguimiento de tipsters deportivos con Inteligencia Artificial.

## 🚀 Características

- ✅ **24+ Tipsters Verificados** - Seguimiento de múltiples tipsters profesionales
- ✅ **Análisis EV+** - Evaluación de Expected Value con IA
- ✅ **Estadísticas Detalladas** - ROI, rachas, porcentaje de aciertos
- ✅ **Recomendaciones IA** - Top tipsters y apuestas seguras del día
- ✅ **Sistema de Suscripción** - 5 días gratis + $15.000 CLP/mes

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Flask, MySQL, JWT
- **IA**: Claude (Anthropic) para análisis de apuestas
- **Hosting**: Vercel (Frontend) + PythonAnywhere (Backend)

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/franciscoanalistadeportivo/tipster-portal.git

# Instalar dependencias
cd tipster-portal
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
```

## 🔒 Seguridad

- Autenticación JWT con refresh tokens
- Passwords hasheados con bcrypt (cost 12)
- Rate limiting contra brute force
- Prepared statements contra SQL injection
- CSP headers contra XSS
- CORS configurado

## 📁 Estructura

```
tipster-portal/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── login/                # Login
│   │   ├── registro/             # Registro
│   │   └── dashboard/            # Panel principal
│   │       ├── page.tsx          # Dashboard home
│   │       ├── tipsters/         # Lista y detalle tipsters
│   │       ├── apuestas/         # Apuestas del día
│   │       └── recomendaciones/  # Recomendaciones IA
│   ├── components/               # Componentes reutilizables
│   └── lib/
│       ├── api.ts               # Cliente API
│       └── store.ts             # Estado global (Zustand)
├── public/                      # Assets estáticos
└── package.json
```

## 🌐 Deploy

El proyecto está configurado para deploy automático en Vercel.

## 📄 Licencia

Propietario - Todos los derechos reservados.
