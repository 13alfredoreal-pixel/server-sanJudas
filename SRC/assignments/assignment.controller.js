import Assignment from './assignment.model.js'
import Course from '../courses/course.model.js'
import Grade from '../grades/grade.model.js'
import { logAdminAction } from '../audit/audit.logger.js'

export const getAssignments = async (req, res) => {
    try {
        const { grade, course, type, priority, upcoming, page = 1, limit = 20 } = req.query
        let filter = { isActive: true }

        if (grade) filter.grade = grade
        if (course) filter.course = course
        if (type) filter.type = type.toUpperCase()
        if (priority) filter.priority = priority.toUpperCase()
        if (upcoming === 'true') {
            filter.dueDate = { $gte: new Date() }
        }

        const pageNumber = parseInt(page)
        const limitNumber = parseInt(limit)
        const skip = (pageNumber - 1) * limitNumber

        const assignments = await Assignment.find(filter)
            .populate('course', 'name code teacher')
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')
            .sort({ dueDate: 1 })
            .skip(skip)
            .limit(limitNumber)

        const totalAssignments = await Assignment.countDocuments(filter)

        return res.status(200).json({
            success: true,
            assignments,
            pagination: {
                total: totalAssignments,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalAssignments / limitNumber)
            }
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las tareas',
            error: error.message
        })
    }
}

export const getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('course', 'name code teacher')
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            })
        }

        return res.status(200).json({
            success: true,
            assignment
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la tarea',
            error: error.message
        })
    }
}

export const getAssignmentsByGrade = async (req, res) => {
    try {
        const { gradeId } = req.params
        const { upcoming } = req.query

        const grade = await Grade.findById(gradeId)
        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grado no encontrado'
            })
        }

        let filter = { grade: gradeId, isActive: true }
        if (upcoming === 'true') {
            filter.dueDate = { $gte: new Date() }
        }

        const assignments = await Assignment.find(filter)
            .populate('course', 'name code teacher')
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')
            .sort({ dueDate: 1 })

        return res.status(200).json({
            success: true,
            grade: grade.name,
            level: grade.level,
            total: assignments.length,
            assignments
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tareas del grado',
            error: error.message
        })
    }
}

export const createAssignment = async (req, res) => {
    try {
        const { title, description, course, grade, dueDate, points, type, priority, attachmentUrl } = req.body

        const cleanTitle = (title || '').trim()
        if (!cleanTitle) {
            return res.status(400).json({
                success: false,
                message: 'El título de la tarea es obligatorio'
            })
        }

        const gradeExists = await Grade.findById(grade)
        if (!gradeExists) {
            return res.status(404).json({
                success: false,
                message: 'El grado especificado no existe'
            })
        }

        const courseExists = await Course.findById(course)
        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: 'El curso especificado no existe'
            })
        }

        const assignment = await Assignment.create({
            title: cleanTitle,
            description: (description || '').trim(),
            course,
            grade,
            dueDate: new Date(dueDate),
            points: points || 10,
            type: (type || 'TAREA').toUpperCase(),
            priority: (priority || 'MEDIA').toUpperCase(),
            attachmentUrl: attachmentUrl || '',
            createdBy: req.uid
        })

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('course', 'name code teacher')
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')

        if (req.uid) {
            await logAdminAction(req.uid, 'CREATE_ASSIGNMENT', `Tarea creada: ${cleanTitle} para ${gradeExists.name}`, req.ip)
        }

        return res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            assignment: populatedAssignment
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
            message: 'Error al crear la tarea',
            error: error.message
        })
    }
}

export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params
        const data = { ...req.body }

        const protectedFields = ['_id', 'createdAt', 'updatedAt', 'createdBy']
        protectedFields.forEach(field => delete data[field])

        if (data.type) data.type = data.type.toUpperCase()
        if (data.priority) data.priority = data.priority.toUpperCase()
        if (data.dueDate) data.dueDate = new Date(data.dueDate)

        const assignment = await Assignment.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        })
            .populate('course', 'name code teacher')
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'UPDATE_ASSIGNMENT', `Tarea actualizada: ${assignment.title}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Tarea actualizada correctamente',
            assignment
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
            message: 'Error al actualizar la tarea',
            error: error.message
        })
    }
}

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params
        const assignment = await Assignment.findByIdAndDelete(id)

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'DELETE_ASSIGNMENT', `Tarea eliminada: ${assignment.title}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Tarea eliminada correctamente'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la tarea',
            error: error.message
        })
    }
}
