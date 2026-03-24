import { supabase } from './supabase';

/**
 * Sube una imagen al bucket público "images" de Supabase
 * @param file El archivo (File o Blob) a subir
 * @param folder Opcional: Un subdirectorio donde guardarlo (ej: 'recompensas', 'avatares')
 * @returns La URL pública de la imagen si fue exitoso, o null si falló.
 */
export async function uploadImage(file: File, folder = 'general'): Promise<string | null> {
    try {
        // Limpiamos el nombre del archivo y agregamos un timestamp para evitar colisiones (archivos con el mismo nombre)
        const fileExt = file.name.split('.').pop();
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').replace(`_${fileExt}`, '');
        const fileName = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;

        // Subimos el archivo usando el cliente de storage de supabase
        const { error: uploadError, data } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false // No sobreescribir si ya existe uno con el mismo nombre exacto
            });

        if (uploadError) {
            console.error('Error uploading image to Supabase:', uploadError.message);
            throw uploadError;
        }

        if (!data?.path) return null;

        // Obtenemos la URL final pública que podemos guardar en la base de datos
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error) {
        console.error('Error in uploadImage utility:', error);
        return null;
    }
}
