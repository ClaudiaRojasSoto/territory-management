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
    
    // Clear existing territory layers and labels
    map.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties) {
        const type = layer.feature.properties.type
        if (type === 'territory' || type === 'territory-label') {
          map.removeLayer(layer)
        }
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
    
    // Remove the text popup - we'll use a modal instead
    
    // Add number label if territory has a number
    if (properties.number && properties.center) {
      this.addNumberLabel(properties)
    }
    
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
    
    // Add click event to show territory map in modal
    layer.on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      this.showTerritoryMapModal(properties)
    })
  }
  
  async showTerritoryMapModal(properties) {
    // Update modal title
    const title = `${properties.number ? `#${properties.number} - ` : ''}${properties.name}`
    document.getElementById('territoryDetailTitle').textContent = title
    
    // Make sure info is hidden and map is full width
    const infoParent = document.getElementById('territoryDetailInfo')?.parentElement
    if (infoParent) {
      infoParent.style.display = 'none'
    }
    
    const mapParent = document.querySelector('#territoryDetailMap')?.parentElement
    if (mapParent) {
      mapParent.className = 'col-12'
    }
    
    // Set map height
    const mapElement = document.getElementById('territoryDetailMap')
    if (mapElement) {
      mapElement.style.height = '500px'
    }
    
    // Store territory ID for print button
    window.currentDetailTerritoryId = properties.id
    window.currentDetailTerritoryName = properties.name
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('territoryDetailModal'))
    modal.show()
    
    // Initialize map after modal is shown
    document.getElementById('territoryDetailModal').addEventListener('shown.bs.modal', async () => {
      await this.initTerritoryDetailMap(properties)
    }, { once: true })
  }
  
  async initTerritoryDetailMap(properties) {
    // Remove existing map if any
    const mapContainer = document.getElementById('territoryDetailMap')
    mapContainer.innerHTML = ''
    
    // Create new map
    const detailMap = L.map('territoryDetailMap')
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(detailMap)
    
    // Fetch territory geometry from API
    try {
      const response = await fetch(`/api/v1/territories/${properties.id}`)
      const territory = await response.json()
      
      const coordinates = territory.geometry.coordinates[0].map(c => [c[1], c[0]])
      
      // Draw polygon with thicker border
      const polygon = L.polygon(coordinates, {
        color: '#000',
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        weight: 3
      }).addTo(detailMap)
      
      // Fit map to polygon with good zoom
      detailMap.fitBounds(polygon.getBounds(), { padding: [30, 30], maxZoom: 18 })
      
    } catch (error) {
      console.error('Error loading territory details:', error)
      mapContainer.innerHTML = '<p class="text-danger">Error al cargar el mapa</p>'
    }
  }
  
  addNumberLabel(properties) {
    const map = window.territoryMap
    if (!map) return
    
    const { lat, lng } = properties.center
    
    // Create a div icon with the number
    const numberIcon = L.divIcon({
      className: 'territory-number-label',
      html: `<div class="number-badge">${properties.number}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
    
    // Add marker to map
    const marker = L.marker([lat, lng], { icon: numberIcon })
    marker.addTo(map)
    
    // Mark it for clearing later
    marker.feature = {
      properties: {
        type: 'territory-label',
        territoryId: properties.id
      }
    }
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

