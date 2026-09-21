# Sincronización de Base de Datos y Migraciones

Esta regla aplica a todos los flujos de trabajo que impliquen traer código de otros desarrolladores o sincronizar ramas de git.

## Cuándo aplicar
- Inmediatamente después de ejecutar un comando `git pull`.
- Cuando el usuario indique que se actualizaron los cambios de sus compañeros.
- Después de restaurar o cambiar de rama (`git checkout`).

## Instrucciones obligatorias
1. **Revisar Migraciones:** Inspeccionar el directorio `Backend/src/db/migrations/` (o equivalentes) en busca de archivos nuevos de migración o creación de tablas que se hayan descargado en la actualización.
2. **Ejecutar Migraciones:** Proponer y ejecutar en la terminal (mediante `node` u otro comando correspondiente) cualquier archivo de migración que parezca nuevo o que el usuario no haya ejecutado localmente aún.
3. **Reiniciar Servidor:** Recordarle al usuario o reiniciar el servidor de backend si hay cambios estructurales que lo requieran para evitar que quede en memoria la versión antigua.
