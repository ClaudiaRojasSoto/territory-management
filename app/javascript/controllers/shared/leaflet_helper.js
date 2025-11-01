// Utilidades para trabajar con Leaflet
// Este archivo contiene funciones auxiliares para inicializar y configurar mapas

export class LeafletHelper {
  // Crea un mapa básico con configuración por defecto
  static createMap(containerId, options = {}) {
    const defaults = {
      lat: -27.3668,
      lng: -70.3314,
      zoom: 16,
      minZoom: 10,
      maxZoom: 19
    }
    
    const config = { ...defaults, ...options }
    
    const map = L.map(containerId).setView([config.lat, config.lng], config.zoom)
    
    // Agregar capa de OpenStreetMap
    this.addTileLayer(map)
    
    return map
  }
  
  // Agrega la capa de tiles de OpenStreetMap
  static addTileLayer(map) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)
    
    return map
  }
  
  // Crea un control de dibujo para Leaflet
  static createDrawControl(featureGroup, options = {}) {
    const defaults = {
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> El polígono no puede intersectarse consigo mismo'
          },
          shapeOptions: {
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.3
          }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: featureGroup,
        remove: true
      }
    }
    
    const config = { ...defaults, ...options }
    
    return new L.Control.Draw(config)
  }
  
  // Estilos predefinidos por tipo de territorio
  static getStyleByStatus(status) {
    const styles = {
      available: {
        color: '#28a745',
        fillColor: '#28a745',
        fillOpacity: 0.3,
        weight: 2
      },
      assigned: {
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.3,
        weight: 2
      },
      completed: {
        color: '#6c757d',
        fillColor: '#6c757d',
        fillOpacity: 0.3,
        weight: 2
      },
      returned: {
        color: '#ffc107',
        fillColor: '#ffc107',
        fillOpacity: 0.3,
        weight: 2
      },
      main_congregation: {
        color: '#ffc107',
        fillColor: '#ffc107',
        fillOpacity: 0.2,
        weight: 4
      },
      default: {
        color: '#6c757d',
        fillColor: '#6c757d',
        fillOpacity: 0.3,
        weight: 2
      }
    }
    
    return styles[status] || styles.default
  }
  
  // Convierte un layer de Leaflet a GeoJSON
  static layerToGeoJSON(layer) {
    return layer.toGeoJSON()
  }
  
  // Centra el mapa en una geometría
  static fitBounds(map, geoJSON) {
    const layer = L.geoJSON(geoJSON)
    const bounds = layer.getBounds()
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }
  
  // Remueve todas las capas excepto la base (tiles)
  static clearLayers(map, exceptTileLayer = true) {
    map.eachLayer((layer) => {
      if (exceptTileLayer && layer instanceof L.TileLayer) {
        return // Mantener la capa de tiles
      }
      map.removeLayer(layer)
    })
  }
  
  // Crea un popup con contenido HTML
  static createPopup(content, options = {}) {
    const defaults = {
      maxWidth: 300,
      className: 'custom-popup'
    }
    
    return L.popup({ ...defaults, ...options }).setContent(content)
  }
  
  // Obtiene el centro de un GeoJSON
  static getCenter(geoJSON) {
    const layer = L.geoJSON(geoJSON)
    const bounds = layer.getBounds()
    
    if (bounds.isValid()) {
      const center = bounds.getCenter()
      return { lat: center.lat, lng: center.lng }
    }
    
    return null
  }
}

