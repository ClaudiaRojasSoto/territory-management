class Api::V1::InvitationsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    congregation = current_user.congregations
                               .joins(:congregation_memberships)
                               .where(congregation_memberships: { user: current_user, role: :admin })
                               .find(params[:congregation_id])

    invitation = congregation.invitations.create!(role: params[:role].presence || :publisher)

    render json: {
      token: invitation.token,
      expires_at: invitation.expires_at,
      role: invitation.role,
      link: new_user_registration_url(invitation_token: invitation.token)
    }, status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'No autorizado o congregación no encontrada' }, status: :forbidden
  end
end
