import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'consultorio_medico',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('📊 Inicializando base de datos...\n');

    // Tabla de doctores
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        phone VARCHAR(20),
        clinic_name VARCHAR(255),
        clinic_address TEXT,
        profile_image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla doctors creada');

    // Tabla de pacientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        email VARCHAR(255),
        phone VARCHAR(20),
        name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10),
        address TEXT,
        medical_history TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla patients creada');

    // Tabla de turnos/citas
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        end_time TIME,
        status VARCHAR(50) DEFAULT 'scheduled',
        reason_for_visit TEXT,
        notes TEXT,
        delay_minutes INTEGER DEFAULT 0,
        queue_position INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, appointment_date, appointment_time)
      );
    `);
    console.log('✓ Tabla appointments creada');

    // Tabla de disponibilidad del doctor
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, day_of_week, start_time)
      );
    `);
    console.log('✓ Tabla doctor_availability creada');

    // Tabla de vacaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_vacation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabla doctor_vacation creada');

    // Tabla de notificaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        patient_phone VARCHAR(20) NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_sent BOOLEAN DEFAULT false
      );
    `);
    console.log('✓ Tabla notifications creada');

    // Crear índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications(appointment_id);
    `);
    console.log('✓ Índices creados');

    console.log('\n✅ Base de datos inicializada correctamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

initDatabase();
