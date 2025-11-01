Rails.application.routes.draw do
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
