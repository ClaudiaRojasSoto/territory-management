class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  def self.ransackable_attributes(auth_object = nil)
    super - %w[encrypted_password reset_password_token]
  end

  has_many :congregation_memberships, dependent: :destroy
  has_many :congregations, through: :congregation_memberships
  has_many :assigned_territories, class_name: 'Territory', foreign_key: 'assigned_to_id'

  validates :name, presence: true

  def full_name
    name.presence || email
  end

  def admin_of?(congregation)
    congregation_memberships.exists?(congregation: congregation, role: :admin)
  end

  def publisher_of?(congregation)
    congregation_memberships.exists?(congregation: congregation, role: :publisher)
  end

  def member_of?(congregation)
    congregation_memberships.exists?(congregation: congregation)
  end

  def admin_congregation_ids
    congregation_memberships.admin.pluck(:congregation_id)
  end
end
