import Grade from './grade.model.js'
import { logAdminAction } from '../audit/audit.logger.js'

export const getGrades = async (req, res) => {
    try {
        const { level, active } = req.query
        let filter = {}

        if (level) {
            filter.level = level.toUpperCase()
        }
        if (active !== undefined) {
            filter.isActive = active === 'true'
        }

        const grades = await Grade.find(filter).sort({ level: 1, yearNumber: 1, section: 1 })

        return res.status(200).json({
            success: true,
            grades
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los grados',
            error: error.message
        })
    }
}

export const getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id)
        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grado no encontrado'
            })
        }

        return res.status(200).json({
            success: true,
            grade
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el grado',
            error: error.message
        })
    }
}

export const createGrade = async (req, res) => {
    try {
        const { name, level, section, description, yearNumber, shift, maxStudents } = req.body

        const cleanName = (name || '').trim()
        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del grado es obligatorio'
            })
        }

        const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const existing = await Grade.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } })
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un grado con este nombre'
            })
        }

        const grade = await Grade.create({
            name: cleanName,
            level: level?.toUpperCase(),
            section: section || 'A',
            description: description || '',
            yearNumber,
            shift: shift || 'MATUTINA',
            maxStudents: maxStudents || 35
        })

        if (req.uid) {
            await logAdminAction(req.uid, 'CREATE_GRADE', `Grado creado: ${cleanName}`, req.ip)
        }

        return res.status(201).json({
            success: true,
            message: 'Grado creado exitosamente',
            grade
        })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                error: error.message
            })
        }
        return res.status(500).json({
            success: false,
            message: 'Error al crear el grado',
            error: error.message
        })
    }
}

export const updateGrade = async (req, res) => {
    try {
        const { id } = req.params
        const data = { ...req.body }

        const protectedFields = ['_id', 'createdAt', 'updatedAt']
        protectedFields.forEach(field => delete data[field])

        if (data.level) {
            data.level = data.level.toUpperCase()
        }

        const grade = await Grade.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        })

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grado no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'UPDATE_GRADE', `Grado actualizado: ${grade.name}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Grado actualizado correctamente',
            grade
        })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                error: error.message
            })
        }
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el grado',
            error: error.message
        })
    }
}

export const deleteGrade = async (req, res) => {
    try {
        const { id } = req.params
        const grade = await Grade.findByIdAndDelete(id)

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grado no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'DELETE_GRADE', `Grado eliminado: ${grade.name}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Grado eliminado correctamente'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el grado',
            error: error.message
        })
    }
}

export const getGradesByLevel = async (req, res) => {
    try {
        const { level } = req.params
        const normalizedLevel = level.toUpperCase()

        if (!['BASICO', 'BACHILLERATO'].includes(normalizedLevel)) {
            return res.status(400).json({
                success: false,
                message: 'El nivel debe ser BASICO o BACHILLERATO'
            })
        }

        const grades = await Grade.find({ level: normalizedLevel, isActive: true })
            .sort({ yearNumber: 1, section: 1 })

        return res.status(200).json({
            success: true,
            level: normalizedLevel,
            total: grades.length,
            grades
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener grados por nivel',
            error: error.message
        })
    }
}
