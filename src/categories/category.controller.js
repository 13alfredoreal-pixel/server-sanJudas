import Category from './category.model.js';
import { logAdminAction } from '../audit/audit.logger.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: 1 });
        return res.status(200).json({
            success: true,
            categories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las categorías',
            error: error.message
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        let { name, icon } = req.body;
        name = name?.trim();
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es obligatorio'
            });
        }

        console.log('[DEBUG] Creando categoría:', { name, icon, user: req.uid });
        
        // Escapar caracteres especiales para el regex
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoría con este nombre (o similar)'
            });
        }

        const newCategory = new Category({ name, icon: icon || '📄' });
        await newCategory.save();

        // Audit Log
        if (req.uid) {
            await logAdminAction(req.uid, 'CREATE_CATEGORY', `Categoría creada: ${name} ${icon}`, req.ip);
        }

        return res.status(201).json({
            success: true,
            message: 'Categoría creada con éxito',
            category: newCategory
        });
    } catch (error) {
        console.error('[Category Controller Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear la categoría',
            error: error.message,
            stack: error.stack
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);
        
        if (!deletedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        // Audit Log
        if (req.uid) {
            await logAdminAction(req.uid, 'DELETE_CATEGORY', `Categoría eliminada: ${deletedCategory.name}`, req.ip);
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría eliminada con éxito'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la categoría',
            error: error.message
        });
    }
};
