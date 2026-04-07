class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]

  def create
    congregation_name = params[:user][:congregation_name].to_s.strip

    if congregation_name.blank?
      build_resource(sign_up_params)
      resource.errors.add(:congregation_name, "no puede estar en blanco")
      render :new, status: :unprocessable_entity
      return
    end

    congregation = Congregation.find_or_create_by(name: congregation_name)

    build_resource(sign_up_params)
    resource.congregation = congregation

    if resource.save
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
end
