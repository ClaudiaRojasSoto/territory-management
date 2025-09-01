# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Crear usuarios de ejemplo
puts "Creando usuarios..."

user1 = User.create!(
  email: 'admin@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  name: 'Administrador'
)

user2 = User.create!(
  email: 'usuario1@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  name: 'Usuario 1'
)

user3 = User.create!(
  email: 'usuario2@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  name: 'Usuario 2'
)

puts "Usuarios creados: #{User.count}"

# Crear territorios de ejemplo
puts "Creando territorios..."

# Territorio General - Zona de Trabajo Principal
territory1 = Territory.create!(
  name: 'Zona de Trabajo Principal - Copiapó',
  description: 'Área delimitada por Van Buren al norte, Inca al sur, Río Copiapó al este y Av. Los Loros al oeste',
  status: 'available',
  boundaries: 'POLYGON((-70.3350 -27.3650, -70.3250 -27.3650, -70.3250 -27.3680, -70.3350 -27.3680, -70.3350 -27.3650))',
  center: 'POINT(-70.3300 -27.3665)'
)

# Territorio 2 - Sector Norte
territory2 = Territory.create!(
  name: 'Sector Norte',
  description: 'Zona residencial del sector norte de Copiapó',
  status: 'assigned',
  assigned_to: user1,
  assigned_at: Time.current,
  boundaries: 'POLYGON((-70.3200 -27.3500, -70.3200 -27.3500, -70.3200 -27.3500, -70.3200 -27.3500, -70.3200 -27.3500))',
  center: 'POINT(-70.3200 -27.3500)'
)

# Territorio 3 - Sector Sur
territory3 = Territory.create!(
  name: 'Sector Sur',
  description: 'Zona del sector sur de Copiapó',
  status: 'completed',
  assigned_to: user2,
  assigned_at: 1.week.ago,
  boundaries: 'POLYGON((-70.3400 -27.3800, -70.3400 -27.3800, -70.3400 -27.3800, -70.3400 -27.3800, -70.3400 -27.3800))',
  center: 'POINT(-70.3400 -27.3800)'
)

# Territorio 4 - Sector Este
territory4 = Territory.create!(
  name: 'Sector Este',
  description: 'Zona del sector este de Copiapó',
  status: 'returned',
  assigned_to: user3,
  assigned_at: 2.weeks.ago,
  returned_at: 1.week.ago,
  boundaries: 'POLYGON((-70.3100 -27.3700, -70.3100 -27.3700, -70.3100 -27.3700, -70.3100 -27.3700, -70.3100 -27.3700))',
  center: 'POINT(-70.3100 -27.3700)'
)

puts "Territorios creados: #{Territory.count}"

puts "¡Datos de ejemplo creados exitosamente!"
puts "Puedes iniciar sesión con:"
puts "Email: admin@example.com"
puts "Password: password123"
