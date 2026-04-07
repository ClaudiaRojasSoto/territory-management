class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :congregations, dependent: :destroy
  has_many :assigned_territories, class_name: 'Territory', foreign_key: 'assigned_to_id'

  validates :name, presence: true

  def full_name
    name.presence || email
  end
end
