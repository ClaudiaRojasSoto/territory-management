class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action :verify_admin!
  
  def dashboard
    @stats = {
      total_users: User.count,
      active_users: User.active.count,
      total_congregations: Congregation.count,
      total_territories: Territory.count,
      available_territories: Territory.available.count,
      assigned_territories: Territory.assigned.count,
      completed_territories: Territory.completed.count
    }
    
    @recent_users = User.order(created_at: :desc).limit(5)
    @recent_territories = Territory.order(created_at: :desc).limit(5)
  end

  def users
    @users = User.includes(:congregation).order(created_at: :desc)
  end

  def congregations
    @congregations = Congregation.all.order(:name)
  end

  def territories
    @territories = Territory.includes(:congregation, :assigned_to).order(created_at: :desc)
  end
  
  private
  
  def verify_admin!
    unless current_user.admin?
      redirect_to root_path, alert: 'No tienes permisos para acceder a esta sección.'
    end
  end
end
