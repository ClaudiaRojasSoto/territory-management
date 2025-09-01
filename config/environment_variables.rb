# Configuración de variables de entorno
# Copia este archivo a .env y configura tus valores

# Configuración de Mapas
# La aplicación usa Leaflet + OpenStreetMap (gratuito)
# No se requiere configuración adicional

# Configuración de la base de datos (opcional, se puede configurar en database.yml)
DATABASE_URL=postgresql://usuario:password@localhost:5432/territory_app_development

# Configuración de Redis (para Sidekiq)
REDIS_URL=redis://localhost:6379/0

# Configuración de la aplicación
RAILS_ENV=development
SECRET_KEY_BASE=tu_secret_key_base_aqui 