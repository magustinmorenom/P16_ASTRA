"""Repositorio de usuarios — operaciones CRUD."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.usuario import Usuario


class RepositorioUsuario:
    """Operaciones de base de datos para usuarios."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def crear(
        self,
        email: str,
        nombre: str,
        hash_contrasena: str | None = None,
        proveedor_auth: str = "local",
        google_id: str | None = None,
    ) -> Usuario:
        """Crea un nuevo usuario."""
        usuario = Usuario(
            email=email.lower().strip(),
            nombre=nombre,
            hash_contrasena=hash_contrasena,
            proveedor_auth=proveedor_auth,
            google_id=google_id,
        )
        self.sesion.add(usuario)
        await self.sesion.commit()
        await self.sesion.refresh(usuario)
        return usuario

    async def obtener_por_email(self, email: str) -> Usuario | None:
        """Obtiene un usuario por su email."""
        resultado = await self.sesion.execute(
            select(Usuario).where(Usuario.email == email.lower().strip())
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_id(self, usuario_id: uuid.UUID) -> Usuario | None:
        """Obtiene un usuario por su ID."""
        resultado = await self.sesion.execute(
            select(Usuario).where(Usuario.id == usuario_id)
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_google_id(self, google_id: str) -> Usuario | None:
        """Obtiene un usuario por su Google ID."""
        resultado = await self.sesion.execute(
            select(Usuario).where(Usuario.google_id == google_id)
        )
        return resultado.scalar_one_or_none()

    async def actualizar_ultimo_acceso(self, usuario_id: uuid.UUID) -> None:
        """Actualiza la marca de último acceso."""
        await self.sesion.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(ultimo_acceso=datetime.now(timezone.utc))
        )
        await self.sesion.commit()

    async def cambiar_contrasena(
        self, usuario_id: uuid.UUID, nuevo_hash: str
    ) -> None:
        """Cambia el hash de contraseña de un usuario."""
        await self.sesion.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(hash_contrasena=nuevo_hash)
        )
        await self.sesion.commit()

    async def marcar_verificado(self, usuario_id: uuid.UUID) -> None:
        """Marca la cuenta del usuario como verificada."""
        await self.sesion.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(verificado=True)
        )
        await self.sesion.commit()

    async def desactivar(self, usuario_id: uuid.UUID) -> None:
        """Soft-delete: pone activo=False en un usuario."""
        await self.sesion.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(activo=False)
        )
        await self.sesion.commit()
