class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  # TODO: Uncomment when Devise is installed and configured
  # devise :database_authenticatable, :registerable,
  #        :recoverable, :rememberable, :validatable
         
  # Relaciones
  has_many :assigned_territories, class_name: 'Territory', foreign_key: 'assigned_to_id'
  
  # Validaciones
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  
  # Scopes
  scope :active, -> { where(active: true) }
  
  # Métodos
  def full_name
    name.presence || email
  end
  
  def assigned_territories_count
    assigned_territories.count
  end
  
  def available_territories_count
    assigned_territories.available.count
  end
  
  def completed_territories_count
    assigned_territories.completed.count
  end
  
  def returned_territories_count
    assigned_territories.returned.count
  end
end
