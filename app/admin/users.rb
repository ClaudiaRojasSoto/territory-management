ActiveAdmin.register User do
  permit_params :name, :email, :super_admin

  index do
    selectable_column
    id_column
    column :name
    column :email
    column :super_admin
    column :created_at
    actions
  end

  filter :name
  filter :email
  filter :super_admin

  show do
    attributes_table do
      row :id
      row :name
      row :email
      row :super_admin
      row :created_at
    end

    panel 'Congregaciones' do
      table_for resource.congregation_memberships.includes(:congregation) do
        column :congregation
        column :role
        column :created_at
      end
    end
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :email
      f.input :super_admin
    end
    f.actions
  end
end
