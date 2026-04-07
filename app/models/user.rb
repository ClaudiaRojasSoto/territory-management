class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  belongs_to :congregation, optional: true

  has_many :assigned_territories, class_name: 'Territory', foreign_key: 'assigned_to_id'

  validates :name, presence: true

  def full_name
    name.presence || email
  end
end
