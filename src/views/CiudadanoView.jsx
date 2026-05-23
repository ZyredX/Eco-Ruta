import React, { useState } from 'react';
import { Camera as CameraIcon, MapPin, Send, Trash2, Box, Wine, CheckCircle, Trash, AlertTriangle, Biohazard, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { EcoMap } from '../components/EcoMap';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

export function CiudadanoView({ user, showToast }) {
  const [material, setMaterial] = useState('');
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 6.2442, lng: -75.5812 });
  const [userLoc, setUserLoc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Cargar cooldown inicial desde localStorage
  React.useEffect(() => {
    const lastReport = localStorage.getItem(`last_report_${user.id}`);
    if (lastReport) {
      const remaining = 60 - Math.floor((Date.now() - parseInt(lastReport)) / 1000);
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  // Manejar el contador del cooldown
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const [userHeading, setUserHeading] = useState(0);

  React.useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(newLoc);
          
          // Solo inicializar location si es la primera vez que recibimos señal
          setLocation(prev => {
            if (prev.lat === 6.2442 && prev.lng === -75.5812) return newLoc;
            return prev;
          });

          if (pos.coords.heading !== null) {
            setUserHeading(pos.coords.heading);
          }
        },
        (err) => console.error("Geolocalización denegada/error:", err),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  React.useEffect(() => {
    const handleOrientation = (e) => {
      const heading = e.webkitCompassHeading || (360 - e.alpha);
      if (heading) setUserHeading(heading);
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);


  const materials = [
    { id: 'carton', name: 'Cartón', icon: Box, color: 'from-orange-400 to-orange-600 shadow-orange-500/20' },
    { id: 'vidrio', name: 'Vidrio', icon: Wine, color: 'from-blue-300 to-blue-500 shadow-blue-400/20' },
    { id: 'plastico', name: 'Plástico', icon: Trash2, color: 'from-yellow-300 to-yellow-500 shadow-yellow-400/20' },
    { id: 'basura', name: 'Basura', icon: Trash, color: 'from-gray-500 to-gray-700 shadow-gray-500/20' },
    { id: 'escombros', name: 'Escombros', icon: AlertTriangle, color: 'from-red-500 to-red-700 shadow-red-500/20' },
    { id: 'biologico', name: 'Biológico', icon: Biohazard, color: 'from-emerald-400 to-emerald-600 shadow-emerald-500/20' },
  ];

  const handlePhotoSelection = async (sourceType) => {
    setShowPhotoMenu(false);
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: sourceType === 'camera' ? CameraSource.Camera : CameraSource.Photos
      });

      if (image) {
        // Convertir base64 a File para reutilizar la lógica de subida
        const response = await fetch(`data:image/${image.format};base64,${image.base64String}`);
        const blob = await response.blob();
        const file = new File([blob], `reporte_${Date.now()}.${image.format}`, { type: `image/${image.format}` });
        setImageFile(file);
      }
    } catch (err) {
      console.warn("Cámara cancelada o error:", err);
    }
  };

  // Función para comprimir imágenes y hacer el reporte más rápido
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!material) return;
    
    setLoading(true);
    let publicUrl = null;

    try {
      // 1. Comprimir y subir imagen si existe
      if (imageFile) {
        setUploading(true);
        const compressedFile = await compressImage(imageFile);
        
        // Sanitizar el nombre del archivo para evitar el error "Invalid key" de Supabase
        const sanitizedName = compressedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fileName = `${Date.now()}_${sanitizedName}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos_reportes')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('fotos_reportes')
          .getPublicUrl(fileName);
        
        publicUrl = url;
      }

      // 2. Guardar reporte en base de datos
      const { error } = await supabase
        .from('reportes')
        .insert([
          { 
            material, 
            ubicacion: location,
            estado: 'pendiente',
            usuario_id: user.id,
            imagen_url: publicUrl 
          }
        ]);

      if (error) throw error;
      
      setReported(true);
      setImageFile(null);
      
      // Activar cooldown de 1 minuto (60 segundos)
      const now = Date.now();
      localStorage.setItem(`last_report_${user.id}`, now.toString());
      setCooldown(60);

      setTimeout(() => setReported(false), 4000);
    } catch (err) {
      console.error("Error completo:", err);
      showToast(err.message || "Error al conectar con Supabase.", 'error');
    } finally {
      setLoading(false);
      setUploading(false);
      setMaterial('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight">Reportar Punto Crítico</h2>
        <p className="text-gray-300 font-medium">Contribuye a una Medellín más limpia y sostenible.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 space-y-8">
          <form onSubmit={handleReport} className="space-y-8">
            <div id="step-materials" className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/80">1. Tipo de Residuo</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterial(m.id)}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all ${material === m.id ? 'border-white bg-white/10 scale-105 shadow-xl' : 'border-white/5 bg-black/20 hover:border-white/10'}`}
                  >
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${m.color} shadow-lg ${material === m.id ? 'scale-110' : 'grayscale opacity-50'}`}>
                      <m.icon size={24} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${material === m.id ? 'text-white' : 'text-white/60'}`}>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div id="step-camera" className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/80">2. Evidencia (Obligatoria)</label>
              <button 
                type="button"
                onClick={() => setShowPhotoMenu(true)}
                className="group relative p-6 border-2 border-dashed border-white/5 rounded-3xl flex items-center gap-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer overflow-hidden w-full"
              >
                <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                  <CameraIcon size={24} className={imageFile ? "text-green-400" : "text-white/70 group-hover:text-blue-400"} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/80 group-hover:text-white block">
                    {imageFile ? "Imagen Seleccionada" : "Tomar Foto o Subir Galería"}
                  </span>
                  {imageFile && (
                    <span className="text-[10px] text-green-400 font-mono truncate block max-w-[200px]">
                      {imageFile.name}
                    </span>
                  )}
                </div>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {reported ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-green-500 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-green-500/40"
                >
                  <CheckCircle size={20} className="text-white" />
                  <span className="font-black text-sm uppercase tracking-widest text-white">¡Enviado!</span>
                </motion.div>
              ) : (
                <button 
                  type="submit" 
                  disabled={!material || !imageFile || loading || uploading || cooldown > 0}
                  className="btn-eco w-full bg-blue-600 hover:bg-blue-500 py-4 shadow-2xl shadow-blue-600/30 text-white disabled:opacity-50"
                >
                  {uploading ? 'Subiendo imagen...' : 
                   loading ? 'Enviando reporte...' : 
                   cooldown > 0 ? `Espera ${cooldown}s para otro reporte` : 
                   'Confirmar Reporte'}
                  {!loading && !uploading && cooldown === 0 && <Send size={18} />}
                </button>
              )}
            </AnimatePresence>
          </form>
        </div>

        <div id="step-map" className="glass-panel p-0 overflow-hidden relative border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Punto de Recogida</h3>
              <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-2">
                <MapPin size={12} className="text-green-500" /> Medellín, Colombia
              </p>
            </div>
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">GPS Activo</span>
            </div>
          </div>
          <div className="flex-1 min-h-[55dvh] lg:min-h-[400px] p-4 lg:p-6">
            <div className="w-full h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <EcoMap 
                points={[{ ubicacion: location, material: material }]} 
                center={location} 
                zoom={15} 
                userLocation={userLoc} 
                userHeading={userHeading}
                userRole="ciudadano"
                onMapClick={(loc) => {
                  // Restringir área a Medellín (Aprox: Lat 6.1 a 6.4, Lng -75.7 a -75.4)
                  if (loc.lat >= 6.1 && loc.lat <= 6.4 && loc.lng >= -75.7 && loc.lng <= -75.4) {
                    setLocation(loc);
                  } else {
                    showToast("Eco Rute solo está disponible en Medellín.", 'info');
                  }
                }} 
              />
            </div>
          </div>
          <div className="p-4 bg-black/40 backdrop-blur-md">
            <p className="text-[10px] text-gray-500 italic text-center font-bold">Haz clic en el mapa para ajustar la ubicación exacta</p>
          </div>
        </div>
      </div>

      <div id="step-impact" className="glass-panel p-8 bg-blue-600/10 border-blue-500/20 flex items-center gap-6">
        <div className="p-4 bg-blue-600 rounded-2xl">
          <Trash2 className="text-white" size={24} />
        </div>
        <div>
          <h3 className="font-black text-lg uppercase tracking-tight">Impacto Ambiental</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-medium">Cada reporte gestionado evita que hasta 2 kg de residuos lleguen al relleno sanitario **La Pradera**.</p>
        </div>
      </div>

      <AnimatePresence>
        {showPhotoMenu && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-panel bg-[#2a1f18] border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowPhotoMenu(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-black text-white text-center mb-6 uppercase tracking-widest">Añadir Foto</h3>
              
              <div className="flex flex-col gap-3">
                {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                  <button 
                    onClick={() => handlePhotoSelection('camera')}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  >
                    <div className="p-3 bg-blue-500/20 group-hover:bg-blue-500 rounded-xl transition-colors">
                      <CameraIcon size={24} className="text-blue-400 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-white uppercase text-sm tracking-widest">Tomar Foto</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">Usar la cámara del dispositivo</p>
                    </div>
                  </button>
                )}
                
                <button 
                  onClick={() => handlePhotoSelection('photos')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <div className="p-3 bg-green-500/20 group-hover:bg-green-500 rounded-xl transition-colors">
                    <ImageIcon size={24} className="text-green-400 group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white uppercase text-sm tracking-widest">Subir de Galería</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Elegir un archivo existente</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

