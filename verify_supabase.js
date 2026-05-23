import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log("Intentando conectar con Supabase...");
  
  const testUser = {
    nombre: 'Antigravity_Test',
    rol: 'trabajador',
    password: 'test_password_123'
  };

  const { data, error } = await supabase
    .from('usuarios')
    .insert([testUser])
    .select();

  if (error) {
    console.error("Error al crear usuario de prueba:", error.message);
  } else {
    console.log("¡Éxito! Usuario creado correctamente:", data);
  }
}

verify();
