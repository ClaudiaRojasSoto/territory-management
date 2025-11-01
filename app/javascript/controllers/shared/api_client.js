// HTTP Client for API requests
// Handles fetch requests with error handling and JSON parsing

export class ApiClient {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl
  }
  
  // GET request
  async get(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      throw error
    }
  }
  
  // POST request
  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': this.getCsrfToken(),
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      })
      
      if (!response.ok) {
        // Try to parse error response
        let errorData = null
        try {
          errorData = await response.json()
        } catch (e) {
          // If JSON parsing fails, use generic error
        }
        
        const error = new Error(`HTTP error! status: ${response.status}`)
        error.response = errorData
        error.status = response.status
        throw error
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error)
      throw error
    }
  }
  
  // PUT request
  async put(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': this.getCsrfToken(),
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error)
      throw error
    }
  }
  
  // PATCH request
  async patch(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': this.getCsrfToken(),
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error patching ${endpoint}:`, error)
      throw error
    }
  }
  
  // DELETE request
  async delete(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': this.getCsrfToken(),
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // DELETE might not return content
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return { success: true }
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error)
      throw error
    }
  }
  
  // Get CSRF token from meta tag
  getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]')
    return token ? token.content : ''
  }
}

// Export a default instance
export default new ApiClient()

