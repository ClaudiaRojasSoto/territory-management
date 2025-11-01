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
    
    // Add click event to show detail modal
    layer.on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      this.showTerritoryDetail(properties)
    })
  }
  
  showTerritoryDetail(properties) {
    // Update modal title
    const title = `${properties.number ? `#${properties.number} - ` : ''}${properties.name}`
    document.getElementById('territoryDetailTitle').textContent = title
    
    // Update info section
    const infoHtml = `
      <div class="territory-info">
        <p><strong>Estado:</strong> <span class="badge bg-${this.getStatusColor(properties.status)}">${this.translateStatus(properties.status)}</span></p>
        <p><strong>Área:</strong> ${properties.area} acres</p>
        <p><strong>Asignado a:</strong> ${properties.assigned_to || 'Sin asignar'}</p>
        ${properties.assigned_at ? `<p><strong>Fecha de asignación:</strong> ${new Date(properties.assigned_at).toLocaleDateString('es-CL')}</p>` : ''}
        <hr>
        <p><strong>ID:</strong> ${properties.id}</p>
        <p><strong>Congregación ID:</strong> ${properties.congregation_id}</p>
      </div>
    `
    document.getElementById('territoryDetailInfo').innerHTML = infoHtml
    
    // Store territory ID for print button
    window.currentDetailTerritoryId = properties.id
    window.currentDetailTerritoryName = properties.name
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('territoryDetailModal'))
    modal.show()
    
    // Initialize map after modal is shown
    document.getElementById('territoryDetailModal').addEventListener('shown.bs.modal', () => {
      this.initDetailMap(properties)
    }, { once: true })
  }
  
  async initDetailMap(properties) {
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
      
      // Draw polygon
      const polygon = L.polygon(coordinates, {
        color: this.getTerritoryStyle({ properties }).color,
        fillColor: this.getTerritoryStyle({ properties }).fillColor,
        fillOpacity: 0.6,
        weight: 3
      }).addTo(detailMap)
      
      // Fit map to polygon
      detailMap.fitBounds(polygon.getBounds(), { padding: [20, 20] })
      
    } catch (error) {
      console.error('Error loading territory details:', error)
      mapContainer.innerHTML = '<p class="text-danger">Error al cargar el mapa</p>'
    }
  }
  
  getStatusColor(status) {
    const colors = {
      'available': 'success',
      'assigned': 'primary',
      'completed': 'info',
      'returned': 'warning'
    }
    return colors[status] || 'secondary'
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

