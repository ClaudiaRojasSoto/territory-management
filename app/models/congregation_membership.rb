class CongregationMembership < ApplicationRecord
  belongs_to :user
  belongs_to :congregation

  enum role: { admin: 0, publisher: 1 }

  validates :role, presence: true
  validates :user_id, uniqueness: { scope: :congregation_id, message: "ya es miembro de esta congregación" }
end
