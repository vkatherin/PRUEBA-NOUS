import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Badge, Button, Card, PageHeader, ProgressBar, Tabs, KpiCard } from "@/components/ui";

const GREEN = "#1E6B3C";
const GOLD = "#F2A900";

const RUBROS_DATA = [
  { rubro: "Personal", aprobado: 142, ejecutado: 118, color: GREEN },
  { rubro: "Equipos", aprobado: 68, ejecutado: 68, color: "#2563EB" },
  { rubro: "Materiales", aprobado: 45, ejecutado: 38, color: GOLD },
  { rubro: "Viajes", aprobado: 52, ejecutado: 41, color: "#7C3AED" },
  { rubro: "Servicios", aprobado: 38, ejecutado: 28, color: "#0891B2" },
  { rubro: "Otros", aprobado: 35, ejecutado: 19, color: "#9CA3AF" },
];

const PROYECTOS_FINANCIERO = [
  { nombre: "Modelación Hídrica Córdoba", facultad: "Ingeniería", aprobado: 42500000, ejecutado: 33150000, rubros: 5 },
  { nombre: "Inclusión Financiera Rural", facultad: "Ciencias Económicas", aprobado: 28000000, ejecutado: 17360000, rubros: 4 },
  { nombre: "Producción Sostenible Cacao", facultad: "Agropecuarias", aprobado: 35200000, ejecutado: 32032000, rubros: 5 },
  { nombre: "TIC en Educación Básica", facultad: "Educación", aprobado: 18000000, ejecutado: 8100000, rubros: 3 },
  { nombre: "Identidades Culturales Sinú", facultad: "Ciencias Sociales", aprobado: 22000000, ejecutado: 21340000, rubros: 4 },
  { nombre: "Salud Mental Universitaria", facultad: "Salud", aprobado: 16500000, ejecutado: 3630000, rubros: 3 },
];

const COMPRAS = [
  { id: "SOL-2025-048", descripcion: "Estación meteorológica portátil HOBO", proyecto: "Modelación Hídrica", valor: "$8.200.000", estado: "active" as const, fecha: "12 Jul 2025" },
  { id: "SOL-2025-047", descripcion: "Licencias software SPSS x5 usuarios", proyecto: "Inclusión Financiera", valor: "$3.450.000", estado: "pending" as const, fecha: "08 Jul 2025" },
  { id: "SOL-2025-046", descripcion: "Kit análisis de suelos y foliar", proyecto: "Producción Cacao", valor: "$2.100.000", estado: "closed" as const, fecha: "30 Jun 2025" },
  { id: "SOL-2025-045", descripcion: "Tablets Samsung para trabajo de campo", proyecto: "TIC Educación", valor: "$6.800.000", estado: "evaluation" as const, fecha: "28 Jun 2025" },
];

const MOVILIDAD = [
  { investigador: "Carlos Mejía", evento: "Congreso Hidrología Andina", ciudad: "Medellín", fecha: "22-25 Ago 2025", valor: "$1.850.000", estado: "active" as const },
  { investigador: "Ana Restrepo", evento: "Simposio Cacao Sostenible", ciudad: "Bogotá", fecha: "10-12 Sep 2025", valor: "$2.100.000", estado: "pending" as const },
  { investigador: "María Torres", evento: "Congreso Ciencias Sociales", ciudad: "Barranquilla", fecha: "15-17 Oct 2025", valor: "$1.200.000", estado: "pending" as const },
];

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function PresupuestoTab() {
  const totalAprobado = PROYECTOS_FINANCIERO.reduce((s, p) => s + p.aprobado, 0);
  const totalEjecutado = PROYECTOS_FINANCIERO.reduce((s, p) => s + p.ejecutado, 0);
  const pctGlobal = Math.round((totalEjecutado / totalAprobado) * 100);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card padding={false}>
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Ejecución por Rubro Agregado</h3>
            <p className="text-xs text-[#637068]">Millones COP — Todos los proyectos activos</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={RUBROS_DATA} margin={{ left: -10, right: 10, top: 5, bottom: 5 }} barCategoryGap="35%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F4F0" />
              <XAxis dataKey="rubro" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9BAD9F" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9BAD9F" }} tickFormatter={(v) => `$${v}M`} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }}
                formatter={(v: number) => [`$${v}M`]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="aprobado" name="Aprobado" fill="#DDE4DF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ejecutado" name="Ejecutado" radius={[4, 4, 0, 0]}>
                {RUBROS_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Summary */}
        <Card>
          <h3 className="text-sm font-semibold text-[#1A2B22] mb-4">Resumen Global de Ejecución</h3>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-xs text-[#637068]">Total aprobado</p>
              <p className="text-2xl font-bold text-[#1A2B22]">{formatCOP(totalAprobado)}</p>
            </div>
            <div className="text-3xl font-bold text-[#1E6B3C]">{pctGlobal}%</div>
          </div>
          <ProgressBar value={pctGlobal} color="green" />
          <div className="flex justify-between text-xs mt-2 mb-5">
            <span className="text-[#1E6B3C] font-semibold">Ejecutado: {formatCOP(totalEjecutado)}</span>
            <span className="text-[#637068]">Disponible: {formatCOP(totalAprobado - totalEjecutado)}</span>
          </div>

          <div className="space-y-3">
            {PROYECTOS_FINANCIERO.map((p) => {
              const pct = Math.round((p.ejecutado / p.aprobado) * 100);
              return (
                <div key={p.nombre}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[#1A2B22] truncate max-w-[200px]">{p.nombre}</span>
                    <span className="text-xs font-bold text-[#1E6B3C]">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={pct >= 80 ? "green" : pct >= 50 ? "gold" : "blue"} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tabla proyectos */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-[#DDE4DF]">
          <h3 className="text-sm font-semibold text-[#1A2B22]">Ejecución por Proyecto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDE4DF]">
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#637068] uppercase tracking-wide">Proyecto</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Aprobado</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Ejecutado</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Disponible</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide w-40">Ejecución</th>
              </tr>
            </thead>
            <tbody>
              {PROYECTOS_FINANCIERO.map((p) => {
                const pct = Math.round((p.ejecutado / p.aprobado) * 100);
                return (
                  <tr key={p.nombre} className="border-b border-[#F2F5F3] hover:bg-[#FAFFFE] cursor-pointer">
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-semibold text-[#1A2B22]">{p.nombre}</p>
                      <p className="text-xs text-[#637068]">{p.facultad} · {p.rubros} rubros</p>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#1A2B22]">{formatCOP(p.aprobado)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#1E6B3C]">{formatCOP(p.ejecutado)}</td>
                    <td className="py-3.5 px-4 text-right text-[#637068]">{formatCOP(p.aprobado - p.ejecutado)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} color={pct >= 80 ? "green" : pct >= 50 ? "gold" : "blue"} />
                        <span className="text-xs font-bold text-[#1E6B3C] w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ComprasTab() {
  return (
    <Card padding={false}>
      <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A2B22]">Solicitudes de Compra</h3>
        <Button variant="primary" size="sm">+ Nueva Solicitud</Button>
      </div>
      <div className="divide-y divide-[#F2F5F3]">
        {COMPRAS.map((c) => (
          <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFFFE]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-[#637068]">{c.id}</span>
                <Badge variant={c.estado} />
              </div>
              <p className="text-sm font-semibold text-[#1A2B22]">{c.descripcion}</p>
              <p className="text-xs text-[#637068]">{c.proyecto} · {c.fecha}</p>
            </div>
            <span className="text-base font-bold text-[#1E6B3C]">{c.valor}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm">Ver</Button>
              {c.estado === "pending" && <Button variant="primary" size="sm">Aprobar</Button>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MovilidadTab() {
  return (
    <Card padding={false}>
      <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A2B22]">Solicitudes de Movilidad Académica</h3>
        <Button variant="primary" size="sm">+ Solicitar Movilidad</Button>
      </div>
      <div className="divide-y divide-[#F2F5F3]">
        {MOVILIDAD.map((m, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFFFE]">
            <div className="w-10 h-10 rounded-xl bg-[#EBF5EF] flex items-center justify-center text-xl flex-shrink-0">✈️</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-[#1A2B22]">{m.investigador}</p>
                <Badge variant={m.estado} />
              </div>
              <p className="text-xs text-[#637068]">{m.evento}</p>
              <p className="text-xs text-[#9BAD9F]">{m.ciudad} · {m.fecha}</p>
            </div>
            <span className="text-base font-bold text-[#1E6B3C]">{m.valor}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm">Ver detalle</Button>
              {m.estado === "pending" && <Button variant="primary" size="sm">Aprobar aval</Button>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Financiero() {
  const [tab, setTab] = useState("presupuesto");

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Gestión Financiera"
        subtitle="Control de presupuesto, compras, movilidad y ejecución financiera"
        breadcrumb={["NOUS", "Financiero"]}
        actions={
          <>
            <Button variant="outline" size="sm">Exportar Informe</Button>
            <Button variant="primary" size="sm">Generar Reporte</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Presupuesto Total" value="$380M" sub="47 proyectos activos" color="green"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4l3 3" /></svg>}
        />
        <KpiCard title="Monto Ejecutado" value="$312M" sub="82% del presupuesto" color="gold" trend={{ value: "+6% este mes", up: true }}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>}
        />
        <KpiCard title="Saldo Disponible" value="$68M" sub="18% del presupuesto" color="blue"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 9v1" /></svg>}
        />
        <KpiCard title="Solicitudes Pendientes" value="8" sub="3 compras · 3 movilidad" color="purple"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
      </div>

      <Tabs
        tabs={[
          { id: "presupuesto", label: "Presupuesto" },
          { id: "compras", label: "Compras y Adquisiciones" },
          { id: "movilidad", label: "Movilidad Académica" },
          { id: "ejecucion", label: "Ejecución Financiera" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "presupuesto" && <PresupuestoTab />}
      {tab === "compras" && <ComprasTab />}
      {tab === "movilidad" && <MovilidadTab />}
      {tab === "ejecucion" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label:"Total Gastos Registrados", value:"$289.6M", sub:"312 comprobantes", color:"#1E6B3C" },
              { label:"Gastos sin legalizar", value:"$22.4M", sub:"18 pendientes", color:"#D97706" },
              { label:"Alertas de saldo", value:"3", sub:"Rubros al límite", color:"#DC2626" },
              { label:"Última actualización", value:"Hoy", sub:"09:14 am", color:"#2563EB" },
            ].map(s=>(
              <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4">
                <p className="text-xl font-bold" style={{color:s.color}}>{s.value}</p>
                <p className="text-sm font-medium text-[#1A2B22]">{s.label}</p>
                <p className="text-xs text-[#637068] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1A2B22]">Registro de Gastos y Comprobantes</h3>
              <Button variant="primary" size="sm">+ Registrar Gasto</Button>
            </div>
            <div className="divide-y divide-[#F2F5F3]">
              {[
                { id:"GAS-2025-312", desc:"Pago honorarios investigador principal — julio 2025", proyecto:"Modelación Hídrica", valor:"$2.500.000", rubro:"Personal", fecha:"31 Jul 2025", estado:"closed" as const },
                { id:"GAS-2025-311", desc:"Adquisición estación meteorológica HOBO MX2001", proyecto:"Modelación Hídrica", valor:"$8.200.000", rubro:"Equipos", fecha:"28 Jul 2025", estado:"closed" as const },
                { id:"GAS-2025-310", desc:"Viáticos congreso hidrología — Carlos Mejía", proyecto:"Modelación Hídrica", valor:"$1.850.000", rubro:"Viajes", fecha:"25 Jul 2025", estado:"active" as const },
                { id:"GAS-2025-309", desc:"Pago encuestadores trabajo de campo rural", proyecto:"Inclusión Financiera", valor:"$1.200.000", rubro:"Personal", fecha:"22 Jul 2025", estado:"pending" as const },
                { id:"GAS-2025-308", desc:"Insumos análisis suelos — kit muestras", proyecto:"Producción Cacao", valor:"$780.000", rubro:"Materiales", fecha:"18 Jul 2025", estado:"closed" as const },
              ].map((g,i)=>(
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFFFE] group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-[#9BAD9F]">{g.id}</span>
                      <Badge variant={g.estado} />
                    </div>
                    <p className="text-sm font-semibold text-[#1A2B22]">{g.desc}</p>
                    <p className="text-xs text-[#637068]">{g.proyecto} · {g.rubro} · {g.fecha}</p>
                  </div>
                  <span className="text-sm font-bold text-[#1E6B3C]">{g.valor}</span>
                  <Button variant="ghost" size="sm">Ver soporte</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
