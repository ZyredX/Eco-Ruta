import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, HelpCircle } from 'lucide-react';

const steps = {
  ciudadano: [
    {
      target: 'step-materials',
      title: 'Tipo de Residuo',
      content: 'Primero, selecciona el tipo de material que quieres reportar. Cada uno tiene un impacto diferente.',
      icon: Sparkles
    },
    {
      target: 'step-camera',
      title: 'Evidencia Visual',
      content: 'Toma una foto en tiempo real o sube una de tu galería. ¡Es obligatorio para validar el reporte!',
      icon: Sparkles
    },
    {
      target: 'step-map',
      title: 'Ubicación Precisa',
      content: 'Haz clic en el mapa para marcar el punto exacto. El GPS te ayudará a situarte. (Puedes no tocar nada y dejar tu ubicación detectada por la página, de todos modos te recomendamos verificarla). ',
      icon: Sparkles
    },
    {
      target: 'step-impact',
      title: 'Tu Huella Ecológica',
      content: 'Aquí verás el impacto positivo que generas al gestionar tus residuos correctamente.',
      icon: Sparkles
    },
    {
      target: 'step-help-btn',
      title: '¡Listo! 🎉',
      content: 'Ya conoces EcoRuta. Si en algún momento quieres ver el tutorial de nuevo, presiona este botón azul.',
      icon: HelpCircle
    }
  ],
  reciclador: [
    {
      target: 'step-map-view',
      title: 'Mapa de Calor',
      content: 'Aquí verás todos los reportes cercanos. Los puntos rojos indican basura, los naranjas reciclables.',
      icon: Sparkles
    },
    {
      target: 'step-list',
      title: 'Tu Hoja de Ruta',
      content: 'Gestiona tus recogidas desde aquí. Haz clic en "VER MAPA" para iniciar la navegación.',
      icon: Sparkles
    },
    {
      target: 'step-filters',
      title: 'Filtros Inteligentes',
      content: 'Activa la brújula para orientarte mejor o filtra por puntos ya completados.',
      icon: Sparkles
    },
    {
      target: 'step-map-controls',
      title: 'Visualización',
      content: 'Cambia entre modo día/noche, usa la pantalla completa para navegar con comodidad o presiona la flecha para ubicarte en el mapa. ',
      icon: Sparkles
    },
    {
      target: 'step-help-btn',
      title: '¡Listo! 🎉',
      content: 'Ya conoces EcoRuta. Si necesitas ver el tutorial de nuevo, presiona este botón azul en cualquier momento.',
      icon: HelpCircle
    }
  ],
  trabajador: [
    {
      target: 'step-map-view',
      title: 'Mapa de Puntos',
      content: 'Aquí verás todos los puntos de atención pendientes en la ciudad.',
      icon: Sparkles
    },
    {
      target: 'step-list',
      title: 'Tu Agenda de Trabajo',
      content: 'Gestiona tus tareas desde aquí. Haz clic en "VER MAPA" para iniciar la navegación a la zona.',
      icon: Sparkles
    },
    {
      target: 'step-filters',
      title: 'Orientación',
      content: 'Activa la brújula para orientarte mejor o filtra por puntos ya completados.',
      icon: Sparkles
    },
    {
      target: 'step-map-controls',
      title: 'Controles de Mapa',
      content: 'Cambia entre modo día/noche o usa la pantalla completa para trabajar con mayor comodidad.',
      icon: Sparkles
    },
    {
      target: 'step-help-btn',
      title: '¡Listo! 🎉',
      content: 'Ya conoces EcoRuta. Si necesitas ver el tutorial de nuevo, presiona este botón azul en cualquier momento.',
      icon: HelpCircle
    }
  ],
  admin: [
    {
      target: 'step-admin-nav',
      title: 'Panel de Navegación',
      content: 'Usa estas pestañas para alternar entre el Dashboard principal, el Ranking, la gestión de Usuarios y la tabla detallada de Reportes.',
      icon: Sparkles
    },
    {
      target: 'step-admin-stats',
      title: 'Métricas Generales',
      content: 'Aquí tienes un resumen del impacto global: usuarios, kilos recuperados y huella de carbono mitigada.',
      icon: Sparkles
    },
    {
      target: 'step-admin-map',
      title: 'Monitor Geoespacial',
      content: 'Visualiza todos los reportes en tiempo real. Puedes usar el modo pantalla completa para mayor comodidad.',
      icon: Sparkles
    },
    {
      target: 'step-admin-filters',
      title: 'Filtros de Mapa',
      content: 'Filtra los reportes por tipo de material o por estado (Pendientes vs Atendidos), y activa el Mapa de Calor para ver zonas críticas.',
      icon: Sparkles
    },
    {
      target: 'step-help-btn',
      title: '¡Listo! 🎉',
      content: 'Ya conoces EcoRuta. Si necesitas ver el tutorial de nuevo, presiona este botón azul en cualquier momento.',
      icon: HelpCircle
    }
  ]
};

export function TutorialOverlay({ role, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightCoords, setSpotlightCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const currentRoleSteps = steps[role] || [];

  useEffect(() => {
    // Verificar si ya vio el tutorial
    const hasSeen = localStorage.getItem(`has_seen_tutorial_${role}`);
    if (!hasSeen && currentRoleSteps.length > 0) {
      setTimeout(() => setIsVisible(true), 1500); // Dar tiempo a que cargue la UI
    }
  }, [role]);

  useEffect(() => {
    if (isVisible && currentRoleSteps[currentStep]) {
      const updateSpotlight = () => {
        const element = document.getElementById(currentRoleSteps[currentStep].target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setSpotlightCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
          // Scroll suave hacia el elemento si no es visible
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      // Pequeño delay para asegurar que el layout se ha asentado (especialmente en móviles)
      const timeoutId = setTimeout(updateSpotlight, 100);

      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight); // También al hacer scroll
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight);
      };
    }
  }, [currentStep, isVisible, role]);

  const handleNext = () => {
    if (currentStep < currentRoleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTutorial = () => {
    setIsVisible(false);
    localStorage.setItem(`has_seen_tutorial_${role}`, 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible || currentRoleSteps.length === 0) return null;

  const currentStepData = currentRoleSteps[currentStep];

  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-hidden pointer-events-none">
      {/* Spotlight redondeado con box-shadow */}
      <motion.div
        className="absolute rounded-[1.5rem] pointer-events-none"
        animate={{
          top: spotlightCoords.top,
          left: spotlightCoords.left,
          width: spotlightCoords.width,
          height: spotlightCoords.height,
        }}
        style={{
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      />

      {/* Tooltip interactivo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed pointer-events-auto"
          style={(() => {
            const PAD = 12;
            const CARD_W = Math.min(320, window.innerWidth - PAD * 2);
            const CARD_H = 280; // estimate, enough headroom
            const spBottom = spotlightCoords.top + spotlightCoords.height;
            const spaceBelow = window.innerHeight - spBottom;
            const top = spaceBelow >= CARD_H + PAD
              ? spBottom + PAD
              : Math.max(PAD, spotlightCoords.top - CARD_H - PAD);
            const rawLeft = spotlightCoords.left + spotlightCoords.width / 2 - CARD_W / 2;
            const left = Math.min(Math.max(PAD, rawLeft), window.innerWidth - CARD_W - PAD);
            return { top, left, width: CARD_W };
          })()}
        >
          <div className="glass-panel p-6 bg-blue-600 border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />

            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <currentStepData.icon size={20} className="text-white" />
              </div>
              <button
                onClick={finishTutorial}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">
              {currentStepData.title}
            </h4>
            <p className="text-xs text-white/80 leading-relaxed font-medium mb-6">
              {currentStepData.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex gap-1">
                {currentRoleSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-4 bg-white' : 'w-1 bg-white/30'}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                >
                  {currentStep === currentRoleSteps.length - 1 ? 'ENTENDIDO' : 'SIGUIENTE'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Botón de Ayuda persistente (opcional, para App.jsx) */}
    </div>,
    document.body
  );
}

export function HelpButton({ onClick }) {
  return (
    <button
      id="step-help-btn"
      onClick={onClick}
      className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-[9000] group"
      title="Ayuda / Tutorial"
    >
      <HelpCircle size={24} />
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        ¿Cómo funciona?
      </span>
    </button>
  );
}
