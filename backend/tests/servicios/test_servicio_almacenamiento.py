"""Tests para ServicioAlmacenamiento."""

from unittest.mock import MagicMock, patch

import pytest

from app.servicios.servicio_almacenamiento import ServicioAlmacenamiento


class TestKeyPattern:
    """Tests para el patrón de keys de MinIO."""

    def test_key_podcast_formato(self):
        """El key de podcast sigue el patrón esperado."""
        import uuid
        from datetime import date

        uid = uuid.uuid4()
        fecha = date(2026, 3, 23)
        momento = "manana"
        key = f"podcasts/{uid}/{fecha.isoformat()}/{momento}.mp3"

        assert key.startswith("podcasts/")
        assert "2026-03-23" in key
        assert key.endswith("/manana.mp3")


class TestSubirArchivo:
    """Tests para subir_bytes con mock del cliente MinIO."""

    def test_subir_bytes_llama_put_object(self):
        """subir_bytes invoca put_object en el cliente MinIO."""
        with patch.object(ServicioAlmacenamiento, "_obtener_cliente") as mock_cliente:
            mock_minio = MagicMock()
            mock_cliente.return_value = mock_minio

            with patch(
                "app.servicios.servicio_almacenamiento.obtener_configuracion"
            ) as mock_config:
                mock_config.return_value = MagicMock(minio_bucket="test-bucket")

                datos = b"datos de audio mp3 simulados"
                key = "podcasts/uid/2026-03-23/manana.mp3"
                resultado = ServicioAlmacenamiento.subir_bytes(datos, key)

                assert resultado == key
                mock_minio.put_object.assert_called_once()
                args = mock_minio.put_object.call_args
                assert args[0][0] == "test-bucket"
                assert args[0][1] == key

    def test_obtener_url_genera_presigned(self):
        """obtener_url genera URL presigned."""
        with patch.object(ServicioAlmacenamiento, "_obtener_cliente") as mock_cliente:
            mock_minio = MagicMock()
            mock_minio.presigned_get_object.return_value = "http://minio:9002/test/key"
            mock_cliente.return_value = mock_minio

            with patch(
                "app.servicios.servicio_almacenamiento.obtener_configuracion"
            ) as mock_config:
                mock_config.return_value = MagicMock(minio_bucket="test-bucket")

                url = ServicioAlmacenamiento.obtener_url("podcasts/uid/2026-03-23/manana.mp3")
                assert "minio" in url
                mock_minio.presigned_get_object.assert_called_once()


class TestInicializarBucket:
    """Tests para inicializar_bucket."""

    def test_crea_bucket_si_no_existe(self):
        """Si el bucket no existe, lo crea."""
        with patch.object(ServicioAlmacenamiento, "_obtener_cliente") as mock_cliente:
            mock_minio = MagicMock()
            mock_minio.bucket_exists.return_value = False
            mock_cliente.return_value = mock_minio

            with patch(
                "app.servicios.servicio_almacenamiento.obtener_configuracion"
            ) as mock_config:
                mock_config.return_value = MagicMock(minio_bucket="astra-podcasts")

                ServicioAlmacenamiento.inicializar_bucket()
                mock_minio.make_bucket.assert_called_once_with("astra-podcasts")

    def test_no_crea_si_ya_existe(self):
        """Si el bucket ya existe, no lo crea."""
        with patch.object(ServicioAlmacenamiento, "_obtener_cliente") as mock_cliente:
            mock_minio = MagicMock()
            mock_minio.bucket_exists.return_value = True
            mock_cliente.return_value = mock_minio

            with patch(
                "app.servicios.servicio_almacenamiento.obtener_configuracion"
            ) as mock_config:
                mock_config.return_value = MagicMock(minio_bucket="astra-podcasts")

                ServicioAlmacenamiento.inicializar_bucket()
                mock_minio.make_bucket.assert_not_called()
