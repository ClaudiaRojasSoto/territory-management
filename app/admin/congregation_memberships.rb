ActiveAdmin.register CongregationMembership do
  permit_params :user_id, :congregation_id, :role

  index do
    selectable_column
    id_column
    column :user
    column :congregation
    column :role
    column :created_at
    actions
  end

  filter :role, as: :select, collection: CongregationMembership.roles

  form do |f|
    f.inputs do
      f.input :user
      f.input :congregation
      f.input :role, as: :select, collection: CongregationMembership.roles.keys
    end
    f.actions
  end
end
