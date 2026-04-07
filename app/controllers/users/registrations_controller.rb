class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]

  def create
    invitation_token = params[:user][:invitation_token].to_s.strip
    congregation_name = params[:user][:congregation_name].to_s.strip

    build_resource(user_base_params)

    if invitation_token.present?
      register_with_invitation(invitation_token)
    else
      register_with_new_congregation(congregation_name)
    end
  end

  private

  def register_with_invitation(token)
    invitation = Invitation.valid.find_by(token: token)

    unless invitation
      resource.errors.add(:base, 'Código de invitación inválido o expirado')
      render :new, status: :unprocessable_entity
      return
    end

    if resource.save
      invitation.use!(resource)
      sign_up(resource_name, resource)
      respond_with resource, location: after_sign_up_path_for(resource)
    else
      clean_up_passwords resource
      render :new, status: :unprocessable_entity
    end
  end

  def register_with_new_congregation(congregation_name)
    if congregation_name.blank?
      resource.errors.add(:base, 'Debes ingresar un nombre de congregación o un código de invitación')
      render :new, status: :unprocessable_entity
      return
    end

    if resource.save
      congregation = Congregation.create!(name: congregation_name)
      CongregationMembership.create!(user: resource, congregation: congregation, role: :admin)
      sign_up(resource_name, resource)
      respond_with resource, location: after_sign_up_path_for(resource)
    else
      clean_up_passwords resource
      render :new, status: :unprocessable_entity
    end
  end

  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :congregation_name, :invitation_token])
  end

  def user_base_params
    sign_up_params.except(:congregation_name, :invitation_token)
  end
end
