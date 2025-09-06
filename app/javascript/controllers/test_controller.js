import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="test"
export default class extends Controller {
  static targets = ["message"]

  connect() {
    console.log("Test controller connected!")
  }

  showMessage() {
    if (this.hasMessageTarget) {
      this.messageTarget.textContent = "¡Stimulus está funcionando correctamente!"
      this.messageTarget.classList.add("alert", "alert-success")
    }
  }
}