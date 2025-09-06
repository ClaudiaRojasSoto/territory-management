import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="hello"
export default class extends Controller {
  static targets = ["output"]

  connect() {
    console.log("Hello controller connected!")
    if (this.hasOutputTarget) {
      this.outputTarget.textContent = "Stimulus conectado ✓"
    }
  }

  greet() {
    const now = new Date().toLocaleTimeString()
    this.outputTarget.textContent = `Stimulus funciona! (${now})`
    console.log("Greet called at", now)
  }
}
