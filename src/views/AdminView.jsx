import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Leaf, Building2, Map as MapIcon, Users, ArrowUpRight, Trash2, Globe, X, ChevronDown } from 'lucide-react';
import { EcoMap } from '../components/EcoMap';
import { supabase } from '../supabase';
import { ImageModal } from '../components/ImageModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { IMPACT_FACTORS } from '../utils';

export function AdminView({ user, showToast }) {
  const [reports, setReports] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [viewMode, setViewMode] = useState('stats'); // 'stats' | 'ranking' | 'users' | 'reports'
  const [modalImage, setModalImage] = useState(null);
  const [isMapFull, setIsMapFull] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pendiente' | 'completado'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    const fetchData = async () => {
      const { data: repData, error: repErr } = await supabase.from('reportes').select('*');
      if (!repErr) setReports(repData);

      const { data: usersData, error: userErr } = await supabase.from('usuarios').select('*');
      if (!userErr) {
        setAllUsers(usersData);
        setUsersCount(usersData.filter(u => u.rol === 'ciudadano').length);
      }
    };

    fetchData();

    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reportes' }, () => fetchData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const completedReports = reports.filter(r => r.estado === 'completado' && r.reciclador_id);
  const rankingMap = {};
  completedReports.forEach(r => {
    rankingMap[r.reciclador_id] = (rankingMap[r.reciclador_id] || 0) + 1;
  });
  
  const ranking = Object.entries(rankingMap)
    .map(([id, count]) => {
      const u = allUsers.find(user => user.id === id);
      return { id, nombre: u ? u.nombre : 'Usuario Borrado', count, rol: u ? u.rol : '' };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const completedImpactReports = reports.filter(r => r.estado === 'completado');
  let totalKg = 0;
  let totalCo2 = 0;

  completedImpactReports.forEach(r => {
    const factor = IMPACT_FACTORS[r.material] || IMPACT_FACTORS.default;
    totalKg += factor.kg;
    totalCo2 += factor.kg * factor.co2;
  });

  const stats = [
    { label: 'Ciudadanos Registrados', value: usersCount.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Kg Recuperados (Aprox)', value: `${totalKg.toLocaleString()} kg`, icon: Leaf, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'CO2 Mitigado (Aprox)', value: `${totalCo2.toLocaleString()} kg`, icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Reportes Históricos', value: reports.length.toString(), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  const handleDeleteUsers = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Borrar Usuarios',
      message: `¿Estás seguro de borrar ${selectedUsers.length} usuarios? Esta acción también borrará todos los reportes asociados a ellos y no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          // Primero borramos los reportes asociados para evitar error de foreign key
          const { error: repError } = await supabase.from('reportes').delete().in('usuario_id', selectedUsers);
          if (repError) throw repError;

          const { error } = await supabase.from('usuarios').delete().in('id', selectedUsers);
          if (error) throw error;
          
          setAllUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
          setReports(prev => prev.filter(r => !selectedUsers.includes(r.usuario_id))); // Limpiar UI
          setSelectedUsers([]);
          showToast("Usuarios borrados con éxito");
        } catch (err) {
          showToast("Error al borrar usuarios: " + err.message, 'error');
        }
      }
    });
  };

  const handleDeleteSingleUser = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Borrar Usuario',
      message: `¿Estás seguro de borrar este usuario? Esta acción también borrará todos sus reportes y no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          // Primero borramos los reportes asociados para evitar error de foreign key
          const { error: repError } = await supabase.from('reportes').delete().eq('usuario_id', id);
          if (repError) throw repError;

          const { error } = await supabase.from('usuarios').delete().eq('id', id);
          if (error) throw error;

          setAllUsers(prev => prev.filter(u => u.id !== id));
          setReports(prev => prev.filter(r => r.usuario_id !== id)); // Limpiar UI
          showToast("Usuario borrado con éxito");
        } catch (err) {
          showToast("Error al borrar usuario: " + err.message, 'error');
        }
      }
    });
  };

  const handleDeleteReports = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Borrar Reportes',
      message: `¿Estás seguro de borrar ${selectedReports.length} reportes? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const { error } = await supabase.from('reportes').delete().in('id', selectedReports);
          if (error) throw error;
          setReports(prev => prev.filter(r => !selectedReports.includes(r.id)));
          setSelectedReports([]);
          showToast("Reportes borrados con éxito");
        } catch (err) {
          showToast("Error al borrar reportes: " + err.message, 'error');
        }
      }
    });
  };

  const handleDeleteSingleReport = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Borrar Reporte',
      message: `¿Estás seguro de borrar este reporte? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const { error } = await supabase.from('reportes').delete().eq('id', id);
          if (error) throw error;
          setReports(prev => prev.filter(r => r.id !== id));
          if (selectedMarker?.id === id) setSelectedMarker(null);
          showToast("Reporte borrado con éxito");
        } catch (err) {
          showToast("Error al borrar reporte: " + err.message, 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
        <div className="space-y-1 text-center md:text-left w-full">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Panel Estratégico</h2>
          <p className="text-gray-400 font-medium text-sm md:text-base">Métricas de impacto y monitoreo en tiempo real.</p>
        </div>
        <div id="step-admin-nav" className="flex bg-black/40 p-1 md:p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl w-full md:w-auto overflow-x-auto md:overflow-visible no-scrollbar">
          {[
            { id: 'stats', label: 'Dashboard', icon: TrendingUp },
            { id: 'ranking', label: 'Ranking', icon: BarChart3 },
            { id: 'users', label: 'Usuarios', icon: Users },
            { id: 'reports', label: 'Reportes', icon: MapIcon }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center justify-center gap-2 px-4 md:px-8 py-2.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-1 md:flex-none whitespace-nowrap ${viewMode === tab.id ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {viewMode === 'stats' && (
        <>
          <div id="step-admin-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel p-8 group hover:border-white/20 transition-all cursor-default"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={stat.color} size={28} />
                  </div>
                  <ArrowUpRight className="text-gray-600 group-hover:text-white transition-colors" size={20} />
                </div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</h3>
                <p className="text-4xl font-black mt-2 tracking-tighter text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {viewMode === 'ranking' && (
        <div className="glass-panel p-8">
          <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
            <span className="text-yellow-500">🏆</span> Ranking Operativo (Reportes Completados)
          </h3>
          {ranking.length > 0 ? (
            <div className="space-y-3">
              {ranking.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{user.nombre}</p>
                      <p className="text-[10px] font-black uppercase text-gray-400">{user.rol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-400">{user.count}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Completados</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-medium">Aún no hay reportes completados por el equipo.</p>
          )}
        </div>
      )}

      {(viewMode === 'stats' || viewMode === 'ranking') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`transition-all duration-500 relative ${isMapFull ? 'fixed inset-0 z-[5000] p-0 bg-[#251e18]' : 'lg:col-span-2 glass-panel p-6 md:p-10 flex flex-col gap-6 md:gap-8'}`}>
            {!isMapFull && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
                  <MapIcon className="text-yellow-500" size={24} />
                  Monitor Geoespacial
                </h3>
                <div id="step-admin-filters" className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-white/5 transition-colors"
                    >
                      {filterMaterial === 'all' ? 'TODOS LOS MATERIALES' : filterMaterial}
                      <ChevronDown size={12} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isFilterOpen && (
                      <>
                        <div className="fixed inset-0 z-[5999]" onClick={() => setIsFilterOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full mt-2 left-0 w-48 bg-[#2a1f18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[6000]"
                        >
                          <button 
                            onClick={() => { setFilterMaterial('all'); setIsFilterOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase transition-colors hover:bg-white/10 ${filterMaterial === 'all' ? 'text-orange-400 bg-orange-500/10' : 'text-gray-300'}`}
                          >
                            TODOS LOS MATERIALES
                          </button>
                          {[...new Set(reports.map(r => r.material))].map(m => (
                            <button 
                              key={m}
                              onClick={() => { setFilterMaterial(m); setIsFilterOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase transition-colors hover:bg-white/10 ${filterMaterial === m ? 'text-orange-400 bg-orange-500/10' : 'text-gray-300'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`px-3 py-1.5 text-[8px] md:text-[10px] font-black uppercase rounded-lg border transition-all ${showHeatmap ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                  >
                    {showHeatmap ? 'Ocultar Calor' : 'Mapa de Calor'}
                  </button>
                  <button 
                    onClick={() => setFilterStatus(filterStatus === 'pendiente' ? 'all' : 'pendiente')}
                    className={`px-2 py-1 text-[8px] md:text-[10px] font-black uppercase rounded-lg border transition-all whitespace-nowrap ${filterStatus === 'pendiente' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'}`}
                  >
                    {reports.filter(r => r.estado === 'pendiente').length} Pendientes
                  </button>
                  <button 
                    onClick={() => setFilterStatus(filterStatus === 'completado' ? 'all' : 'completado')}
                    className={`px-2 py-1 text-[8px] md:text-[10px] font-black uppercase rounded-lg border transition-all whitespace-nowrap ${filterStatus === 'completado' ? 'bg-green-500 text-black border-green-500 shadow-lg shadow-green-500/20' : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'}`}
                  >
                    {reports.filter(r => r.estado === 'completado').length} Atendidos
                  </button>
                </div>
              </div>
            )}
            
              <div id="step-admin-map" className={`relative overflow-hidden isolate ${isMapFull ? 'w-full h-full' : 'h-[60dvh] md:h-[500px] bg-black/40 border border-white/5 rounded-3xl md:rounded-[2rem]'}`}>
                <EcoMap 
                  points={reports.filter(r => 
                    (filterMaterial === 'all' || r.material === filterMaterial) &&
                    (filterStatus === 'all' || r.estado === filterStatus)
                  )} 
                  showHeatmap={showHeatmap} 
                  userRole="admin" 
                  externalFullscreen={isMapFull} 
                  onFullscreenChange={setIsMapFull}
                  onMarkerClick={(report) => setSelectedMarker(report)}
                >
                  {selectedMarker && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:w-80 p-4 md:p-6 bg-black/75 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999]"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black uppercase tracking-widest text-white text-base md:text-lg">{selectedMarker.material}</h4>
                          <p className={`text-[10px] md:text-xs font-black uppercase mt-1 ${selectedMarker.estado === 'pendiente' ? 'text-red-400' : 'text-green-400'}`}>{selectedMarker.estado}</p>
                        </div>
                        <button onClick={() => setSelectedMarker(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        {selectedMarker.estado === 'pendiente' && (
                          <button 
                            onClick={async () => {
                              const { error } = await supabase.from('reportes').update({ estado: 'completado', reciclador_id: user.id }).eq('id', selectedMarker.id);
                              if (!error) {
                                setReports(prev => prev.map(r => r.id === selectedMarker.id ? { ...r, estado: 'completado', reciclador_id: user.id } : r));
                                setSelectedMarker(null);
                                showToast("¡Reporte marcado como recogido!");
                              } else {
                                showToast("Error al actualizar: " + error.message, 'error');
                              }
                            }}
                            className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black text-[10px] md:text-xs font-black uppercase rounded-xl transition-colors shadow-lg shadow-green-500/20"
                          >
                            Marcar Recogido
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteSingleReport(selectedMarker.id)}
                          className="flex-1 py-3 bg-white/5 hover:bg-red-500 text-white border border-white/10 text-[10px] md:text-xs font-black uppercase rounded-xl transition-colors shadow-lg shadow-red-500/20"
                        >
                          Borrar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </EcoMap>
              </div>
          </div>

            <div className="glass-panel p-10 space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">Gestionar Equipo</h3>
                <p className="text-xs text-gray-500 font-bold">Crea nuevas cuentas para trabajadores de campo.</p>
              </div>
              <WorkerForm showToast={showToast} />
            </div>
          </div>
      )}

      {viewMode === 'users' && (
        <div className="glass-panel p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Gestión de Usuarios</h3>
            {selectedUsers.length > 0 && (
              <button 
                onClick={handleDeleteUsers}
                className="w-full md:w-auto px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Borrar Seleccionados ({selectedUsers.length})
              </button>
            )}
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4"><input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer rounded bg-white/10 border-white/20" onChange={(e) => setSelectedUsers(e.target.checked ? allUsers.map(u => u.id) : [])} /></th>
                    <th className="p-4 text-[9px] md:text-[10px] font-black uppercase text-gray-300 tracking-widest whitespace-nowrap">Nombre</th>
                    <th className="p-4 text-[9px] md:text-[10px] font-black uppercase text-gray-300 tracking-widest whitespace-nowrap">Rol</th>
                    <th className="p-4 text-[9px] md:text-[10px] font-black uppercase text-gray-300 tracking-widest whitespace-nowrap">Fecha Registro</th>
                    <th className="p-4 text-[9px] md:text-[10px] font-black uppercase text-gray-300 tracking-widest text-right whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {allUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/10 transition-colors">
                      <td className="p-4"><input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer rounded bg-white/10 border-white/20" checked={selectedUsers.includes(user.id)} onChange={(e) => setSelectedUsers(prev => e.target.checked ? [...prev, user.id] : prev.filter(id => id !== user.id))} /></td>
                      <td className="p-4 font-bold text-sm md:text-base whitespace-nowrap text-white">{user.nombre}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[7px] md:text-[8px] font-black uppercase border ${user.rol === 'admin' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{user.rol}</span></td>
                      <td className="p-4 text-[9px] md:text-[10px] text-gray-300 font-bold whitespace-nowrap">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {user.rol !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteSingleUser(user.id)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                            title="Borrar Usuario"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'reports' && (
        <div className="glass-panel p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black uppercase tracking-tight">Gestión de Reportes</h3>
            {selectedReports.length > 0 && (
              <button 
                onClick={handleDeleteReports}
                className="px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Borrar Seleccionados ({selectedReports.length})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4"><input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer rounded bg-white/10 border-white/20" onChange={(e) => setSelectedReports(e.target.checked ? reports.map(r => r.id) : [])} /></th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-300 tracking-widest">Material</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-300 tracking-widest">Estado</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-300 tracking-widest">Fecha</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-300 tracking-widest">Imagen</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-300 tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-white/10 transition-colors">
                    <td className="p-4"><input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer rounded bg-white/10 border-white/20" checked={selectedReports.includes(report.id)} onChange={(e) => setSelectedReports(prev => e.target.checked ? [...prev, report.id] : prev.filter(id => id !== report.id))} /></td>
                    <td className="p-4 font-bold uppercase text-white">{report.material}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${report.estado === 'pendiente' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>{report.estado}</span></td>
                    <td className="p-4 text-xs text-gray-300">{new Date(report.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      {report.imagen_url && (
                        <img 
                          src={report.imagen_url} 
                          className="w-10 h-10 rounded-lg object-cover cursor-zoom-in hover:scale-110 transition-transform" 
                          alt="Reporte" 
                          onClick={() => setModalImage(report.imagen_url)}
                        />
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteSingleReport(report.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                        title="Borrar Reporte"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ImageModal 
        isOpen={!!modalImage} 
        imageUrl={modalImage} 
        onClose={() => setModalImage(null)} 
      />

      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}

function WorkerForm({ showToast }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [documento, setDocumento] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('usuarios')
        .insert([{ nombre, password, rol: 'trabajador', empresa, documento }]);

      if (error) throw error;
      setSuccess(true);
      setNombre('');
      setPassword('');
      setEmpresa('');
      setDocumento('');
      showToast("¡Trabajador registrado con éxito!");
    } catch (err) {
      showToast("Error al crear trabajador: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreateWorker} className="space-y-4">
      <input 
        type="text" 
        placeholder="Nombre del trabajador" 
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full bg-white/5 border-white/10 text-sm"
        required
      />
      <input 
        type="text" 
        placeholder="Documento de Identidad" 
        value={documento}
        onChange={(e) => setDocumento(e.target.value)}
        className="w-full bg-white/5 border-white/10 text-sm"
        required
      />
      <input 
        type="text" 
        placeholder="Empresa Contratista" 
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        className="w-full bg-white/5 border-white/10 text-sm"
        required
      />
      <input 
        type="password" 
        placeholder="Contraseña" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-white/5 border-white/10 text-sm"
        required
      />
      <button 
        type="submit" 
        disabled={loading}
        className="w-full btn-eco bg-yellow-500 text-black font-black py-3 hover:bg-yellow-400 disabled:opacity-50"
      >
        {loading ? 'Creando...' : 'Registrar Trabajador'}
      </button>
      {success && (
        <p className="text-green-400 text-[10px] font-black uppercase text-center mt-2 animate-bounce">
          ¡Trabajador registrado con éxito!
        </p>
      )}
    </form>
  );
}
