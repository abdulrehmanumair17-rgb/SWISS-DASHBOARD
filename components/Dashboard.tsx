
import React, { useState, useMemo } from 'react';
import { DepartmentMismatch } from '../types';
import { summarizeOperations, SummaryResult } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: DepartmentMismatch[];
  onDataUpdate: (data: DepartmentMismatch[]) => void;
}

const PRODUCT_MAPPING: Record<string, string[]> = {
  'Achievers': [
    'Asvon Tab 10/100mg 30s', 'Atoxan 30mg Tab.', 'D-ABS injection (IM)', 
    'D-ABS injection (IM) 5s', 'Pentallin Syp. IVY', 'Oplex 50mg/5ml Syrup 120ml',
    'Swicef 100mg/5ml Susp.', 'Swicef DS 200mg/5ml Susp.', 'Vitaglobin Plus Syp',
    'Vitaglobin Syp.', 'VITAGLOBIN Syrup 120ml', 'Vonz Tab 10mg 30s', 'Vonz Tab 20mg 30s'
  ],
  'Passionate': [
    'Cyestra Tablet', 'Riboxy Injection 500mg / 10ml', 'LER 2.5mg Tablet', 
    'Neet', 'Nomo-D 10/10mg Tablet', 'Oplex F 100mg/0.35mg 30s Tab',
    'Swicef 400mg Cap.', 'Vitaglobin Tablets'
  ],
  'Concord': ['Gaviscon Liquid', 'Panadol 500mg', 'Brufen 400mg', 'Augmentin 625mg'],
  'Dynamic': ['Solu-Cortef 100mg', 'Voren Inj', 'Dicloran Gel', 'Xylocaine 2%']
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [report, setReport] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string>('Executive Summary');
  
  const [viewDate, setViewDate] = useState(new Date());
  const selectedMonth = viewDate.getMonth();
  const selectedYear = viewDate.getFullYear();
  
  const [focusedDate, setFocusedDate] = useState<number | null>(null);

  const handleMonthChange = (offset: number) => {
    setViewDate(new Date(selectedYear, selectedMonth + offset, 1));
    setFocusedDate(null);
  };

  const workingDaysCount = useMemo(() => {
    let count = 0;
    const date = new Date(selectedYear, selectedMonth, 1);
    while (date.getMonth() === selectedMonth) {
      if (date.getDay() !== 0) count++;
      date.setDate(date.getDate() + 1);
    }
    return count || 26;
  }, [selectedMonth, selectedYear]);

  const groupPerformanceData = useMemo(() => {
    if (!focusedDate) return [];
    const dStr = focusedDate < 10 ? '0' + focusedDate : focusedDate;
    const dayPattern = `${MONTH_NAMES[selectedMonth]} ${dStr}, ${selectedYear}`;

    return Object.keys(PRODUCT_MAPPING).map(team => {
      let totalTarget = 0;
      let totalAchieved = 0;

      const teamMasterRows = data.filter(d => d.team === team && d.plan > 0 && !d.reportDate);
      teamMasterRows.forEach(r => {
        const dailyTarget = Math.round(r.plan / workingDaysCount);
        const dailyMatch = data.find(d => d.metric === r.metric && d.reportDate?.toLowerCase().includes(dayPattern.toLowerCase()));
        const achieved = dailyMatch ? dailyMatch.actual : 0;
        
        totalTarget += dailyTarget;
        totalAchieved += achieved;
      });

      return {
        name: team,
        Target: totalTarget,
        Achieved: totalAchieved,
      };
    });
  }, [focusedDate, data, workingDaysCount, selectedMonth, selectedYear]);

  const renderSalesDepartment = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray: (number | null)[] = [...Array(firstDay).fill(null)];
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

    return (
      <div className="bg-white">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
           <div className="flex items-center gap-6">
             <div className="flex gap-2 no-print">
               <button onClick={() => handleMonthChange(-1)} className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button onClick={() => handleMonthChange(1)} className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
               </button>
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{MONTH_NAMES[selectedMonth]} {selectedYear}</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Pulse • Target Distribution: {workingDaysCount} Days</p>
             </div>
           </div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
              <div key={d} className="bg-slate-50 py-4 text-center text-[10px] font-black text-slate-400 tracking-widest">{d}</div>
            ))}
            {daysArray.map((day, idx) => {
              const isSunday = day && new Date(selectedYear, selectedMonth, day).getDay() === 0;
              const dStr = day ? (day < 10 ? '0' + day : '' + day) : '';
              const dayPattern = day ? `${MONTH_NAMES[selectedMonth]} ${dStr}, ${selectedYear}` : '';
              const hasData = day && data.some(d => d.reportDate && d.reportDate.toLowerCase().includes(dayPattern.toLowerCase()));

              return (
                <button
                  key={idx}
                  disabled={!day || isSunday}
                  onClick={() => setFocusedDate(day)}
                  className={`h-32 p-4 text-left relative transition-all ${!day ? 'bg-slate-50/50' : isSunday ? 'bg-slate-50 text-slate-100' : 'bg-white hover:bg-red-50 hover:shadow-inner'} ${focusedDate === day ? 'ring-4 ring-inset ring-red-600 z-10' : ''}`}
                >
                  <span className={`text-sm font-black ${isSunday ? 'text-slate-100' : 'text-slate-800'}`}>{day || ''}</span>
                  {hasData && !isSunday && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200 animate-pulse"></div>
                       <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">DATA SYNCED</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {focusedDate && (
          <div className="px-10 pb-20 animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-[#0b1120] rounded-[3rem] overflow-hidden shadow-4xl border border-white/5">
              <div className="p-10 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-xl shadow-xl">📊</div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Shortfall Audit - {MONTH_NAMES[selectedMonth]} {focusedDate}, {selectedYear}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Matrix: Total Group Target vs Achievement</p>
                  </div>
                </div>
                <button onClick={() => setFocusedDate(null)} className="text-white/40 hover:text-white text-xs font-black uppercase tracking-widest px-6 py-3 border border-white/10 rounded-xl transition-all hover:bg-white/5">Exit Report</button>
              </div>

              <div className="p-10 bg-slate-900/40 border-b border-white/5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Aggregate Divisional Performance</h4>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '25px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      <Bar dataKey="Target" name="DAILY TARGET" fill="#1e293b" radius={[6, 6, 0, 0]} barSize={45} />
                      <Bar dataKey="Achieved" name="DAILY ACTUAL" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="max-h-[600px] overflow-auto scrollbar-thin">
                {Object.keys(PRODUCT_MAPPING).map(team => {
                  const masterRows = data.filter(d => d.team === team && d.plan > 0 && !d.reportDate);
                  
                  const shortfallRows = masterRows.filter(r => {
                    const dStr = focusedDate < 10 ? '0' + focusedDate : focusedDate;
                    const dayPattern = `${MONTH_NAMES[selectedMonth]} ${dStr}, ${selectedYear}`;
                    const dailyMatch = data.find(d => d.metric === r.metric && d.reportDate?.toLowerCase().includes(dayPattern.toLowerCase()));
                    const achieved = dailyMatch ? dailyMatch.actual : 0;
                    const dailyTarget = Math.round(r.plan / workingDaysCount);
                    return (dailyTarget - achieved) > 0;
                  });

                  return (
                    <div key={team} className="p-10 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <h4 className="text-white font-black uppercase mb-8 flex items-center gap-4 tracking-tighter italic">
                        <span className="w-2 h-8 bg-red-600 rounded-full shadow-lg shadow-red-900"></span> {team} PERFORMANCE STATUS
                      </h4>
                      
                      {masterRows.length === 0 ? (
                        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 text-center">
                          <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">⚠️ NO TARGETS DEFINED FOR {team}</p>
                          <p className="text-[9px] text-slate-500 mt-2 font-bold">Please upload a Master Plan for this group in Data Entry to enable auditing.</p>
                        </div>
                      ) : shortfallRows.length === 0 ? (
                        <div className="bg-green-900/20 border border-green-800/30 rounded-2xl p-8 text-center">
                          <p className="text-[11px] font-black text-green-500 uppercase tracking-[0.2em]">✅ ALL TARGETS ACHIEVED FOR {team}</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-separate border-spacing-y-1">
                          <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10">
                            <tr>
                              <th className="pb-6 pl-4">PRODUCT NAME</th>
                              <th className="pb-6 text-right">TARGET</th>
                              <th className="pb-6 text-right">ACHIEVED</th>
                              <th className="pb-6 text-right pr-4">GAP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {shortfallRows.map((r, i) => {
                              const dailyTarget = Math.round(r.plan / workingDaysCount);
                              const dStr = focusedDate < 10 ? '0' + focusedDate : focusedDate;
                              const dayPattern = `${MONTH_NAMES[selectedMonth]} ${dStr}, ${selectedYear}`;
                              const dailyMatch = data.find(d => d.metric === r.metric && d.reportDate?.toLowerCase().includes(dayPattern.toLowerCase()));
                              const achieved = dailyMatch ? dailyMatch.actual : 0;
                              const shortfall = dailyTarget - achieved;

                              let rowStyle = "hover:bg-white/5";
                              if (shortfall > 50) {
                                rowStyle = "bg-red-600 text-white font-bold";
                              } else if (shortfall > 10) {
                                rowStyle = "bg-yellow-500 text-slate-900 font-bold";
                              }

                              return (
                                <tr key={i} className={`group transition-all ${rowStyle}`}>
                                  <td className="py-6 pl-4 text-sm group-hover:opacity-80">{r.metric}</td>
                                  <td className="py-6 text-right font-mono text-xs opacity-70">{dailyTarget.toLocaleString()}</td>
                                  <td className="py-6 text-right font-mono font-black text-lg opacity-80">{achieved.toLocaleString()}</td>
                                  <td className="py-6 text-right font-mono font-black text-xl pr-4">
                                    -{shortfall.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSheetContent = () => {
    if (activeSheet === 'Executive Summary') {
      return (
        <div className="py-32 text-center px-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-inner animate-float">🤖</div>
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">AI Operation Audit</h3>
          <p className="text-slate-400 font-medium max-w-sm mt-2 mb-10 uppercase text-[10px] tracking-widest font-bold">Synthesizing data from all synced Excel sheets into executive brief.</p>
          <button onClick={async () => {
            setLoading(true);
            try { setReport(await summarizeOperations(data)); } finally { setLoading(false); }
          }} className="bg-red-600 text-white px-20 py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-3xl hover:scale-105 active:scale-95 transition-all">GENERATE BOARD REPORT</button>
          
          {report && (
            <div className="mt-16 text-left max-w-3xl mx-auto p-12 bg-slate-900 rounded-[3rem] text-white shadow-4xl border border-white/5 animate-in zoom-in-95">
              <p className="text-2xl font-bold italic text-red-400 mb-8 leading-relaxed">"{report.executiveSummary}"</p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trend Insight:</p>
                   <p className="text-sm text-slate-300 leading-relaxed font-medium">{report.trendAnalysis}</p>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Board Directives:</p>
                   <div className="space-y-3">
                     {report.actions.map((a, i) => (
                       <div key={i} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                         <span className="w-8 h-8 rounded-xl bg-red-600 text-[10px] flex shrink-0 items-center justify-center font-black">{i+1}</span>
                         <span className="text-xs font-bold uppercase tracking-tight">{a}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (activeSheet === 'Sales') return renderSalesDepartment();
    return <div className="p-32 text-center text-slate-300 font-black uppercase italic tracking-[0.4em]">Section under board review</div>;
  };

  const sheets = ['Executive Summary', 'Sales', 'Production', 'Finance'];

  return (
    <div className="bg-white rounded-[4rem] border border-slate-200 shadow-3xl overflow-hidden flex flex-col min-h-[900px]">
      <div className="flex-1 overflow-auto">{loading ? <div className="p-40 text-center animate-pulse font-black uppercase text-slate-300 tracking-[0.5em]">Consulting Intelligence Engine...</div> : renderSheetContent()}</div>
      <div className="bg-slate-50 border-t border-slate-200 flex items-center h-28 no-print px-4">
        {sheets.map((sheet) => (
          <button key={sheet} onClick={() => setActiveSheet(sheet)} className={`flex-1 text-[10px] font-black uppercase tracking-[0.3em] h-20 rounded-2xl transition-all mx-1 ${activeSheet === sheet ? 'bg-white text-red-700 shadow-xl border border-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}>{sheet}</button>
        ))}
      </div>
    </div>
  );
};
