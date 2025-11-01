import { Controller } from "@hotwired/stimulus"
import apiClient from "../shared/api_client"
import { LeafletHelper } from "../shared/leaflet_helper"

// Connects to data-controller="territories--congregation"
export default class extends Controller {
  static targets = ["filter", "nameLabel"]
  
  static values = {
    currentId: { type: String, default: "" }
  }
  
  static outlets = ["territories--map"]
  
  connect() {
    console.log("Congregation controller connected!")
    this.congregationsById = {}
    this.congregationsHasGeometry = {}
    this.loadCongregations()
  }
  
  async loadCongregations() {
    try {
      const data = await apiClient.get('/congregations')
      this.populateFilter(data)
    } catch (error) {
      console.error('Error loading congregations:', error)
    }
  }
  
  populateFilter(data) {
    const select = this.filterTarget
    select.innerHTML = ''
    
    // Add placeholder option
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = 'Seleccionar congregación'
    select.appendChild(placeholder)
    
    // Filter and process congregations
    const features = (data || []).filter(feature => feature && feature.geometry)
    
    features.forEach(feature => {
      const opt = document.createElement('option')
      opt.value = feature.properties.id
      opt.textContent = feature.properties.name
      select.appendChild(opt)
      
      // Store congregation data
      this.congregationsById[String(feature.properties.id)] = feature.properties.name || ''
      this.congregationsHasGeometry[String(feature.properties.id)] = !!feature.geometry
    })
    
    // Make data globally available (temporary, for compatibility)
    window.congregationsById = this.congregationsById
    window.congregationsHasGeometry = this.congregationsHasGeometry
    
    // Reset selection if current is not present anymore
    if (this.currentIdValue && !this.congregationsById[this.currentIdValue]) {
      this.currentIdValue = ""
      select.value = ''
    } else if (this.currentIdValue) {
      select.value = this.currentIdValue
      
      // Load polygon if has geometry
      if (this.congregationsHasGeometry[this.currentIdValue]) {
        this.loadPolygon()
      }
    }
  }
  
  // Handle congregation filter change
  change(event) {
    this.currentIdValue = event.target.value || ""
    window.currentCongregationId = this.currentIdValue // Temporary for compatibility
    
    // Clear demarcation and previous main polygon when switching congregations
    if (typeof clearDemarcation === 'function') {
      clearDemarcation()
    }
    
    // Clear main layer group
    if (window.mainLayerGroup) {
      window.mainLayerGroup.clearLayers()
    }
    
    // Update labels
    this.updateLabels()
    
    // Only draw map and show controls if congregation has geometry
    const hasGeom = this.currentIdValue && this.congregationsHasGeometry[this.currentIdValue]
    
    if (hasGeom) {
      this.loadPolygon()
    } else {
      // Hide controls if no geometry yet
      const controls = document.getElementById('main-territory-controls')
      if (controls) {
        controls.style.display = 'none'
      }
    }
    
    // Load territories for this congregation
    if (typeof loadTerritories === 'function') {
      loadTerritories()
    }
  }
  
  updateLabels() {
    const name = this.currentIdValue 
      ? (this.congregationsById[this.currentIdValue] || 'Zona Principal') 
      : 'Zona Principal'
    
    // Update main label
    if (this.hasNameLabelTarget) {
      this.nameLabelTarget.textContent = name
    }
    
    // Update button labels
    const labelIds = ['btn-save-name', 'btn-edit-name', 'btn-print-name', 'btn-delete-name']
    labelIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) {
        el.textContent = name
      }
    })
  }
  
  async loadPolygon() {
    if (!this.currentIdValue) return
    
    try {
      const feature = await apiClient.get(`/congregations/${this.currentIdValue}`)
      this.renderPolygon(feature)
    } catch (error) {
      console.error('Error loading congregation polygon:', error)
    }
  }
  
  renderPolygon(feature) {
    const map = window.territoryMap
    const mainLayerGroup = window.mainLayerGroup
    
    if (!map || !mainLayerGroup) {
      console.warn('Map not ready yet')
      return
    }
    
    // Remove previous layers
    mainLayerGroup.clearLayers()
    
    // Also remove any lingering main_congregation layers added directly to map (defensive)
    map.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties && layer.feature.properties.type === 'main_congregation') {
        map.removeLayer(layer)
      }
    })
    
    if (!feature || !feature.geometry) return
    
    // Store feature globally (temporary for compatibility)
    window.mainCongregationFeature = feature
    
    // Create and add layer
    const geoJsonLayer = L.geoJSON(feature, {
      style: LeafletHelper.getStyleByStatus('main_congregation'),
      onEachFeature: (f, layer) => {
        layer.feature = { properties: { type: 'main_congregation' } }
      }
    })
    
    window.mainTerritoryLayer = geoJsonLayer.addTo(mainLayerGroup)
    
    // Center map on congregation
    if (feature.properties && feature.properties.center) {
      map.setView([feature.properties.center.lat, feature.properties.center.lng], 15)
    }
    
    // Update labels
    const name = feature.properties && feature.properties.name ? feature.properties.name : 'Zona Principal'
    
    const nameLabelEl = document.getElementById('congregation-name-label')
    if (nameLabelEl) nameLabelEl.textContent = name
    
    const labelIds = ['btn-save-name', 'btn-edit-name', 'btn-print-name', 'btn-delete-name']
    labelIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) el.textContent = name
    })
    
    // Show controls
    const controls = document.getElementById('main-territory-controls')
    if (controls) {
      controls.style.display = 'block'
    }
  }
  
  // Public method to get current congregation ID
  getCurrentId() {
    return this.currentIdValue
  }
  
  // Public method to get congregation name
  getCurrentName() {
    return this.currentIdValue ? this.congregationsById[this.currentIdValue] : null
  }
}

