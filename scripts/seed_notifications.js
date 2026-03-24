import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force load env vars specifically from the root of our project
dotenv.config({ path: path.resolve('c:/Users/Darvin7/.gemini/antigravity/playground/sistema de crm con fidelizacion/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Variables de entorno de Supabase no encontradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectTestNotifications() {
    console.log('Inyectando notificaciones de prueba en Supabase...');

    const { error } = await supabase.from('notifications').insert([
        { type: 'info', message: '¡Bienvenido al nuevo sistema de notificaciones en tiempo real!' },
        { type: 'success', message: 'La sincronización con la base de datos se ha completado correctamente.' },
        { type: 'warning', message: 'Aviso: Los reportes Excel ahora incluyen diseño institucional.' }
    ]);

    if (error) {
        console.error('Error inyectando notificaciones:', error);
    } else {
        console.log('¡Notificaciones inyectadas con éxito! Deberían aparecer en la UI.');
    }
}

injectTestNotifications();
