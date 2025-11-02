Rails.application.routes.draw do
  # Devise routes for authentication
  devise_for :users, path: '', path_names: {
    sign_in: 'login',
    sign_out: 'logout',
    sign_up: 'registro'
  }, controllers: {
    registrations: 'users/registrations'
  }
  
  # Root route
  root "territories#index"
  
  # Territories routes
  resources :territories
  
  # API routes for AJAX
  namespace :api do
    namespace :v1 do
      resources :congregations, only: [:index, :show, :create, :update, :destroy]
      resources :territories, only: [:index, :show, :create, :update, :destroy] do
        member do
          patch :assign
          patch :return
          patch :complete
        end
      end
    end
  end
  
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
