# ♻️ EcoRuta Inteligente

> **Plataforma de Gestión y Optimización de Rutas de Reciclaje y Reporte de Puntos Críticos.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.104-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.2-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Links

- [Repositorio del Proyecto](https://github.com/Jawuj/EcoRute)
- [Página Web del Proyecto](https://eco-rute.vercel.app)
- [Aplicación Android](https://github.com/Jawuj/EcoRute/releases/tag/v1.0.0-beta)

## Descripción

**EcoRuta Inteligente** es una solución digital diseñada para optimizar la recolección de residuos sólidos y facilitar la interacción entre ciudadanos, recicladores, trabajadores y administradores. La plataforma permite a los usuarios reportar puntos críticos de acumulación de basura, solicitar recolecciones de material reciclable, y gestionar rutas de forma eficiente a través de mapas interactivos.

Esta herramienta busca transformar la gestión ambiental urbana, mejorando los tiempos de respuesta y fomentando una cultura de reciclaje y responsabilidad ciudadana mediante herramientas accesibles y en tiempo real.

---

## Características Principales

### Para Ciudadanos
- **Reporte de Puntos Críticos**: Notifica ubicaciones con acumulación de basura usando geolocalización.
- **Solicitud de Recolección**: Programa recogidas de material reciclable directamente en tu ubicación.
- **Seguimiento**: Monitorea el estado de tus solicitudes (Pendiente, En Progreso, Completado).

### Para Recicladores
- **Visualización de Solicitudes**: Accede a un mapa interactivo con las solicitudes de recolección de los ciudadanos.
- **Gestión de Rutas**: Acepta y actualiza el estado de las recogidas para optimizar el trabajo de recolección.

### Para Trabajadores
- **Gestión de Reportes**: Visualiza y atiende los reportes de puntos críticos generados por los ciudadanos.
- **Actualización de Estado**: Marca los puntos críticos como resueltos una vez se ha realizado la limpieza.

### Para Administradores (Panel Admin)
- **Dashboard Estratégico**: Visualización de métricas de impacto ambiental en tiempo real.
- **Métricas de Impacto**: Cálculo automático de **Kg Recuperados** y **CO2 Mitigado** basado en factores específicos para Medellín.
- **Supervisión Global**: Monitoreo de toda la actividad de la plataforma y gestión de usuarios con **eliminación en cascada segura** para evitar inconsistencias de base de datos.
- **Mapa de Monitoreo**: Visualización geoespacial con filtros interactivos por tipo de material y estado del reporte (Pendientes vs Atendidos), además de mapas de calor prioritarios.

---

## Funcionalidades Avanzadas

### 🗺️ Motor de Mapas Inteligente
- **Navegación Inteligente**: Siguiendo al usuario en tiempo real con rotación basada en brújula y auto-centrado tipo GPS.
- **Cálculo de Rutas Dinámico**: Integración con *Leaflet Routing Machine* para trazar el camino más eficiente.
- **Mapas de Calor Ponderados (Priority Heatmaps)**: Visualización de zonas críticas basada en la peligrosidad del residuo (Biológico > Escombros > Basura).
- **Control de Temas**: Alternancia instantánea entre **Modo Oscuro (Dark Matter)** y **Modo Claro (Voyager Light)** para visibilidad óptima en exteriores.

### ⚡ Experiencia de Usuario Premium
- **Tutoriales Interactivos**: Sistema de *onboarding* guiado para cada rol (Ciudadano, Reciclador, Trabajador, Admin) que enseña las funcionalidades clave paso a paso la primera vez que inician sesión.
- **Sistema de Alertas y Modales Propios**: Alertas de confirmación personalizadas (Glassmorphism) que reemplazan los diálogos nativos del navegador para una experiencia de marca consistente.
- **Diseño Glassmorphic**: Interfaz moderna con efectos de desenfoque y transparencias.
- **Animaciones Fluidas**: Uso de *Framer Motion* para transiciones entre vistas y micro-interacciones.
- **Diseño Responsivo**: Adaptado perfectamente para dispositivos móviles (uso en campo) y escritorio (administración) incluyendo mapas en pantalla completa nativa.
- **Seguridad en Formularios**: Manejo de errores de base de datos amigable para el usuario final sin exponer estructura interna del servidor.

---

## Tecnologías

- **Frontend**: 
  - [React 19](https://reactjs.org/) (Hooks, Componentes Funcionales).
  - [Vite](https://vitejs.dev/) para un desarrollo ultrarrápido.
  - [Tailwind CSS 4](https://tailwindcss.com/) para estilos rápidos, responsivos y modernos.
  - [Framer Motion](https://www.framer.com/motion/) para animaciones fluidas.
  - [Lucide React](https://lucide.dev/) para iconografía.
- **Backend (Supabase)**:
  - **PostgreSQL**: Base de datos relacional poderosa y escalable.
  - **Autenticación**: Gestión de usuarios basada en roles (Ciudadano, Reciclador, Trabajador, Admin).
- **Integraciones**:
  - [Leaflet](https://leafletjs.com/): Motor de mapas interactivos de código abierto.
  - [React Leaflet](https://react-leaflet.js.org/): Abstracción de Leaflet para React.
  - [Leaflet Routing Machine](http://www.liedman.net/leaflet-routing-machine/): Control de rutas y navegación en tiempo real.
  - [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat): Capa de mapas de calor para visualización de densidad.
  - [CartoDB Dark Matter](https://carto.com/help/working-with-data/carto-basemaps/): Tiles de mapas con estética dark premium.

---

## Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Jawuj/EcoRute.git
cd EcoRute
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configuración de Entorno

Crea un proyecto en [Supabase](https://supabase.com/) y obtén tus credenciales. 

Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:

| Variable | Descripción |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL de tu proyecto en Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima (public) de Supabase |

```env
VITE_SUPABASE_URL="TU_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="TU_SUPABASE_ANON_KEY"
```

> [!NOTE]
> Ya no se requiere una API Key de Google Maps, ya que el sistema utiliza **Leaflet** con proveedores de mapas abiertos.

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

---

## Estructura del Proyecto

```text
EcoRute/
├── public/                 # Recursos estáticos (Favicon, Iconos)
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── EcoMap.jsx      # Motor de mapas dinámico (Leaflet)
│   │   ├── ImageModal.jsx  # Visor de imágenes de reportes
│   │   └── ...             # Otros componentes UI
│   ├── views/              # Vistas principales separadas por rol
│   ├── supabase.js         # Cliente y configuración de Supabase
│   ├── utils.js            # Funciones de utilidad (formateo, lógica de negocio)
│   ├── constants.js        # Configuración global y coordenadas
│   ├── App.jsx             # Router y gestión de estado global
│   ├── index.css           # Design System y Tailwind 4
│   └── main.jsx            # Punto de entrada
├── .env                    # Variables de entorno (No incluido en el repo)
└── package.json            # Dependencias y scripts
```

---

## Contribución

¡Las contribuciones son bienvenidas para hacer de nuestra ciudad un lugar más limpio!

1. Haz un **Fork** del proyecto.
2. Crea una **Rama** para tu funcionalidad (`git checkout -b feature/NuevaFuncionalidad`).
3. Realiza un **Commit** de tus cambios (`git commit -m 'Añadir NuevaFuncionalidad'`).
4. Haz **Push** a la rama (`git push origin feature/NuevaFuncionalidad`).
5. Abre un **Pull Request**.

---

## Próximos Pasos (Roadmap)

- [ ] **Mejora del mapa de calor**: Implementar un mapa de calor más preciso y eficiente. (Prioridad Alta)
- [ ] **Aplicación para IOS**: Crear la aplicación para dicho sistema.
- [ ] **IA para Clasificación**: Implementación de modelos para identificar tipos de residuos mediante fotos.
- [ ] **Sistema de Gamificación**: Puntos y recompensas para ciudadanos que reciclan activamente.
- [ ] **Reportes en PDF**: Generación automática de informes mensuales para entidades gubernamentales.
- [ ] **Modo Offline**: Registro de reportes sin conexión para zonas con baja cobertura.
- [ ] **Automatización de Notificaciones**: Implementar notificaciones push para usuarios cuando sus reportes sean atendidos.


---

*EcoRuta Inteligente - Transformando el reciclaje urbano con tecnología avanzada.*
