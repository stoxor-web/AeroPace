import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, Calendar as CalIcon, BarChart3, Settings as SettingsIcon, 
  Plus, ChevronLeft, ChevronRight, Map, Heart, Zap, Clock, 
  TrendingUp, AlertTriangle, Upload, RefreshCw, X, Menu,
  Target, Award, Flame, CheckCircle2
} from 'lucide-react';

// --- TYPES ---
type WorkoutType = 'EF' | 'SL' | 'VMA' | 'Seuil' | 'Récup' | 'Trail' | 'Course';
type WorkoutStatus = 'planned' | 'done' | 'missed';
type Provider = 'none' | 'strava' | 'garmin';

interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  distanceKm: number;
  durationSec: number;
  elevationM: number;
  rpe: number; // 1-10
  hrAvg?: number;
  notes: string;
  tags: string[];
  source: 'manual' | 'import';
  provider: Provider;
  status: WorkoutStatus;
}

// --- MOCK DATA GENERATOR ---
const generateMockData = (): Workout[] => {
  const today = new Date();
  const workouts: Workout[] = [];
  
  for (let i = 80; i >= -14; i -= (Math.floor(Math.random() * 2) + 1)) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isFuture = i < 0;
    const isTrail = Math.random() > 0.85;
    const isVMA = Math.random() > 0.8;
    
    let type: WorkoutType = 'EF';
    let distance = Math.floor(Math.random() * 6) + 6;
    let rpe = Math.floor(Math.random() * 3) + 3;
    let elevation = Math.floor(Math.random() * 50);

    if (isTrail) { type = 'Trail'; distance = 16; elevation = 750; rpe = 7; }
    else if (isVMA) { type = 'VMA'; distance = 9; rpe = 8; }
    else if (d.getDay() === 0) { type = 'SL'; distance = 21; rpe = 6; }

    workouts.push({
      id: `wk-${i}`,
      date: d.toISOString().split('T')[0],
      type,
      distanceKm: distance,
      durationSec: distance * (type === 'Trail' ? 390 : 315),
      elevationM: elevation,
      rpe,
      hrAvg: 135 + (rpe * 4),
      notes: isFuture ? 'Séance planifiée du plan.' : 'Bonne séance, cardio stable.',
      tags: isTrail ? ['dénivelé', 'technique'] : ['route', 'matin'],
      source: isFuture ? 'manual' : 'import',
      provider: isFuture ? 'none' : 'strava',
      status: isFuture ? 'planned' : 'done'
    });
  }
  return workouts;
};

// --- HELPERS ---
const formatDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
};

const formatPace = (secPerKm: number) => {
  const m = Math.floor(secPerKm / 60);
  const s = Math.floor(secPerKm % 60);
  return `${m}'${s.toString().padStart(2, '0')}"/km`;
};

const getTypeColor = (type: WorkoutType) => {
  const colors: Record<WorkoutType, string> = {
    'EF': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'SL': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    'VMA': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'Seuil': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Récup': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Trail': 'bg-amber-600/30 text-amber-500 border-amber-600/50',
    'Course': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return colors[type] || 'bg-slate-700 text-slate-300 border-slate-600';
};

// --- COMPONENTS ---

const DashboardCard = ({ title, value, icon: Icon, trend, subtitle }: any) => (
  <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-16 h-16 text-cyan-500" />
    </div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/20">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`mt-4 text-sm font-medium flex items-center ${trend > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
        <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
        {Math.abs(trend)}% vs sem. dernière
      </div>
    )}
  </div>
);

const WorkoutCard = ({ workout }: { workout: Workout }) => (
  <div className="group bg-[#111827] border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all duration-300 relative overflow-hidden">
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${workout.status === 'planned' ? 'bg-slate-600' : 'bg-gradient-to-b from-cyan-400 to-blue-600'}`}></div>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(workout.type)}`}>
          {workout.type}
        </span>
        <span className="text-slate-400 text-sm font-medium">{new Date(workout.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
      {workout.provider === 'strava' && <span className="text-[10px] font-bold uppercase bg-[#FC4C02]/10 text-[#FC4C02] px-2 py-1 rounded-md border border-[#FC4C02]/20">Strava</span>}
      {workout.provider === 'garmin' && <span className="text-[10px] font-bold uppercase bg-[#007CC3]/10 text-[#007CC3] px-2 py-1 rounded-md border border-[#007CC3]/20">Garmin</span>}
    </div>
    
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Distance</p>
        <p className="text-xl font-bold text-white">{workout.distanceKm} <span className="text-xs font-normal text-slate-400">km</span></p>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Durée</p>
        <p className="text-lg font-bold text-slate-200">{formatDuration(workout.durationSec)}</p>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Allure</p>
        <p className="text-lg font-bold text-cyan-400">{formatPace(workout.durationSec / workout.distanceKm)}</p>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Charge/RPE</p>
        <div className="flex items-center mt-1">
          <div className="w-full bg-slate-800 rounded-full h-1.5 mr-2 overflow-hidden">
            <div className={`h-1.5 rounded-full ${workout.rpe >= 8 ? 'bg-rose-500' : workout.rpe >= 5 ? 'bg-orange-500' : 'bg-cyan-500'}`} style={{ width: `${(workout.rpe / 10) * 100}%` }}></div>
          </div>
          <span className="text-xs font-bold text-slate-300">{workout.rpe}</span>
        </div>
      </div>
    </div>
    
    {(workout.elevationM > 0 || workout.hrAvg || workout.tags.length > 0) && (
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-3 mt-1">
        {workout.elevationM > 0 && (
          <div className="flex items-center text-slate-400 text-xs font-medium">
            <Map className="w-3.5 h-3.5 mr-1 text-amber-500" /> {workout.elevationM}m D+
          </div>
        )}
        {workout.hrAvg && (
          <div className="flex items-center text-slate-400 text-xs font-medium">
            <Heart className="w-3.5 h-3.5 mr-1 text-rose-500" /> {workout.hrAvg} bpm
          </div>
        )}
        <div className="flex gap-1 ml-auto">
          {workout.tags.map(t => (
            <span key={t} className="text-[9px] uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-0.5 rounded-sm">{t}</span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setWorkouts(generateMockData());
  }, []);

  // -- CALCULATIONS --
  const doneWorkouts = workouts.filter(w => w.status === 'done');
  
  const statsThisWeek = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    startOfWeek.setHours(0,0,0,0);
    
    const weekWorkouts = doneWorkouts.filter(w => new Date(w.date) >= startOfWeek);
    return {
      distance: weekWorkouts.reduce((acc, w) => acc + w.distanceKm, 0),
      duration: weekWorkouts.reduce((acc, w) => acc + w.durationSec, 0),
      elevation: weekWorkouts.reduce((acc, w) => acc + w.elevationM, 0),
      count: weekWorkouts.length
    };
  }, [doneWorkouts]);

  const isOverloaded = useMemo(() => {
    const today = new Date();
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const last4WeeksWorkouts = doneWorkouts.filter(w => new Date(w.date) >= fourWeeksAgo && new Date(w.date) < new Date(new Date().setDate(new Date().getDate() - 7)));
    const avgWeeklyDist = (last4WeeksWorkouts.reduce((acc, w) => acc + w.distanceKm, 0)) / 4;
    
    return statsThisWeek.distance > (avgWeeklyDist * 1.3) && avgWeeklyDist > 10;
  }, [doneWorkouts, statsThisWeek]);

  // -- VIEWS --
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Tableau de bord</h2>
          <p className="text-cyan-400/80 font-medium mt-1 tracking-wide uppercase text-sm flex items-center">
            <Zap className="w-4 h-4 mr-1.5" /> Plan. Run. Progress.
          </p>
        </div>
        <button className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
          <Plus className="w-5 h-5 mr-2" />
          Planifier une séance
        </button>
      </div>

      {isOverloaded && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl flex items-start space-x-4 animate-pulse">
          <div className="bg-orange-500/20 p-2 rounded-full">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h4 className="text-orange-400 font-bold tracking-wide">Alerte de Surcharge Détectée</h4>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">Votre volume actuel dépasse de plus de <strong className="text-white">30%</strong> votre moyenne des 4 dernières semaines. Envisagez d'intégrer une semaine d'assimilation pour éviter le surmenage.</p>
          </div>
        </div>
      )}

      {/* OBJECTIF EN COURS */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Semi-Marathon de Paris</h3>
            <p className="text-slate-400 text-sm">Objectif: 1h45 • Dans 42 jours</p>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-slate-400 uppercase tracking-wider">Progression Plan</span>
            <span className="text-cyan-400">65%</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Distance Hebdo" value={`${statsThisWeek.distance.toFixed(1)} km`} icon={Activity} trend={8} subtitle="Moyenne 4 sem: 45 km" />
        <DashboardCard title="Temps Hebdo" value={formatDuration(statsThisWeek.duration)} icon={Clock} trend={12} />
        <DashboardCard title="Dénivelé Hebdo" value={`${statsThisWeek.elevation} m`} icon={Map} trend={-15} />
        <DashboardCard title="Charge Totale" value={statsThisWeek.count * 42} icon={Flame} subtitle="Unités TRIMP est." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end border-b border-slate-800 pb-3">
            <h3 className="text-xl font-bold text-white tracking-tight">Activités récentes</h3>
            <button onClick={() => setActiveTab('log')} className="text-cyan-400 text-sm hover:text-cyan-300 font-bold uppercase tracking-wider transition-colors">Tout voir &rarr;</button>
          </div>
          <div className="space-y-4">
            {doneWorkouts.slice(0, 3).map(w => <WorkoutCard key={w.id} workout={w} />)}
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-tight border-b border-slate-800 pb-3">Agenda</h3>
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-2 shadow-xl">
            {workouts.filter(w => w.status === 'planned').slice(0, 4).map(w => (
              <div key={w.id} className="flex items-center space-x-4 p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 rounded-xl transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center bg-slate-800/80 rounded-lg w-12 h-12 border border-slate-700 group-hover:border-cyan-500/30 transition-colors">
                  <span className="text-xs text-slate-400 font-bold uppercase">{new Date(w.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                  <span className="text-lg font-bold text-white leading-none">{new Date(w.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${w.type === 'SL' ? 'bg-blue-500' : w.type === 'VMA' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <p className="text-white font-bold text-sm tracking-wide">{w.type}</p>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{w.distanceKm} km • Obj: {formatPace((w.type === 'EF' ? 330 : 270))} /km</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLog = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Journal d'entraînement</h2>
          <p className="text-slate-400 text-sm mt-1">Retrouvez l'historique de vos sorties et imports.</p>
        </div>
        <div className="flex space-x-3">
          <select className="bg-[#111827] border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none">
            <option>Toutes les sources</option>
            <option>Strava</option>
            <option>Garmin</option>
            <option>Manuel</option>
          </select>
          <select className="bg-[#111827] border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none">
            <option>Tous les types</option>
            <option>Endurance Fondamentale</option>
            <option>VMA</option>
            <option>Sortie Longue</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {workouts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  );

  const renderCalendar = () => {
    // Generate a simple calendar view for the current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const days = [];
    // Padding start
    for (let i = 0; i < (startOfMonth.getDay() || 7) - 1; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(today.getFullYear(), today.getMonth(), i));
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Planification</h2>
          <div className="flex items-center space-x-4 bg-[#111827] p-1.5 rounded-xl border border-slate-800">
            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-white font-bold capitalize w-32 text-center">
              {today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/50">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {days.map((date, i) => {
              if (!date) return <div key={`pad-${i}`} className="border-r border-b border-slate-800/50 bg-slate-900/20"></div>;
              
              const dateStr = date.toISOString().split('T')[0];
              const dayWorkouts = workouts.filter(w => w.date === dateStr);
              const isToday = date.toDateString() === today.toDateString();

              return (
                <div key={dateStr} className={`border-r border-b border-slate-800/50 p-2 min-h-[100px] hover:bg-slate-800/30 transition-colors group relative ${isToday ? 'bg-cyan-500/5' : ''}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-cyan-500 text-white' : 'text-slate-400 group-hover:text-white'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {dayWorkouts.map(w => (
                      <div key={w.id} className={`text-xs px-2 py-1.5 rounded border flex flex-col gap-0.5 ${w.status === 'planned' ? 'bg-slate-800/50 border-slate-700 text-slate-300 border-dashed' : getTypeColor(w.type)}`}>
                        <span className="font-bold flex items-center justify-between">
                          {w.type}
                          {w.status === 'done' && <CheckCircle2 className="w-3 h-3 ml-1 opacity-70" />}
                        </span>
                        <span>{w.distanceKm}k • {formatDuration(w.durationSec)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const weeks = Array.from({ length: 14 }, (_, i) => i);
    const days = [0, 1, 2, 3, 4, 5, 6];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Analyses Avancées</h2>
            <p className="text-slate-400 text-sm mt-1">Tendances, charge et forme sur le long terme.</p>
          </div>
        </div>
        
        {/* Heatmap Github Style */}
        <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center tracking-tight">
            <Activity className="w-5 h-5 mr-2 text-cyan-400" />
            Régularité & Volume (14 dernières semaines)
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
            {weeks.map(w => (
              <div key={w} className="flex flex-col gap-2">
                {days.map(d => {
                  const val = Math.random();
                  let color = 'bg-slate-800';
                  if (val > 0.8) color = 'bg-cyan-400';
                  else if (val > 0.5) color = 'bg-blue-500';
                  else if (val > 0.2) color = 'bg-blue-800';
                  return <div key={`${w}-${d}`} className={`w-4 h-4 rounded-sm ${color} transition-all hover:scale-125 hover:ring-2 ring-white/50 cursor-crosshair`} title="Détail journée" />
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-3 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Repos</span>
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
              <div className="w-3 h-3 rounded-sm bg-blue-800"></div>
              <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
              <div className="w-3 h-3 rounded-sm bg-cyan-400"></div>
            </div>
            <span>Intense</span>
          </div>
        </div>

        {/* Bar Chart Surcharge */}
        <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-white tracking-tight">Charge de Travail (Volume x RPE)</h3>
            <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-700">Modèle TRIMP simplifié</span>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {[...Array(14)].map((_, i) => {
              const height = Math.floor(Math.random() * 60) + 20;
              const isHigh = height > 70;
              return (
                <div key={i} className="w-full flex flex-col items-center group">
                  <div className="w-full relative flex items-end h-52 bg-slate-800/30 rounded-t-lg overflow-hidden">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-125 ${isHigh ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 'bg-gradient-to-t from-blue-600 to-cyan-400'}`} 
                      style={{ height: `${height}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      {height * 15} u.
                    </div>
                  </div>
                  <span className="text-slate-500 text-[10px] font-bold mt-3 uppercase tracking-wider">S-{14-i}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Connexions & Paramètres</h2>
        <p className="text-slate-400 text-sm mt-1">Gérez vos sources de données et vos préférences.</p>
      </div>
      
      <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-4 tracking-tight">Synchronisation Automatique</h3>
        
        {/* Strava */}
        <div className="flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#FC4C02]/10 rounded-xl flex items-center justify-center border border-[#FC4C02]/20">
              <span className="text-[#FC4C02] font-black text-2xl tracking-tighter">S</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Strava</h4>
              <p className="text-emerald-400 text-sm font-medium flex items-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Connecté (Sync. auto activée)
              </p>
              <p className="text-slate-500 text-xs mt-1">Dernière synchro: Aujourd'hui à 14h32</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="p-2.5 text-slate-400 hover:text-cyan-400 transition-colors bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700" title="Forcer la synchronisation">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-rose-500/20 hover:text-rose-400 transition-colors border border-slate-700 hover:border-rose-500/30">
              Déconnecter
            </button>
          </div>
        </div>

        {/* Garmin */}
        <div className="flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#007CC3]/10 rounded-xl flex items-center justify-center border border-[#007CC3]/20">
              <span className="text-[#007CC3] font-black text-xl">Garmin</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Garmin Connect</h4>
              <p className="text-slate-500 text-sm mt-0.5">Non connecté</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-[#007CC3] text-white rounded-xl font-bold text-sm hover:bg-[#0066a3] transition-colors shadow-lg shadow-[#007CC3]/20">
            Associer le compte
          </button>
        </div>

        {/* Import manuel */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h4 className="text-white font-bold text-lg mb-2">Importation manuelle de fichiers</h4>
          <p className="text-slate-400 text-sm mb-6">Utilisez cette option si l'API Garmin n'est pas disponible ou pour uploader d'anciennes archives.</p>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-900/50 hover:bg-slate-800 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="mb-2 text-sm text-slate-300"><span className="font-bold text-white">Cliquez pour parcourir</span> ou glissez-déposez ici</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Formats supportés: .FIT, .TCX, .GPX</p>
            </div>
            <input type="file" className="hidden" accept=".fit,.tcx,.gpx" />
          </label>
        </div>
      </div>
    </div>
  );

  // -- MAIN LAYOUT --
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'calendar', label: 'Calendrier', icon: CalIcon },
    { id: 'log', label: 'Journal', icon: Award },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#090E17] font-sans text-slate-200 flex flex-col md:flex-row overflow-hidden selection:bg-cyan-500/30">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#090E17]/95 backdrop-blur-md z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">AeroPace</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400 bg-slate-800 rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-40 w-72 h-full bg-[#090E17]/95 md:bg-[#0B111A] border-r border-slate-800 p-6 flex flex-col transition-transform duration-300 backdrop-blur-xl md:backdrop-blur-none shadow-2xl md:shadow-none
      `}>
        <div className="hidden md:flex items-center space-x-4 mb-12 px-2">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 transform -rotate-6">
            <Zap className="w-7 h-7 text-white transform rotate-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter block leading-none">AeroPace</span>
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Studio</span>
          </div>
        </div>

        <div className="space-y-2 flex-1 mt-10 md:mt-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-4 border-cyan-500 text-white font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium border-l-4 border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 shadow-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-inner">AL</div>
            <div>
              <p className="text-white font-bold text-sm">Alex L.</p>
              <p className="text-cyan-400 text-xs font-medium">Pro Plan actif</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 h-[calc(100vh-73px)] md:h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#090E17] to-[#090E17]">
        <div className="max-w-6xl mx-auto h-full">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'log' && renderLog()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

    </div>
  );
}
