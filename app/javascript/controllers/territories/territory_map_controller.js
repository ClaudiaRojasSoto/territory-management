import { Controller } from "@hotwired/stimulus"
import { LeafletHelper } from "../shared/leaflet_helper"

// Connects to data-controller="territories--territory-map"
export default class extends Controller {
  connect() {
    this.territories = []
  }
  
  render(territories) {
    const map = window.territoryMap
    if (!map) {
      console.warn('Map not ready yet')
      return
    }
    
    this.territories = territories
    this.clearTerritories()
    this.renderTerritories()
  }
  
  clearTerritories() {
    const map = window.territoryMap
    if (!map) return
    
    // Clear existing territory layers
    map.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties && layer.feature.properties.type === 'territory') {
        map.removeLayer(layer)
      }
    })
  }
  
  renderTerritories() {
    const map = window.territoryMap
    if (!map) return
    
    this.territories.forEach(territory => {
      this.renderTerritory(territory)
    })
  }
  
  renderTerritory(territory) {
    const map = window.territoryMap
    if (!map) return
    
    const layer = L.geoJSON(territory, {
      style: (feature) => this.getTerritoryStyle(feature),
      onEachFeature: (feature, layer) => this.setupTerritoryFeature(feature, layer)
    })
    
    layer.addTo(map)
  }
  
  getTerritoryStyle(feature) {
    const status = feature.properties.status
    const baseStyles = LeafletHelper.getStyleByStatus(status)
    
    // Override with specific territory styles
    return {
      ...baseStyles,
      color: '#000',
      opacity: 1,
      fillOpacity: 0.6
    }
  }
  
  setupTerritoryFeature(feature, layer) {
    const properties = feature.properties
    
    // Create popup content
    const popupContent = `
      <div class="territory-popup">
        <h6 class="mb-2">
          ${properties.number ? `#${properties.number} - ` : ''}
          ${properties.name}
        </h6>
        <p class="mb-1">
          <strong>Estado:</strong> ${this.translateStatus(properties.status)}
        </p>
        <p class="mb-1">
          <strong>Área:</strong> ${properties.area} acres
        </p>
        <p class="mb-1">
          <strong>Asignado a:</strong> ${properties.assigned_to || 'Sin asignar'}
        </p>
      </div>
    `
    
    layer.bindPopup(popupContent)
    
    // Mark as territory for easy identification
    layer.feature = { 
      ...layer.feature,
      properties: { 
        ...properties,
        type: 'territory' 
      } 
    }
    
    // Add hover effects
    layer.on('mouseover', () => {
      layer.setStyle({
        weight: 3,
        fillOpacity: 0.8
      })
    })
    
    layer.on('mouseout', () => {
      layer.setStyle(this.getTerritoryStyle(feature))
    })
  }
  
  translateStatus(status) {
    const translations = {
      'available': 'Disponible',
      'assigned': 'Asignado',
      'completed': 'Completado',
      'returned': 'Devuelto'
    }
    
    return translations[status] || status
  }
  
  // Highlight specific territory
  highlightTerritory(territoryId) {
    const map = window.territoryMap
    if (!map) return
    
    map.eachLayer((layer) => {
      if (layer.feature && 
          layer.feature.properties && 
          layer.feature.properties.type === 'territory' &&
          layer.feature.properties.id === territoryId) {
        
        // Highlight this territory
        layer.setStyle({
          weight: 4,
          color: '#ff0000',
          fillOpacity: 0.8
        })
        
        // Open popup
        layer.openPopup()
        
        // Reset after a delay
        setTimeout(() => {
          layer.setStyle(this.getTerritoryStyle(layer.feature))
        }, 3000)
      }
    })
  }
}

