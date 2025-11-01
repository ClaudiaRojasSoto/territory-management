import { Controller } from "@hotwired/stimulus"
import apiClient from "../shared/api_client"

// Connects to data-controller="territories--main-territory"
export default class extends Controller {
  static targets = ["controls", "demarcateBtn", "nameLabel"]
  
  static values = {
    congregationId: { type: String, default: "" },
    isEditing: { type: Boolean, default: false }
  }
  
  connect() {
    console.log("Main territory controller connected!")
    this.demarcationMode = false
    this.demarcationPoints = []
    this.demarcationPolygon = null
    this.demarcationMarkers = [] // Track markers for cleanup
    
    // Expose methods globally for backwards compatibility
    window.demarcateMainTerritory = this.startDemarcation.bind(this)
    window.startDemarcation = this.beginDemarcation.bind(this)
    window.closeInstructions = this.closeInstructions.bind(this)
    window.manualClosePolygon = this.closePolygon.bind(this)
    window.clearDemarcation = this.clearDemarcation.bind(this)
    window.cancelDemarcation = this.cancel.bind(this)
    window.saveMainTerritory = this.save.bind(this)
    window.editMainTerritory = this.edit.bind(this)
    window.deleteMainTerritory = this.delete.bind(this)
  }
  
  // Start demarcation process
  startDemarcation() {
    const map = window.territoryMap
    if (!map) {
      console.error('Map not available')
      return
    }
    
    // Clear any existing main territory
    if (window.mainTerritoryLayer) {
      map.removeLayer(window.mainTerritoryLayer)
    }
    
    // Show instructions modal
    this.showInstructions()
  }
  
  showInstructions() {
    const instructionsDiv = document.createElement('div')
    instructionsDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #ffc107;
      border-radius: 10px;
      padding: 20px;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      max-width: 500px;
      text-align: center;
    `
    
    instructionsDiv.innerHTML = `
      <h4>🗺️ Demarcar Zona Principal</h4>
      <div style="margin: 15px 0; text-align: left;">
        <p><strong>Instrucciones:</strong></p>
        <p>1. Haz clic en el mapa para marcar puntos del límite</p>
        <p>2. Sigue la ruta: Van Buren → Los Loros → Inca → Cerro → Río</p>
        <p>3. Haz clic en "Cerrar Polígono" cuando termines</p>
        <p>4. Haz clic en "Guardar Zona Principal" para guardar</p>
      </div>
      <button id="start-demarcation-btn" class="btn btn-primary" style="margin: 5px;">
        🚀 Iniciar
      </button>
      <button id="cancel-demarcation-btn" class="btn btn-secondary" style="margin: 5px;">
        ❌ Cancelar
      </button>
    `
    
    document.body.appendChild(instructionsDiv)
    this.instructionsDiv = instructionsDiv
    
    // Add event listeners
    const startBtn = instructionsDiv.querySelector('#start-demarcation-btn')
    const cancelBtn = instructionsDiv.querySelector('#cancel-demarcation-btn')
    
    startBtn.addEventListener('click', () => this.beginDemarcation())
    cancelBtn.addEventListener('click', () => this.closeInstructions())
  }
  
  closeInstructions() {
    if (this.instructionsDiv) {
      document.body.removeChild(this.instructionsDiv)
      this.instructionsDiv = null
    }
  }
  
  beginDemarcation() {
    this.closeInstructions()
    
    const map = window.territoryMap
    if (!map) return
    
    // Activate demarcation mode
    this.demarcationMode = true
    this.demarcationPoints = []
    this.demarcationPolygon = null
    
    // Change map cursor
    map.getContainer().style.cursor = 'crosshair'
    
    // Disable map dragging
    map.dragging.disable()
    map.scrollWheelZoom.disable()
    
    // Show info message
    this.showDemarcationInfo()
    
    // Setup click handler
    this.setupClickHandler(map)
    
    // Show control panel
    this.showControlPanel(map)
  }
  
  showDemarcationInfo() {
    const map = window.territoryMap
    const infoDiv = document.createElement('div')
    infoDiv.style.cssText = `
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffc107;
      color: black;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      font-weight: bold;
      text-align: center;
      max-width: 300px;
    `
    
    const isEditing = window.mainTerritoryLayer !== null
    infoDiv.innerHTML = isEditing ? 
      '✏️ <strong>Modo Edición:</strong><br>Haz clic para marcar nuevos puntos' :
      '🗺️ <strong>Modo Demarcación:</strong><br>Haz clic para marcar puntos'
    
    map.getContainer().appendChild(infoDiv)
    this.infoDiv = infoDiv
  }
  
  setupClickHandler(map) {
    console.log("Setting up click handler, demarcationMode:", this.demarcationMode)
    
    // Remove any existing click handlers first
    map.off('click')
    
    // Leaflet click event
    map.on('click', (e) => {
      console.log("Map clicked!", "demarcationMode:", this.demarcationMode)
      if (!this.demarcationMode) return
      
      const latlng = e.latlng
      console.log("Adding point at:", latlng)
      this.addDemarcationPoint(latlng)
    })
  }
  
  addDemarcationPoint(latlng) {
    const map = window.territoryMap
    this.demarcationPoints.push(latlng)
    
    console.log("Point added. Total points:", this.demarcationPoints.length)
    
    // Add marker
    const marker = L.marker(latlng).addTo(map)
    marker.bindPopup(`Punto ${this.demarcationPoints.length}`)
    this.demarcationMarkers.push(marker) // Track for cleanup
    
    // Draw polygon if more than one point
    if (this.demarcationPoints.length > 1) {
      if (this.demarcationPolygon) {
        map.removeLayer(this.demarcationPolygon)
      }
      this.demarcationPolygon = L.polygon(this.demarcationPoints, {
        color: '#ffc107',
        fillColor: '#ffc107',
        fillOpacity: 0.3,
        weight: 3
      }).addTo(map)
    }
    
    // Update counter
    if (this.manualCloseDiv) {
      this.manualCloseDiv.querySelector('strong').textContent = 
        `Puntos marcados: ${this.demarcationPoints.length}`
    }
  }
  
  showControlPanel(map) {
    const manualCloseDiv = document.createElement('div')
    manualCloseDiv.style.cssText = `
      position: absolute;
      top: 60px;
      right: 10px;
      z-index: 1000;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `
    manualCloseDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 10px;">
        <strong>Puntos marcados: 0</strong>
      </div>
      <button id="close-polygon-btn" class="btn btn-success btn-sm" style="width: 100%; margin-top: 5px;">
        🔒 Cerrar Polígono
      </button>
      <button id="clear-demarcation-btn" class="btn btn-warning btn-sm" style="width: 100%; margin-top: 5px;">
        🗑️ Limpiar Todo
      </button>
    `
    map.getContainer().appendChild(manualCloseDiv)
    this.manualCloseDiv = manualCloseDiv
    
    // Add event listeners
    manualCloseDiv.querySelector('#close-polygon-btn').addEventListener('click', () => this.closePolygon())
    manualCloseDiv.querySelector('#clear-demarcation-btn').addEventListener('click', () => this.clearDemarcation())
  }
  
  closePolygon() {
    if (this.demarcationPoints.length < 3) {
      alert('❌ Necesitas al menos 3 puntos para cerrar el polígono')
      return
    }
    
    const map = window.territoryMap
    
    // Close the polygon
    this.demarcationPoints.push(this.demarcationPoints[0])
    
    if (this.demarcationPolygon) {
      map.removeLayer(this.demarcationPolygon)
    }
    
    this.demarcationPolygon = L.polygon(this.demarcationPoints, {
      color: '#28a745',
      fillColor: '#28a745',
      fillOpacity: 0.3,
      weight: 3
    }).addTo(map)
    
    // Show save buttons
    this.showSavePanel(map)
    
    // Deactivate demarcation mode
    this.demarcationMode = false
    map.getContainer().style.cursor = ''
    map.off('click')
    
    // Enable map dragging
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    
    // Hide manual button
    if (this.manualCloseDiv) {
      map.getContainer().removeChild(this.manualCloseDiv)
      this.manualCloseDiv = null
    }
  }
  
  showSavePanel(map) {
    const saveDiv = document.createElement('div')
    saveDiv.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      text-align: center;
    `
    saveDiv.innerHTML = `
      <h5 style="margin-bottom: 15px;">🎯 Polígono Cerrado</h5>
      <p style="margin-bottom: 15px;">Puntos marcados: <strong>${this.demarcationPoints.length - 1}</strong></p>
      <button id="save-main-territory-btn" class="btn btn-success btn-lg me-2">
        💾 Guardar Zona Principal
      </button>
      <button id="clear-main-territory-btn" class="btn btn-warning btn-lg me-2">
        🗑️ Limpiar Todo
      </button>
      <button id="cancel-main-territory-btn" class="btn btn-secondary btn-lg">
        ❌ Cancelar
      </button>
    `
    map.getContainer().appendChild(saveDiv)
    this.saveDiv = saveDiv
    
    // Add event listeners
    saveDiv.querySelector('#save-main-territory-btn').addEventListener('click', () => this.save())
    saveDiv.querySelector('#clear-main-territory-btn').addEventListener('click', () => this.clearDemarcation())
    saveDiv.querySelector('#cancel-main-territory-btn').addEventListener('click', () => this.cancel())
  }
  
  clearDemarcation() {
    const map = window.territoryMap
    if (!map) return
    
    console.log("Clearing demarcation")
    
    if (this.demarcationPolygon) {
      map.removeLayer(this.demarcationPolygon)
      this.demarcationPolygon = null
    }
    
    // Clear markers using tracked array
    if (this.demarcationMarkers) {
      this.demarcationMarkers.forEach(marker => {
        map.removeLayer(marker)
      })
      this.demarcationMarkers = []
    }
    
    this.demarcationPoints = []
    
    // Clear UI elements
    if (this.infoDiv) {
      map.getContainer().removeChild(this.infoDiv)
      this.infoDiv = null
    }
    if (this.saveDiv) {
      map.getContainer().removeChild(this.saveDiv)
      this.saveDiv = null
    }
    if (this.manualCloseDiv) {
      map.getContainer().removeChild(this.manualCloseDiv)
      this.manualCloseDiv = null
    }
    
    map.getContainer().style.cursor = ''
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    map.off('click')
    
    this.demarcationMode = false
  }
  
  cancel() {
    this.clearDemarcation()
    
    // If editing, restore previous territory
    if (window.mainTerritoryLayer && window.mainTerritoryPoints) {
      const map = window.territoryMap
      const coordinates = window.mainTerritoryPoints.map(point => [point.lat, point.lng])
      window.mainTerritoryLayer = L.polygon(coordinates, {
        color: '#ffc107',
        fillColor: '#ffc107',
        fillOpacity: 0.2,
        weight: 4
      }).addTo(map)
    }
  }
  
  async save() {
    if (!this.demarcationPoints || this.demarcationPoints.length < 4) {
      alert('Por favor dibuja un polígono válido con al menos 3 puntos')
      return
    }
    
    if (!window.currentCongregationId) {
      alert('Por favor selecciona una congregación primero')
      return
    }
    
    const coordinates = this.demarcationPoints.map(point => [point.lng, point.lat])
    
    // Calculate center
    const centerLat = this.demarcationPoints.reduce((sum, p) => sum + p.lat, 0) / this.demarcationPoints.length
    const centerLng = this.demarcationPoints.reduce((sum, p) => sum + p.lng, 0) / this.demarcationPoints.length
    
    const data = {
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      center: { lat: centerLat, lng: centerLng }
    }
    
    try {
      const response = await apiClient.patch(`/congregations/${window.currentCongregationId}`, data)
      console.log("Save response:", response)
      
      alert('✅ Zona principal guardada exitosamente')
      this.clearDemarcation()
      
      // Reload congregation data and polygon through congregation controller
      const congregationElement = document.querySelector('[data-controller~="territories--congregation"]')
      if (congregationElement) {
        const congregationController = this.application.getControllerForElementAndIdentifier(
          congregationElement,
          'territories--congregation'
        )
        if (congregationController) {
          // Store current ID to restore after reload
          const currentId = window.currentCongregationId
          console.log("Reloading congregations, current ID:", currentId)
          
          // Reload all congregations to update the list
          await congregationController.loadCongregations()
          
          // Make sure currentIdValue is set correctly
          congregationController.currentIdValue = currentId
          congregationController.filterTarget.value = currentId
          window.currentCongregationId = currentId
          
          // Note: loadPolygon is already called by populateFilter if has geometry
          console.log("Congregations reloaded, polygon should be visible")
        }
      }
    } catch (error) {
      console.error('Error saving main territory:', error)
      alert('❌ Error al guardar la zona principal')
    }
  }
  
  async edit() {
    if (!window.mainTerritoryLayer) {
      alert('No hay zona principal para editar')
      return
    }
    
    // Clear current layer and start demarcation
    const map = window.territoryMap
    map.removeLayer(window.mainTerritoryLayer)
    window.mainTerritoryLayer = null
    
    this.startDemarcation()
  }
  
  async delete() {
    if (!window.mainTerritoryLayer) {
      alert('No hay zona principal para eliminar')
      return
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar la zona principal?')) {
      return
    }
    
    if (!window.currentCongregationId) {
      alert('No hay congregación seleccionada')
      return
    }
    
    try {
      await apiClient.patch(`/congregations/${window.currentCongregationId}`, {
        geometry: null,
        center: null
      })
      
      alert('✅ Zona principal eliminada exitosamente')
      
      // Remove from map
      const map = window.territoryMap
      if (window.mainTerritoryLayer) {
        map.removeLayer(window.mainTerritoryLayer)
        window.mainTerritoryLayer = null
      }
      
      // Reload congregation list to update status
      const congregationElement = document.querySelector('[data-controller~="territories--congregation"]')
      if (congregationElement) {
        const congregationController = this.application.getControllerForElementAndIdentifier(
          congregationElement,
          'territories--congregation'
        )
        if (congregationController && congregationController.loadCongregations) {
          await congregationController.loadCongregations()
        }
      }
      
      // Hide controls
      if (this.hasControlsTarget) {
        this.controlsTarget.style.display = 'none'
      }
    } catch (error) {
      console.error('Error deleting main territory:', error)
      alert('❌ Error al eliminar la zona principal')
    }
  }
}

