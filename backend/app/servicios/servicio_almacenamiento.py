"""Servicio de almacenamiento — wrapper MinIO para archivos."""

import io
from datetime import timedelta

from minio import Minio

from app.configuracion import obtener_configuracion
from app.registro import logger


class ServicioAlmacenamiento:
    """Wrapper MinIO para subir/descargar archivos."""

    _cliente: Minio | None = None

    @classmethod
    def _obtener_cliente(cls) -> Minio:
        """Obtiene o crea el cliente MinIO (singleton)."""
        if cls._cliente is None:
            config = obtener_configuracion()
            cls._cliente = Minio(
                config.minio_endpoint,
                access_key=config.minio_access_key,
                secret_key=config.minio_secret_key,
                secure=config.minio_secure,
            )
        return cls._cliente

    @classmethod
    def inicializar_bucket(cls) -> None:
        """Crea el bucket si no existe. Llamar en startup."""
        config = obtener_configuracion()
        cliente = cls._obtener_cliente()
        if not cliente.bucket_exists(config.minio_bucket):
            cliente.make_bucket(config.minio_bucket)
            logger.info("Bucket '%s' creado en MinIO", config.minio_bucket)
        else:
            logger.info("Bucket '%s' ya existe en MinIO", config.minio_bucket)

    @classmethod
    def subir_bytes(cls, datos: bytes, objeto_key: str, content_type: str = "audio/mpeg") -> str:
        """Sube bytes a MinIO y retorna el key."""
        config = obtener_configuracion()
        cliente = cls._obtener_cliente()
        cliente.put_object(
            config.minio_bucket,
            objeto_key,
            io.BytesIO(datos),
            length=len(datos),
            content_type=content_type,
        )
        logger.info("Archivo subido a MinIO: %s", objeto_key)
        return objeto_key

    @classmethod
    def obtener_url(cls, objeto_key: str, expiracion: int = 3600) -> str:
        """Genera URL presigned para descargar un archivo."""
        config = obtener_configuracion()
        cliente = cls._obtener_cliente()
        url = cliente.presigned_get_object(
            config.minio_bucket,
            objeto_key,
            expires=timedelta(seconds=expiracion),
        )
        return url
