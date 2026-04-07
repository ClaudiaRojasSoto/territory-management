class AddUserToCongregations < ActiveRecord::Migration[7.1]
  def change
    add_reference :congregations, :user, foreign_key: true
  end
end
