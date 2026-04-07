class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]

  def create
    congregation_name = params[:user][:congregation_name].to_s.strip

    if congregation_name.blank?
      build_resource(user_params_without_congregation)
      resource.errors.add(:base, "El nombre de la congregación no puede estar en blanco")
      render :new, status: :unprocessable_entity
      return
    end

    build_resource(user_params_without_congregation)

    if resource.save
      resource.congregations.create!(name: congregation_name)
      sign_up(resource_name, resource)
      respond_with resource, location: after_sign_up_path_for(resource)
    else
      clean_up_passwords resource
      render :new, status: :unprocessable_entity
    end
  end

  private

  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :congregation_name])
  end

  def user_params_without_congregation
    sign_up_params.except(:congregation_name)
  end
end
