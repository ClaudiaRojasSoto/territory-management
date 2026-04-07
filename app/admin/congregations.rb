ActiveAdmin.register Congregation do
  permit_params :name, :description

  index do
    selectable_column
    id_column
    column :name
    column :description
    column('Miembros') { |c| c.congregation_memberships.count }
    column('Territorios') { |c| c.territories.count }
    column :created_at
    actions
  end

  filter :name

  show do
    attributes_table do
      row :id
      row :name
      row :description
      row :created_at
    end

    panel 'Miembros' do
      table_for resource.congregation_memberships.includes(:user) do
        column :user
        column :role
        column :created_at
      end
    end

    panel 'Territorios' do
      table_for resource.territories do
        column :name
        column :status
        column :number
      end
    end
  end

  form do |f|
    f.inputs do
      f.input :name
      f.input :description
    end
    f.actions
  end
end
