import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Maximize2, Minimize2, Sun, Moon, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet.heat';
import { MEDELLIN_COORDS } from '../constants';
import { IMPACT_FACTORS } from '../utils';

// Corregir íconos por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente para manejar clics en el mapa
function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => {
      if (onClick) onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Componente para el mapa de calor
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    const heatData = points
      .filter(p => p.ubicacion && p.ubicacion.lat && p.ubicacion.lng)
      .map(p => [
        p.ubicacion.lat,
        p.ubicacion.lng,
        IMPACT_FACTORS[p.material]?.weight || IMPACT_FACTORS.default.weight
      ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      gradient: {
        0.2: '#10b981', // Verde (Baja)
        0.6: '#f59e0b', // Naranja (Media)
        1.0: '#ef4444'  // Rojo (Alta)
      }
    }).addTo(map);

    return () => map.removeLayer(heatLayer);
  }, [map, points]);

  return null;
}

// Componente para la ruta (Routing Machine) optimizado
function Routing({ origin, destination, userRole, onRouteFound }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  // Crear el control una sola vez o cuando el mapa cambie
  useEffect(() => {
    if (!map || !origin || !destination) return;

    const routeColor = userRole === 'trabajador' ? '#f97316' : '#10b981';

    const control = L.Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      lineOptions: {
        styles: [{ color: routeColor, weight: 6, opacity: 0.8 }]
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false, // Desactivar para que no pelee con AutoFollow
      show: false,
      createMarker: () => null
    }).addTo(map);

    // Patch de seguridad: Evitar error "removeLayer of null" interno de LRM
    const originalClearLines = control._clearLines;
    if (originalClearLines) {
      control._clearLines = function () {
        if (this._map) {
          originalClearLines.apply(this, arguments);
        }
      };
    }

    control.on('routesfound', (e) => {
      // Verificar si el control sigue en el mapa antes de procesar
      if (!control.getPlan() || !map) return;

      const routes = e.routes;
      if (routes && routes.length > 0) {
        const summary = routes[0].summary;
        if (onRouteFound) {
          onRouteFound({
            time: Math.round(summary.totalTime / 60),
            distance: (summary.totalDistance / 1000).toFixed(1)
          });
        }
      }
    });

    routingControlRef.current = control;

    return () => {
      if (map && control) {
        try {
          // Primero limpiar eventos
          control.off();
          // Quitar del mapa
          map.removeControl(control);
        } catch (e) {
          console.warn("Error al limpiar Routing Control:", e);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, userRole]);

  // Actualizar waypoints por separado para evitar re-crear el control
  useEffect(() => {
    if (routingControlRef.current && origin && destination) {
      try {
        routingControlRef.current.setWaypoints([
          L.latLng(origin.lat, origin.lng),
          L.latLng(destination.lat, destination.lng)
        ]);
      } catch (e) {
        console.warn("Error al actualizar waypoints:", e);
      }
    }
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}


// Función para generar íconos personalizados con SVG
const createCustomIcon = (material, estado, isUser = false, userRole = '', rotation = 0, count = 1) => {
  let color = '#f59e0b'; // Default Orange
  let iconPath = '';
  let size = 32;

  // Color basado en tipo de material si no es el usuario
  if (!isUser) {
    if (estado === 'completado') {
      color = '#10b981'; // Verde para completados
    } else {
      switch (material) {
        case 'carton': color = '#f97316'; break; // Naranja
        case 'vidrio': color = '#3b82f6'; break; // Azul
        case 'plastico': color = '#eab308'; break; // Amarillo
        case 'basura': color = '#6b7280'; break; // Gris
        case 'escombros': color = '#ef4444'; break; // Rojo
        case 'biologico': color = '#10b981'; break; // Verde Esmeralda
        case 'multiple': color = '#8b5cf6'; break; // Violeta para múltiples
        default: color = '#10b981'; // Verde por defecto
      }
    }
  }

  if (isUser) {
    color = userRole === 'reciclador' ? '#10b981' : userRole === 'trabajador' ? '#f97316' : '#3b82f6';
    // Flecha tipo Navegador (Google Maps)
    iconPath = '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>';
    size = 44;
  } else {
    switch (material) {
      case 'multiple':
        iconPath = '<path d="m16 6 4 14H4L8 6l4 4 4-4Z"/><path d="M12 2v4"/>';
        break;
      case 'carton':
        iconPath = '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>';
        break;
      case 'vidrio':
        iconPath = '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>';
        break;
      case 'plastico':
        iconPath = '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>';
        break;
      case 'escombros':
        iconPath = '<path d="M12 2v8"/><path d="m4.93 4.93 5.66 5.66"/><path d="M2 12h8"/><path d="m4.93 19.07 5.66-5.66"/><path d="M12 22v-8"/><path d="m19.07 19.07-5.66-5.66"/><path d="M22 12h-8"/><path d="m19.07 4.93-5.66 5.66"/>';
        break;
      case 'biologico':
        iconPath = '<path d="m12 11.9 5.2 9.1c.3.5.7.8 1.3.9.5.1 1.1-.1 1.5-.4.4-.3.7-.8.8-1.3.1-.5-.1-1.1-.4-1.5l-5.2-9.1c-.2-.4-.6-.7-1.1-.8-.5-.1-1 .1-1.4.4l-5.2 9.1c-.3.5-.4 1-.3 1.5.1.5.4 1 .8 1.3.4.3.9.5 1.4.4.6-.1 1.1-.4 1.4-.9l5.1-9.1c.2-.4.7-.6 1.1-.6.5 0 .9.2 1.2.6"/>';
        break;
      default:
        iconPath = '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>';
        break;
    }
  }

  const svg = `<div style="display: flex; flex-direction: column; align-items: center; transform: rotate(${rotation}deg); transition: transform 0.3s ease; position: relative;">
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${isUser ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5)); ${isUser ? '' : `background: #111827; border-radius: 50%; padding: 6px; border: 3px solid ${color};`}">${iconPath}</svg>
    ${count > 1 ? `<div style="position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; border: 2px solid white; z-index: 100; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);">${count}</div>` : ''}
    ${!isUser ? `<span style="background: ${color}; color: black; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; margin-top: 2px; text-transform: uppercase;">${material === 'multiple' ? 'Múltiples' : material}</span>` : ''}
  </div>`;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-icon',
    iconSize: [size, size + 15],
    iconAnchor: [size / 2, size / 2 + 7],
  });
};


// Componente para auto-centrar el mapa en el usuario
function AutoFollow({ userLocation, active }) {
  const map = useMap();
  useEffect(() => {
    if (active && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 16, { animate: false });
    }
  }, [map, userLocation, active]);
  return null;
}

// Componente para extraer la instancia del mapa de forma segura
function MapController({ onMapLoaded }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapLoaded(map);
  }, [map, onMapLoaded]);
  return null;
}

// Componente para re-centrar el mapa cuando cambian las coordenadas base
function Recenter({ center, disabled }) {
  const map = useMap();
  useEffect(() => {
    if (center && !disabled) {
      map.setView([center.lat, center.lng]);
    }
  }, [center, map, disabled]);
  return null;
}

// Componente para invalidar el tamaño al cambiar a pantalla completa
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    };
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, [map]);
  return null;
}

export const EcoMap = forwardRef(({
  children,
  points = [],
  center = MEDELLIN_COORDS,
  zoom = 13,
  onMapClick,
  onMarkerClick,
  onRouteFound,
  routeTarget = null,
  showHeatmap = false,
  userRole = 'ciudadano',
  userLocation = null,
  userHeading = 0,
  externalFullscreen = undefined,
  onFullscreenChange = null,
  onDarkModeChange = null
}, ref) => {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const onFullscreenChangeRef = useRef(onFullscreenChange);

  useEffect(() => {
    onFullscreenChangeRef.current = onFullscreenChange;
  }, [onFullscreenChange]);

  const toggleFullscreen = (force) => {
    const element = containerRef.current;

    let targetState;
    if (typeof force === 'boolean') {
      targetState = force;
    } else {
      targetState = !document.fullscreenElement && !document.webkitFullscreenElement && !isPseudoFullscreen;
    }

    if (targetState) {
      const requestMethod = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;

      if (requestMethod) {
        requestMethod.call(element).catch(() => {
          setIsPseudoFullscreen(true);
        });
        setIsFullscreen(true);
      } else {
        setIsPseudoFullscreen(true);
      }
      if (onFullscreenChange) onFullscreenChange(true);
    } else {
      const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (exitMethod) exitMethod.call(document);
      }
      setIsFullscreen(false);
      setIsPseudoFullscreen(false);
      if (onFullscreenChange) onFullscreenChange(false);
    }
  };

  useImperativeHandle(ref, () => ({
    toggleFullscreen: (force) => toggleFullscreen(force),
    panToUser: () => {
      if (userLocation && mapInstanceRef.current) {
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: false });
      }
    }
  }));

  useEffect(() => {
    if (externalFullscreen !== undefined) {
      if (externalFullscreen && !isFullscreen && !isPseudoFullscreen) {
        toggleFullscreen(true);
      } else if (!externalFullscreen && (isFullscreen || isPseudoFullscreen)) {
        toggleFullscreen(false);
      }
    }
  }, [externalFullscreen]);

  useEffect(() => {
    const handler = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) setIsPseudoFullscreen(false);
      if (onFullscreenChangeRef.current) onFullscreenChangeRef.current(isFull);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Estilo para pseudo-fullscreen (iOS)
  const pseudoFullscreenStyles = isPseudoFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100dvh',
    zIndex: 9999,
    borderRadius: 0
  } : {};

  return (
    <div
      ref={containerRef}
      style={pseudoFullscreenStyles}
      className={`w-full h-full relative overflow-hidden bg-[#111827] transition-all duration-300 ${isFullscreen || isPseudoFullscreen ? '' : 'rounded-[inherit]'}`}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <MapController onMapLoaded={(map) => { mapInstanceRef.current = map; }} />
        <TileLayer
          url={isDarkMode
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
          keepBuffer={8}
          updateWhenZooming={true}
          updateInterval={100}
        />

        <Recenter center={center} disabled={!!routeTarget} />
        <ResizeMap />
        <MapClickHandler onClick={onMapClick} />

        {/* Auto-seguir al usuario en navegación */}
        <AutoFollow userLocation={userLocation} active={!!routeTarget} />

        {/* Mapa de Calor */}
        {showHeatmap && <HeatmapLayer points={points} />}

        {/* Marcadores de puntos críticos agrupados */}
        {!showHeatmap && (() => {
          const groups = points.reduce((acc, p) => {
            if (!p.ubicacion) return acc;
            const key = `${p.ubicacion.lat.toFixed(4)}|${p.ubicacion.lng.toFixed(4)}`;
            if (!acc[key]) {
              acc[key] = { ...p, items: [p], count: 1, materials: [p.material] };
            } else {
              acc[key].items.push(p);
              acc[key].count++;
              if (!acc[key].materials.includes(p.material)) acc[key].materials.push(p.material);
              // Si algún punto del grupo está pendiente, el grupo entero se muestra como pendiente
              if (p.estado === 'pendiente') acc[key].estado = 'pendiente';
            }
            return acc;
          }, {});

          return Object.values(groups).map((point, idx) => (
            <Marker
              key={idx}
              position={[point.ubicacion.lat, point.ubicacion.lng]}
              icon={createCustomIcon(
                point.count > 1 && point.materials.length > 1 ? 'multiple' : point.material,
                point.estado,
                false,
                '',
                0,
                point.count
              )}
              zIndexOffset={1000 + point.count}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  if (onMarkerClick) onMarkerClick(point);
                },
              }}
            />
          ));
        })()}

        {/* Marcador del Usuario con Rotación */}
        {userLocation && userRole !== 'admin' && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createCustomIcon(null, null, true, userRole, userHeading)}
          />
        )}

        {/* Ruta en tiempo real (Modo Uber) */}
        {routeTarget && userLocation && (
          <Routing
            origin={userLocation}
            destination={routeTarget}
            userRole={userRole}
            onRouteFound={onRouteFound}
          />
        )}
      </MapContainer>

      {/* Renderizar contenido adicional (paneles de info) dentro del contenedor fullscreen */}
      {children}

      {/* Controles del Mapa */}
      <div id="step-map-controls" className="absolute top-4 left-4 z-[9999] flex flex-col gap-4">
        {/* Botón de Pantalla Completa (Real API) */}
        <button
          onClick={toggleFullscreen}
          className="p-4 bg-black/60 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl hover:scale-110 transition-all group"
          title="Pantalla Completa"
        >
          {isFullscreen || isPseudoFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {(isFullscreen || isPseudoFullscreen) ? 'Salir Fullscreen' : 'Pantalla Completa'}
          </span>
        </button>

        {/* Botón de Modo Claro/Oscuro */}
        <button
          onClick={() => { const next = !isDarkMode; setIsDarkMode(next); if (onDarkModeChange) onDarkModeChange(next); }}
          className="p-4 bg-black/60 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl hover:scale-110 transition-all group"
          title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>
        {/* Botón de Ir a Mi Ubicación */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (userLocation && mapInstanceRef.current) {
              mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
            }
          }}
          className="p-4 bg-black/60 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl hover:scale-110 transition-all group"
          title="Ir a mi ubicación"
        >
          <Navigation size={24} className="text-blue-400" />
          <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Mi Ubicación
          </span>
        </button>
      </div>
    </div>
  );
});

