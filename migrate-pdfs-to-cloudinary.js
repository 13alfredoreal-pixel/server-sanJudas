import "dotenv/config";
import dns from "node:dns";
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cloudinary from './configs/cloudinary.js';
import { dbConnection } from './configs/db.js';
import Book from './SRC/books/book.model.js';

// Configuración de DNS para resolver problemas de querySrv ECONNREFUSED en Atlas
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PDF_DIR = join(__dirname, 'uploads/pdfs');

async function migratePdfsToCloudinary() {
    try {
        console.log('📚 Iniciando migración de PDFs a Cloudinary...');
        
        // Conectar a la base de datos
        await dbConnection();
        console.log('✅ Conectado a MongoDB');

        // Leer archivos PDF del directorio local
        const files = await readdir(PDF_DIR);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        
        console.log(`📄 Encontrados ${pdfFiles.length} PDFs para migrar`);

        for (const filename of pdfFiles) {
            try {
                console.log(`\n🔄 Procesando: ${filename}`);

                // Leer el archivo PDF
                const pdfPath = join(PDF_DIR, filename);
                const pdfBuffer = await readFile(pdfPath);

                // Buscar el libro en la base de datos por pdfPublicId
                const book = await Book.findOne({ pdfPublicId: filename });
                
                if (!book) {
                    console.log(`⚠️  No se encontró libro con pdfPublicId: ${filename}`);
                    continue;
                }

                // Subir a Cloudinary
                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'biblioteca/pdfs',
                            resource_type: 'raw',
                            public_id: filename,
                            format: 'pdf'
                        },
                        (err, result) => err ? reject(err) : resolve(result)
                    );
                    stream.end(pdfBuffer);
                });

                console.log(`✅ Subido a Cloudinary: ${uploadResult.secure_url}`);

                // Actualizar el libro en la base de datos
                book.pdfUrl = uploadResult.secure_url;
                book.pdfPublicId = uploadResult.public_id;
                await book.save();

                console.log(`📝 Libro actualizado: ${book.title}`);

            } catch (error) {
                console.error(`❌ Error al procesar ${filename}:`, error.message);
            }
        }

        console.log('\n🎉 Migración completada!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

migratePdfsToCloudinary();
