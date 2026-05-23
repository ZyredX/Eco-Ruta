import React, { useEffect, useState, useRef } from 'react';
import { Truck, CheckCircle, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { EcoMap } from '../components/EcoMap';
import { MEDELLIN_COORDS } from '../constants';
import { calculateDistance, COMPLETION_THRESHOLD_METERS } from '../utils';
import { ImageModal } from '../components/ImageModal';

export function RecicladorView({ user, showToast }) {
  const [pickups, setPickups] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [activePickup, setActivePickup] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isMapFull, setIsMapFull] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isMapDark, setIsMapDark] = useState(true);
  const mapRef = useRef(null);

  const [userHeading, setUserHeading] = useState(0);

  // Rastrear ubicación y orientación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          // Usar heading del GPS si está disponible, sino mantener el actual
          if (pos.coords.heading !== null) {
            setUserHeading(pos.coords.heading);
          }
        },
        (err) => console.error("Error rastreando ubicación:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Manejar orientación del dispositivo (Brújula)
  useEffect(() => {
    const handleOrientation = (e) => {
      // e.webkitCompassHeading es específico de iOS Safari
      const heading = e.webkitCompassHeading || (360 - e.alpha);
      if (heading) setUserHeading(heading);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          showToast("Brújula activada");
        }
      } catch (error) {
        console.error("Error solicitando permiso de orientación:", error);
      }
    }
  };


  // Escuchar reportes en tiempo real desde Supabase
  useEffect(() => {
    const fetchPickups = async () => {
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .in('material', ['carton', 'vidrio', 'plastico'])
        .order('created_at', { ascending: false });
      
      if (!error) setPickups(data);
    };

    fetchPickups();

    const channel = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reportes' }, () => fetchPickups())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (pickup, newStatus) => {
    if (newStatus === 'completado') {
      const dist = calculateDistance(userLocation, pickup.ubicacion);
      if (dist > COMPLETION_THRESHOLD_METERS) {
        showToast(`Estás muy lejos (${Math.round(dist)}m). Debes estar a menos de ${COMPLETION_THRESHOLD_METERS}m.`, 'error');
        return;
      }
    }

    try {
      const updateData = { estado: newStatus };
      if (newStatus === 'completado') {
        updateData.reciclador_id = user.id;
      }

      const { error } = await supabase
        .from('reportes')
        .update(updateData)
        .eq('id', pickup.id);
      
      if (error) throw error;
      if (newStatus === 'completado') {
        setActivePickup(null);
        setIsNavigating(false);
        showToast("¡Reporte completado con éxito!");
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const filteredPickups = pickups.filter(p => showCompleted || p.estado === 'pendiente');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] relative">
      {/* Lista de Reportes Pendientes */}
      <div id="step-list" className={`lg:col-span-1 flex flex-col gap-4 overflow-hidden ${isMapFull ? 'hidden lg:flex' : ''}`}>
        <header className="flex justify-between items-end px-2">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Rutas</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Gestión de puntos</p>
          </div>
          <div id="step-filters" className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button 
                onClick={requestOrientationPermission}
                className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-500 border-blue-500/30 transition-all hover:bg-blue-500 hover:text-white"
                title="Activar Brújula"
              >
                Brújula
              </button>
              <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${showCompleted ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
              >
                {showCompleted ? 'Ocultar completados' : 'Ver completados'}
              </button>
            </div>
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-xl">
              <span className="text-green-500 text-[9px] font-black tracking-widest uppercase">
                {pickups.filter(p => p.estado === 'pendiente').length} PENDIENTES
              </span>
            </div>
          </div>

        </header>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar">
          {filteredPickups.map((pickup) => (
            <motion.div
              key={pickup.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => { setActivePickup(pickup); setIsNavigating(true); }}
              className={`glass-panel p-4 cursor-pointer border-2 transition-all relative overflow-hidden group ${activePickup?.id === pickup.id ? 'border-green-500 bg-green-500/10' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}`}
            >
              <div className="flex gap-4 relative z-10">
                {/* Miniatura de la imagen o Icono */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/5 group-hover:border-white/10 transition-colors">
                  {pickup.imagen_url ? (
                    <img 
                      src={pickup.imagen_url} 
                      alt="Evidencia" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in" 
                      onClick={(e) => { e.stopPropagation(); setModalImage(pickup.imagen_url); }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gradient-to-br from-white/5 to-transparent">
                      <Truck size={32} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${pickup.estado === 'pendiente' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">
                          {pickup.material}
                        </span>
                      </div>
                      <span className="text-[8px] text-white/60 font-black tracking-widest">
                        {new Date(pickup.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white leading-tight">Reporte en Medellín</h3>
                    <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={8} /> Comuna 10 (Candelaria)
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {pickup.estado === 'pendiente' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(pickup, 'completado'); }}
                        className="btn-eco px-4 py-2 bg-green-500 text-black rounded-xl hover:bg-green-400 shadow-lg shadow-green-500/10"
                      >
                        RECOGER
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 bg-white/5 border border-white/10 text-[8px] font-black rounded-lg text-green-500 flex items-center gap-1.5">
                        <CheckCircle size={8} /> RECOGIDO
                      </div>
                    )}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActivePickup(pickup); 
                        setIsMapFull(true);
                        setIsNavigating(true);
                        setRouteInfo(null);
                        if (mapRef.current) {
                          mapRef.current.toggleFullscreen(true);
                          setTimeout(() => {
                            if (mapRef.current) mapRef.current.panToUser();
                          }, 100);
                        }
                      }}
                      className="btn-eco btn-outline px-4 py-2"
                    >
                      VER MAPA
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

        <div id="step-map-view" className="lg:col-span-2 glass-panel border-white/5 overflow-hidden relative transition-all duration-500 h-[70dvh] lg:h-auto min-h-[500px]">
          <EcoMap 
            ref={mapRef}
            points={filteredPickups} 
            center={activePickup?.ubicacion || userLocation || MEDELLIN_COORDS} 
            zoom={14} 
            userLocation={userLocation}
            userHeading={userHeading}
            routeTarget={isNavigating ? activePickup?.ubicacion : null}
            externalFullscreen={isMapFull}
            onFullscreenChange={(v) => setIsMapFull(v)}
            onDarkModeChange={(dark) => setIsMapDark(dark)}
            onRouteFound={(info) => setRouteInfo(info)}
            onMarkerClick={(pickup) => { 
              setActivePickup(pickup); 
              setIsNavigating(true); 
              setRouteInfo(null); 
              if (mapRef.current) {
                setTimeout(() => {
                  if (mapRef.current) mapRef.current.panToUser();
                }, 100);
              }
            }}
          >

            {activePickup && (
              <motion.div 
                initial={{ y: 100 }} 
                animate={{ y: 0 }}
                className="absolute bottom-4 left-4 right-4 p-4 md:p-6 bg-black/75 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col items-center justify-between gap-3 md:gap-6 z-[9999] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 w-full flex-wrap">
                  <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto shrink-0 max-w-full">
                    {activePickup.imagen_url && (
                      <img 
                        src={activePickup.imagen_url} 
                        className="w-16 h-16 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-white/10 cursor-zoom-in hover:scale-105 transition-transform" 
                        alt="Evidencia" 
                        onClick={() => setModalImage(activePickup.imagen_url)}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] md:text-[10px] font-black text-green-500 uppercase tracking-widest text-left">
                        {activePickup.items?.length > 1 ? `Punto Múltiple (${activePickup.items.length} reportes)` : 'Recogida Requerida'}
                      </p>
                      <h3 className="text-sm md:text-xl font-black uppercase text-left truncate">
                        {activePickup.items?.length > 1 ? 'Varios Materiales' : `Material: ${activePickup.material}`}
                      </h3>
                      {isNavigating && routeInfo && (
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1 text-left">
                          {routeInfo.time} min ({routeInfo.distance} km)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                    <button 
                      onClick={() => { 
                        setIsNavigating(false); 
                        setRouteInfo(null); 
                        setActivePickup(null);
                        setIsMapFull(false);
                      }}
                      className="px-4 md:px-8 py-3 md:py-4 bg-red-500/10 text-red-500 text-[10px] md:text-sm font-black rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-xl whitespace-nowrap"
                    >
                      CANCELAR RUTA
                    </button>
                    {(!activePickup.items || activePickup.items.length <= 1) && activePickup.estado === 'pendiente' && (
                      (() => {
                        const dist = userLocation ? calculateDistance(userLocation, activePickup.ubicacion) : 1000;
                        const isNear = dist <= COMPLETION_THRESHOLD_METERS;
                        
                        return (
                          <button 
                            onClick={() => updateStatus(activePickup, 'completado')}
                            className={`px-6 py-3 md:px-8 md:py-4 font-black rounded-2xl shadow-xl transition-all ${isNear ? 'bg-green-500 text-black shadow-green-500/20 hover:scale-105' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                            disabled={!isNear}
                          >
                            {isNear ? 'RECOLECTAR' : `MUY LEJOS (${Math.round(dist)}m)`}
                          </button>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Lista de items en caso de punto múltiple */}
                {activePickup.items?.length > 1 && (
                  <div className="w-full mt-4 border-t border-white/5 pt-4">
                    <div 
                      className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar"
                      ref={(el) => {
                        if (!el) return;
                        el._wheelHandler && el.removeEventListener('wheel', el._wheelHandler);
                        el._wheelHandler = (e) => { if (e.deltaY !== 0) { el.scrollLeft += e.deltaY; e.preventDefault(); } };
                        el.addEventListener('wheel', el._wheelHandler, { passive: false });
                      }}
                    >
                      {activePickup.items.map((item) => {
                        const dist = userLocation ? calculateDistance(userLocation, item.ubicacion) : 1000;
                        const isNear = dist <= COMPLETION_THRESHOLD_METERS;
                        
                        return (
                          <div key={item.id} className="min-w-[240px] p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.material}</span>
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${item.estado === 'pendiente' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${item.estado === 'pendiente' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                                {item.estado}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.imagen_url && (
                                <img 
                                  src={item.imagen_url} 
                                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" 
                                  alt="Min" 
                                  onClick={() => setModalImage(item.imagen_url)}
                                />
                              )}
                              <div className="flex-1">
                                {item.estado === 'pendiente' ? (
                                  <button 
                                    onClick={() => updateStatus(item, 'completado')}
                                    disabled={!isNear}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isNear ? 'bg-green-500 text-black shadow-lg shadow-green-500/20 active:scale-95' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                  >
                                    {isNear ? 'RECOGER' : 'MUY LEJOS'}
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-black text-green-500 uppercase block text-center py-2.5 bg-green-500/10 rounded-xl border border-green-500/20">¡RECOGIDO!</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            <ImageModal 
              isOpen={!!modalImage} 
              imageUrl={modalImage} 
              onClose={() => setModalImage(null)} 
            />
          </EcoMap>
        </div>
    </div>
  );
}
