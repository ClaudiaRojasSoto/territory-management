class Invitation < ApplicationRecord
  belongs_to :congregation

  enum role: { admin: 0, publisher: 1 }

  before_create :generate_token
  before_create :set_expiry

  scope :valid, -> { where(used_at: nil).where('expires_at > ?', Time.current) }

  validates :token, uniqueness: true

  def use!(user)
    CongregationMembership.create!(user: user, congregation: congregation, role: role)
    update!(used_at: Time.current)
  end

  private

  def generate_token
    loop do
      self.token = SecureRandom.urlsafe_base64(16)
      break unless Invitation.exists?(token: token)
    end
  end

  def set_expiry
    self.expires_at ||= 7.days.from_now
  end
end
