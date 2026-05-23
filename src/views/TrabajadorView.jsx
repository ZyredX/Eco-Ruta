import React, { useEffect, useState, useRef } from 'react';
import { Truck, CheckCircle, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { EcoMap } from '../components/EcoMap';
import { MEDELLIN_COORDS } from '../constants';
import { calculateDistance, COMPLETION_THRESHOLD_METERS } from '../utils';
import { ImageModal } from '../components/ImageModal';

export function TrabajadorView({ user, showToast }) {
  const [pickups, setPickups] = useState([]);
  const [activePickup, setActivePickup] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isMapFull, setIsMapFull] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isMapDark, setIsMapDark] = useState(true);
  const mapRef = useRef(null);

  const [userHeading, setUserHeading] = useState(0);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  useEffect(() => {
    const handleOrientation = (e) => {
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


  useEffect(() => {
    const fetchPickups = async () => {
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .in('material', ['basura', 'escombros', 'biologico'])
        .order('created_at', { ascending: false });
      
      if (!error) setPickups(data);
    };

    fetchPickups();

    const channel = supabase
      .channel('trabajador-channel')
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
        updateData.reciclador_id = user.id; // Puede ser un trabajador o reciclador
      }

      const { error } = await supabase
        .from('reportes')
        .update(updateData)
        .eq('id', pickup.id);
      
      if (error) throw error;
      if (newStatus === 'completado') {
        setActivePickup(null);
        setIsNavigating(false);
        showToast("¡Tarea resuelta con éxito!");
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const filteredPickups = pickups.filter(p => showCompleted || p.estado === 'pendiente');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] relative">
      {/* Lista de Tareas */}
      <div id="step-list" className={`lg:col-span-1 flex flex-col gap-4 overflow-hidden ${isMapFull ? 'hidden lg:flex' : ''}`}>
        <header className="flex justify-between items-end px-2">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Agenda</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Puntos de atención</p>
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
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${showCompleted ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
              >
                {showCompleted ? 'Ocultar completados' : 'Ver completados'}
              </button>
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${showHeatmap ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
              >
                {showHeatmap ? 'Calor' : 'Calor'}
              </button>
            </div>

            <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <span className="text-orange-500 text-[9px] font-black tracking-widest uppercase">
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
              className={`glass-panel p-4 cursor-pointer border-2 transition-all relative overflow-hidden group ${activePickup?.id === pickup.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}`}
            >
              <div className="flex gap-4 relative z-10">
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
                      <ShieldCheck size={32} />
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
                    <h3 className="text-base font-black tracking-tight text-white leading-tight">Punto de Atención</h3>
                    <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={8} /> Medellín, Antioquia
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {pickup.estado === 'pendiente' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(pickup, 'completado'); }}
                        className="btn-eco px-4 py-2 bg-orange-500 text-black rounded-xl hover:bg-orange-400 shadow-lg shadow-orange-500/10"
                      >
                        RESOLVER
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 bg-white/5 border border-white/10 text-[8px] font-black rounded-lg text-green-500 flex items-center gap-1.5">
                        <CheckCircle size={8} /> RESUELTO
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

              {/* Background Glow */}
              <div className={`absolute -right-10 -top-10 w-24 h-24 blur-[50px] opacity-10 rounded-full transition-colors ${activePickup?.id === pickup.id ? 'bg-orange-500' : 'bg-white/5'}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mapa y Detalle */}
      <div id="step-map-view" className={`transition-all duration-500 relative ${isMapFull ? 'fixed inset-0 z-[5000] p-0' : 'lg:col-span-2 glass-panel border-white/5 overflow-hidden h-[70dvh] lg:h-auto min-h-[500px]'}`}>
        <EcoMap 
          ref={mapRef}
          points={filteredPickups} 
          center={activePickup?.ubicacion || userLocation || MEDELLIN_COORDS} 
          zoom={14} 
          userLocation={userLocation}
          userHeading={userHeading}
          showHeatmap={showHeatmap}
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
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                <div className="flex items-center gap-4 md:gap-6">
                  {activePickup.imagen_url && (
                    <img 
                      src={activePickup.imagen_url} 
                      className="w-16 h-16 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-white/10 cursor-zoom-in hover:scale-105 transition-transform" 
                      alt="Evidencia" 
                      onClick={() => setModalImage(activePickup.imagen_url)}
                    />
                  )}
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest text-center md:text-left">
                      {activePickup.items?.length > 1 ? `Punto Múltiple (${activePickup.items.length} reportes)` : 'Atención Requerida'}
                    </p>
                    <h3 className="text-base md:text-xl font-black uppercase text-center md:text-left">
                      {activePickup.items?.length > 1 ? 'Varios Materiales' : `Material: ${activePickup.material}`}
                    </h3>
                    {isNavigating && routeInfo && (
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1 text-center md:text-left">
                        {routeInfo.time} min ({routeInfo.distance} km)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => { 
                      setIsNavigating(false); 
                      setRouteInfo(null); 
                      setActivePickup(null);
                    }}
                    className="px-6 py-3 md:px-8 md:py-4 bg-red-500/10 text-red-500 text-xs md:text-sm font-black rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-xl"
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
                          className={`px-6 py-3 md:px-8 md:py-4 font-black rounded-2xl shadow-xl transition-all ${isNear ? 'bg-orange-500 text-black shadow-orange-500/20 hover:scale-105' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
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
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                        e.preventDefault();
                      }
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
                                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isNear ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20 active:scale-95' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
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
