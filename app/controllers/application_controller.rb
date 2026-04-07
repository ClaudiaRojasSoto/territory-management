class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :authenticate_user!
  before_action :set_locale

  private

  def set_locale
    I18n.locale = params[:locale] || I18n.default_locale
  end

  def default_url_options
    { locale: I18n.locale == I18n.default_locale ? nil : I18n.locale }
  end

  def authenticate_admin!
    authenticate_user!
    redirect_to root_path, alert: 'No autorizado.' unless current_user&.super_admin?
  end

  def require_congregation_admin!(congregation)
    return if current_user.super_admin?

    render json: { error: 'No autorizado' }, status: :forbidden unless current_user.admin_of?(congregation)
  end
end
