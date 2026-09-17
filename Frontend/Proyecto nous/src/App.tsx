import React, { useState } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { Header } from "./components/Header";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Proyectos } from "./pages/Proyectos";
import { Convocatorias } from "./pages/Convocatorias";
import { Evaluaciones } from "./pages/Evaluaciones";
import { Seguimiento } from "./pages/Seguimiento";
import { Financiero } from "./pages/Financiero";
import { Reportes } from "./pages/Reportes";
import { Semilleros } from "./pages/Semilleros";
import { Administracion } from "./pages/Administracion";
import { Documentos, Productos, Grupos, Movilidad, Integraciones } from "./pages/OtrasPages";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<Page>("dashboard");

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "convocatorias":
        return <Convocatorias />;
      case "evaluaciones":
        return <Evaluaciones />;
      case "proyectos":
        return <Proyectos />;
      case "seguimiento":
        return <Seguimiento />;
      case "financiero":
        return <Financiero />;
      case "documentos":
        return <Documentos />;
      case "productos":
        return <Productos />;
      case "reportes":
        return <Reportes />;
      case "grupos":
        return <Grupos />;
      case "semilleros":
        return <Semilleros />;
      case "movilidad":
        return <Movilidad />;
      case "integraciones":
        return <Integraciones />;
      case "administracion":
        return <Administracion />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F2F5F3" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header activePage={activePage} onLogout={() => setIsLoggedIn(false)} />
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "#F2F5F3" }}
        >
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
