Rails.application.routes.draw do
  ActiveAdmin.routes(self)

  devise_for :users, controllers: { registrations: 'users/registrations' }

  root "territories#index"

  resources :territories

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
      resources :invitations, only: [:create]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
