// Utilities for working with Leaflet
// This file contains helper functions to initialize and configure maps

export class LeafletHelper {
  // Creates a basic map with default configuration
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
    
    // Add OpenStreetMap tile layer
    this.addTileLayer(map)
    
    return map
  }
  
  // Adds OpenStreetMap tile layer
  static addTileLayer(map) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)
    
    return map
  }
  
  // Creates a draw control for Leaflet
  static createDrawControl(featureGroup, options = {}) {
    const defaults = {
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> The polygon cannot intersect itself'
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
  
  // Predefined styles by territory type
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
  
  // Converts a Leaflet layer to GeoJSON
  static layerToGeoJSON(layer) {
    return layer.toGeoJSON()
  }
  
  // Centers the map on a geometry
  static fitBounds(map, geoJSON) {
    const layer = L.geoJSON(geoJSON)
    const bounds = layer.getBounds()
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }
  
  // Removes all layers except the base (tiles)
  static clearLayers(map, exceptTileLayer = true) {
    map.eachLayer((layer) => {
      if (exceptTileLayer && layer instanceof L.TileLayer) {
        return // Keep the tile layer
      }
      map.removeLayer(layer)
    })
  }
  
  // Creates a popup with HTML content
  static createPopup(content, options = {}) {
    const defaults = {
      maxWidth: 300,
      className: 'custom-popup'
    }
    
    return L.popup({ ...defaults, ...options }).setContent(content)
  }
  
  // Gets the center of a GeoJSON
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

