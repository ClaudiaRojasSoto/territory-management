import { Controller } from "@hotwired/stimulus"
import apiClient from "../shared/api_client"

// Connects to data-controller="territories--territory-list"
export default class extends Controller {
  static targets = ["list", "statusFilter"]
  
  static values = {
    congregationId: { type: String, default: "" }
  }
  
  connect() {
    this.territories = []
    
    // Setup status filter if target exists
    if (this.hasStatusFilterTarget) {
      this.statusFilterTarget.addEventListener('change', this.filterByStatus.bind(this))
    }
  }
  
  async load(congregationId = null) {
    try {
      const id = congregationId || this.congregationIdValue
      const endpoint = id ? `/territories?congregation_id=${id}` : '/territories'
      const data = await apiClient.get(endpoint)
      
      this.territories = data
      this.render()
      this.renderOnMap(data)
    } catch (error) {
      console.error('Error loading territories:', error)
    }
  }
  
  render() {
    if (!this.hasListTarget) return
    
    this.listTarget.innerHTML = ''
    
    const filteredTerritories = this.getFilteredTerritories()
    
    filteredTerritories.forEach(territory => {
      const item = this.createListItem(territory)
      this.listTarget.appendChild(item)
    })
  }
  
  createListItem(territory) {
    const item = document.createElement('div')
    item.className = 'territory-item p-2 border-bottom cursor-pointer'
    item.dataset.territoryId = territory.properties.id
    
    item.innerHTML = `
      <h6 class="mb-1">
        ${territory.properties.number ? `#${territory.properties.number} - ` : ''}
        ${territory.properties.name}
      </h6>
      <small class="text-muted d-block">${this.translateStatus(territory.properties.status)}</small>
      <small class="d-block">${territory.properties.area} acres</small>
      <div class="mt-2">
        <button class="btn btn-sm btn-outline-primary" 
                onclick="printTerritory(${territory.properties.id}, '${territory.properties.name}')">
          🖨️ Imprimir
        </button>
      </div>
    `
    
    // Add click handler to center map on territory
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking the button
      if (e.target.tagName === 'BUTTON') return
      
      this.centerOnTerritory(territory)
    })
    
    return item
  }
  
  centerOnTerritory(territory) {
    const center = territory.properties.center
    
    if (center && center.lat && center.lng) {
      const map = window.territoryMap
      if (map) {
        map.setView([center.lat, center.lng], 15)
      }
    }
  }
  
  getFilteredTerritories() {
    if (!this.hasStatusFilterTarget) return this.territories
    
    const selectedStatus = this.statusFilterTarget.value
    
    if (!selectedStatus) return this.territories
    
    return this.territories.filter(territory => 
      territory.properties.status === selectedStatus
    )
  }
  
  filterByStatus(event) {
    this.render()
    
    // Also update map display
    const filteredTerritories = this.getFilteredTerritories()
    this.renderOnMap(filteredTerritories)
  }
  
  renderOnMap(territories) {
    // Try to use territory-map controller if available
    if (typeof displayTerritories === 'function') {
      displayTerritories(territories)
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
  
  // Public method to reload territories
  reload() {
    this.load(this.congregationIdValue)
  }
  
  // Update congregation ID and reload
  setCongregationId(id) {
    this.congregationIdValue = id
    this.load(id)
  }
}

