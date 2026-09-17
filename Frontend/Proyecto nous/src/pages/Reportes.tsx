import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { KpiCard, Card, SectionTitle, Button, Tabs } from "@/components/ui";

const GREEN = "#1E6B3C";
const GOLD = "#F2A900";
const BLUE = "#2563EB";
const PURPLE = "#7C3AED";

const productosPorAnio = [
  { anio: "2021", articulos: 12, ponencias: 8, libros: 3, software: 1, otros: 4 },
  { anio: "2022", articulos: 18, ponencias: 11, libros: 4, software: 2, otros: 6 },
  { anio: "2023", articulos: 22, ponencias: 14, libros: 5, software: 3, otros: 8 },
  { anio: "2024", articulos: 27, ponencias: 17, libros: 6, software: 5, otros: 11 },
  { anio: "2025", articulos: 28, ponencias: 19, libros: 12, software: 8, otros: 22 },
];

const proyectosPorFacultad = [
  { facultad: "Ingeniería", activos: 14, cerrados: 8 },
  { facultad: "C. Económicas", activos: 9, cerrados: 5 },
  { facultad: "Agropecuarias", activos: 8, cerrados: 6 },
  { facultad: "Educación", activos: 7, cerrados: 4 },
  { facultad: "Derecho", activos: 5, cerrados: 3 },
  { facultad: "Salud", activos: 4, cerrados: 2 },
];

const presupuestoPorAnio = [
  { anio: "2021", asignado: 180, ejecutado: 152 },
  { anio: "2022", asignado: 220, ejecutado: 198 },
  { anio: "2023", asignado: 265, ejecutado: 248 },
  { anio: "2024", asignado: 320, ejecutado: 295 },
  { anio: "2025", asignado: 380, ejecutado: 312 },
];

const productosPieData = [
  { name: "Artículos Scopus/WoS", value: 28, color: GREEN },
  { name: "Ponencias nacionales", value: 14, color: GOLD },
  { name: "Ponencias internac.", value: 5, color: "#059669" },
  { name: "Libros/capítulos", value: 12, color: BLUE },
  { name: "Software registrado", value: 8, color: PURPLE },
  { name: "Otros", value: 22, color: "#9CA3AF" },
];

const radarData = [
  { subject: "Publicaciones", A: 82, fullMark: 100 },
  { subject: "Proyectos", A: 91, fullMark: 100 },
  { subject: "Semilleros", A: 75, fullMark: 100 },
  { subject: "Financiero", A: 82, fullMark: 100 },
  { subject: "Grupos", A: 68, fullMark: 100 },
  { subject: "Movilidad", A: 60, fullMark: 100 },
];

const grupoRanking = [
  { grupo: "GIDEMA", categoria: "B", proyectos: 8, productos: 22 },
  { grupo: "GICADE", categoria: "B", proyectos: 6, productos: 18 },
  { grupo: "BIOAGRO", categoria: "C", proyectos: 5, productos: 14 },
  { grupo: "GIEIT", categoria: "C", proyectos: 4, productos: 11 },
  { grupo: "GIHUCS", categoria: "C", proyectos: 4, productos: 9 },
  { grupo: "GIPSIC", categoria: "D", proyectos: 3, productos: 7 },
];

export function Reportes() {
  const [tab, setTab] = useState("general");

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs text-[#637068] mb-1">NOUS / Reportes e Indicadores</div>
          <h1 className="text-xl font-bold text-[#1A2B22]">Dashboard Institucional</h1>
          <p className="text-sm text-[#637068]">Indicadores de investigación — Vicerrectoría 2025</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Exportar Excel</Button>
          <Button variant="secondary" size="sm">Exportar PDF</Button>
          <Button variant="primary" size="sm">Generar Informe</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Índice de Productividad" value="4.2" sub="Productos/investigador/año" color="green" trend={{ value: "+0.8 vs 2024", up: true }}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <KpiCard title="Tasa de Éxito Conv." value="68%" sub="Proyectos aprobados / postuladoss" color="gold"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard title="Grupos Activos" value="12" sub="6 Cat. B · 4 Cat. C · 2 Cat. D" color="blue"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KpiCard title="Investigadores Activos" value="128" sub="TC: 64 · MT: 48 · Externos: 16" color="purple"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
      </div>

      <Tabs
        tabs={[
          { id: "general", label: "Vista General" },
          { id: "productos", label: "Productos" },
          { id: "financiero", label: "Financiero" },
          { id: "grupos", label: "Grupos" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Proyectos por facultad */}
          <Card className="lg:col-span-2" padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Proyectos por Facultad</h3>
              <p className="text-xs text-[#637068]">Activos vs. cerrados en 2025</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={proyectosPorFacultad} margin={{ left: -5, right: 10, top: 5, bottom: 5 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F4F0" />
                <XAxis dataKey="facultad" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9BAD9F" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9BAD9F" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }} cursor={{ fill: "#F2F5F3" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="activos" name="Activos" fill={GREEN} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="cerrados" name="Cerrados" fill="#C8E6D2" radius={[0, 0, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar */}
          <Card padding={false}>
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Índice por Dimensión</h3>
              <p className="text-xs text-[#637068]">Desempeño institucional VRI</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#DDE4DF" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#637068" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="VRI 2025" dataKey="A" stroke={GREEN} fill={GREEN} fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }} formatter={(v: any) => [`${v}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Presupuesto histórico */}
          <Card className="lg:col-span-3" padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Evolución Presupuestal 2021–2025</h3>
              <p className="text-xs text-[#637068]">Millones COP — Tendencia de inversión en investigación</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={presupuestoPorAnio} margin={{ left: -5, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F0" vertical={false} />
                <XAxis dataKey="anio" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }}
                  formatter={(v: any) => [`$${v}M`]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="asignado" name="Presupuesto Asignado" stroke="#DDE4DF" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: "#DDE4DF" }} />
                <Line type="monotone" dataKey="ejecutado" name="Presupuesto Ejecutado" stroke={GREEN} strokeWidth={2.5} dot={{ r: 4, fill: GREEN, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "productos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2" padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Producción Científica por Tipo y Año</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productosPorAnio} margin={{ left: -5, right: 10, top: 5, bottom: 5 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F4F0" />
                <XAxis dataKey="anio" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }} cursor={{ fill: "#F2F5F3" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="articulos" name="Artículos" fill={GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="ponencias" name="Ponencias" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="libros" name="Libros" fill={BLUE} radius={[4, 4, 0, 0]} />
                <Bar dataKey="software" name="Software" fill={PURPLE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card padding={false}>
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Distribución 2025</h3>
              <p className="text-xs text-[#637068]">89 productos registrados</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={productosPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {productosPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="px-5 pb-4 space-y-1.5">
              {productosPieData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[#637068]">{p.name}</span>
                  </div>
                  <span className="font-semibold text-[#1A2B22]">{p.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "grupos" && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF]">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Ranking de Grupos de Investigación</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDE4DF]">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-[#637068] uppercase tracking-wide">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Grupo</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Categoría</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Proyectos</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Productos</th>
                </tr>
              </thead>
              <tbody>
                {grupoRanking.map((g, i) => (
                  <tr key={g.grupo} className="border-b border-[#F2F5F3] hover:bg-[#FAFFFE]">
                    <td className="py-3 px-5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: i < 3 ? "#FFF8E6" : "#F2F5F3", color: i < 3 ? "#D4930B" : "#637068" }}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1A2B22]">{g.grupo}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: g.categoria === "B" ? "#EBF5EF" : g.categoria === "C" ? "#FFF8E6" : "#F2F5F3",
                          color: g.categoria === "B" ? "#1E6B3C" : g.categoria === "C" ? "#D4930B" : "#637068",
                        }}>
                        Cat. {g.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#1A2B22]">{g.proyectos}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#1E6B3C]">{g.productos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "financiero" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Ejecución Financiera por Facultad</h3>
              <p className="text-xs text-[#637068]">Millones COP — 2025</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { facultad:"Ingeniería", aprobado:148, ejecutado:121 },
                { facultad:"C. Económicas", aprobado:72, ejecutado:54 },
                { facultad:"Agropecuarias", aprobado:88, ejecutado:82 },
                { facultad:"Educación", aprobado:40, ejecutado:21 },
                { facultad:"Derecho", aprobado:18, ejecutado:14 },
                { facultad:"Salud", aprobado:14, ejecutado:4 },
              ]} margin={{ left:-5, right:10, top:5, bottom:5 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F4F0" />
                <XAxis dataKey="facultad" axisLine={false} tickLine={false} tick={{ fontSize:10, fill:"#9BAD9F" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#9BAD9F" }} tickFormatter={(v)=>`$${v}M`} />
                <Tooltip contentStyle={{ borderRadius:10, border:"1px solid #DDE4DF", fontSize:12, fontFamily:"Poppins" }} formatter={(v: any)=>[`$${v}M`]} cursor={{ fill:"#F2F5F3" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="aprobado" name="Aprobado" fill="#DDE4DF" radius={[4,4,0,0]} />
                <Bar dataKey="ejecutado" name="Ejecutado" fill={GREEN} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-[#1A2B22] mb-4">Disponibilidad Presupuestal por Rubro</h3>
            <div className="space-y-3">
              {[
                { rubro:"Personal", aprobado:380, ejecutado:260, color:GREEN },
                { rubro:"Equipos", aprobado:120, ejecutado:118, color:BLUE },
                { rubro:"Materiales", aprobado:90, ejecutado:71, color:GOLD },
                { rubro:"Viajes y Movilidad", aprobado:85, ejecutado:60, color:PURPLE },
                { rubro:"Servicios", aprobado:55, ejecutado:38, color:"#0891B2" },
                { rubro:"Imprevistos", aprobado:50, ejecutado:17, color:"#9CA3AF" },
              ].map(r=>{
                const pct=Math.round((r.ejecutado/r.aprobado)*100);
                return (
                  <div key={r.rubro}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-[#1A2B22]">{r.rubro}</span>
                      <span className="text-xs text-[#637068]">${r.ejecutado}M / ${r.aprobado}M · <strong style={{color:r.color}}>{pct}%</strong></span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F2F5F3] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:r.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
