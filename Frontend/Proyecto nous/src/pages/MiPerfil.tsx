import React, { useState } from "react";
import { PageHeader, Card, SectionTitle, Badge, Button, Modal, Field, Input } from "@/components/ui";
import { type UsuarioMe, authApi } from "@/services/api";
import { TEXTO_POLITICA_REGISTRO } from "./Login";

export function MiPerfil({ user, onUserUpdated }: { user?: UsuarioMe | null; onUserUpdated?: () => void }) {
  const [modalMfaOpen, setModalMfaOpen] = useState(false);
  const [mfaData, setMfaData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [totpInput, setTotpInput] = useState("");
  const [errorMfa, setErrorMfa] = useState("");

  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [errorPass, setErrorPass] = useState("");
  const [exitoPass, setExitoPass] = useState(false);

  const [modalPoliticaOpen, setModalPoliticaOpen] = useState(false);

  const handleActivarMfa = async () => {
    try {
      setErrorMfa("");
      const data = await authApi.setupMfa();
      setMfaData(data);
      setModalMfaOpen(true);
    } catch (err: any) {
      setErrorMfa(err.message || "Error al solicitar MFA");
      setModalMfaOpen(true);
    }
  };

  const confirmarMfa = async () => {
    try {
      setErrorMfa("");
      await authApi.verifyMfa(totpInput);
      setModalMfaOpen(false);
      setTotpInput("");
      setMfaData(null);
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      setErrorMfa(err.message || "Código inválido");
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass("");
    setExitoPass(false);

    if (passwordNueva !== passwordConfirmacion) {
      setErrorPass("Las contraseñas nuevas no coinciden");
      return;
    }
    try {
      await authApi.cambiarPassword(passwordActual, passwordNueva);
      setExitoPass(true);
      setTimeout(() => {
        setModalPasswordOpen(false);
        setPasswordActual("");
        setPasswordNueva("");
        setPasswordConfirmacion("");
        setExitoPass(false);
      }, 2000);
    } catch (err: any) {
      setErrorPass(err.message || "Error al cambiar la contraseña");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Mi Perfil" />

      <Card>
        <SectionTitle>Datos Personales</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-theme-text-muted mb-1">Nombre completo</label>
            <div className="p-2 bg-theme-bg-main border border-theme-border rounded-md text-theme-text-main">
              {user?.nombre_completo || user?.nombre || "-"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text-muted mb-1">Correo institucional</label>
            <div className="p-2 bg-theme-bg-main border border-theme-border rounded-md text-theme-text-main">
              {user?.correo_institucional || user?.correo || "-"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text-muted mb-1">Cédula</label>
            <div className="p-2 bg-theme-bg-main border border-theme-border rounded-md text-theme-text-main">
              {user?.cedula || "No registrada"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Roles Asignados</SectionTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          {user?.roles?.length ? (
            user.roles.map(r => (
              <Badge key={r} variant="info" className="capitalize">{r}</Badge>
            ))
          ) : (
            <span className="text-theme-text-muted text-sm">Sin roles asignados</span>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>Seguridad</SectionTitle>
        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-text-main">Autenticación Multifactor (MFA)</p>
              <p className="text-xs text-theme-text-muted">Protege tu cuenta con un segundo paso de verificación.</p>
            </div>
            <div>
              {user?.mfa_habilitado ? (
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-sm font-medium">Activado</span>
                  {/* Desactivar MFA no estaba en el API authApi, lo omitimos si no existe o creamos un placeholder */}
                  <Button variant="outline" onClick={() => alert("Comuníquese con soporte para desactivar MFA")}>Desactivar</Button>
                </div>
              ) : (
                <Button variant="primary" onClick={handleActivarMfa}>Activar MFA</Button>
              )}
            </div>
          </div>

          {!!user?.tiene_password && (
            <div className="border-t border-theme-border pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-main">Contraseña</p>
                <p className="text-xs text-theme-text-muted">Actualiza la contraseña de tu cuenta local.</p>
              </div>
              <Button variant="outline" onClick={() => setModalPasswordOpen(true)}>Cambiar contraseña</Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>Tratamiento de Datos Personales</SectionTitle>
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-theme-text-main">
              Fecha de aceptación: <strong>{user?.fecha_aceptacion_datos ? new Date(user.fecha_aceptacion_datos).toLocaleDateString() : "No registrada"}</strong>
            </p>
          </div>
          <button onClick={() => setModalPoliticaOpen(true)} className="text-sm text-theme-primary hover:underline font-medium text-left">
            Ver política completa
          </button>
        </div>
      </Card>

      {/* MODAL MFA */}
      {modalMfaOpen && (
        <Modal open={true} title="Configurar Autenticación Multifactor" onClose={() => setModalMfaOpen(false)}>
          <div className="space-y-4">
            {errorMfa && <p className="text-red-600 text-sm">{errorMfa}</p>}
            {mfaData ? (
              <>
                <p className="text-sm text-theme-text-muted">1. Escanea este código QR con tu aplicación autenticadora (Google Authenticator, Authy, etc).</p>
                <div className="flex justify-center p-4 bg-white rounded-lg"><img src={mfaData.qrCode} alt="QR Code" className="w-48 h-48" /></div>
                <p className="text-xs text-center text-theme-text-muted">O ingresa el código manual: <strong className="font-mono">{mfaData.secret}</strong></p>
                <div className="border-t border-theme-border pt-4">
                  <p className="text-sm text-theme-text-muted mb-2">2. Ingresa el código de 6 dígitos generado:</p>
                  <Input value={totpInput} onChange={setTotpInput} placeholder="Ej: 123456" maxLength={6} className="text-center text-lg tracking-widest font-mono" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setModalMfaOpen(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={confirmarMfa} disabled={totpInput.length < 6}>Confirmar y Activar</Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-theme-text-muted">Cargando...</p>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL PASSWORD */}
      {modalPasswordOpen && (
        <Modal open={true} title="Cambiar Contraseña" onClose={() => setModalPasswordOpen(false)}>
          <form onSubmit={handleCambiarPassword} className="space-y-4">
            {errorPass && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{errorPass}</div>}
            {exitoPass && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md">Contraseña actualizada exitosamente.</div>}
            
            <Field label="Contraseña actual">
              <Input type="password" value={passwordActual} onChange={setPasswordActual} required />
            </Field>
            <Field label="Nueva contraseña">
              <Input type="password" value={passwordNueva} onChange={setPasswordNueva} required minLength={8} />
            </Field>
            <Field label="Confirmar nueva contraseña">
              <Input type="password" value={passwordConfirmacion} onChange={setPasswordConfirmacion} required minLength={8} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setModalPasswordOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit" disabled={!passwordActual || passwordNueva.length < 8 || passwordConfirmacion.length < 8}>Guardar Cambios</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL POLITICA */}
      {modalPoliticaOpen && (
        <Modal open={true} title="Política de Tratamiento de Datos Personales" onClose={() => setModalPoliticaOpen(false)} size="xl">
          <div className="max-h-96 overflow-y-auto p-4 bg-theme-bg-main border border-theme-border rounded-md">
            <p className="text-sm text-theme-text-main whitespace-pre-wrap">{TEXTO_POLITICA_REGISTRO}</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="primary" onClick={() => setModalPoliticaOpen(false)}>Cerrar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
