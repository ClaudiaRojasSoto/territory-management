class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
         
  # Relaciones
  belongs_to :congregation, optional: true
  has_many :assigned_territories, class_name: 'Territory', foreign_key: 'assigned_to_id'
  
  # Validaciones
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: %w[admin anciano auxiliar publicador] }
  
  # Scopes
  scope :active, -> { where(active: true) }
  scope :admins, -> { where(role: 'admin') }
  scope :by_congregation, ->(congregation_id) { where(congregation_id: congregation_id) }
  
  # Métodos de roles
  def admin?
    role == 'admin'
  end
  
  def anciano?
    role == 'anciano'
  end
  
  def auxiliar?
    role == 'auxiliar'
  end
  
  def publicador?
    role == 'publicador'
  end
  
  # Métodos existentes
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
