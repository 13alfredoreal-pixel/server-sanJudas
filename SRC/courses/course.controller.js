import Course from './course.model.js'
import Grade from '../grades/grade.model.js'
import { logAdminAction } from '../audit/audit.logger.js'

export const getCourses = async (req, res) => {
    try {
        const { grade, active, search } = req.query
        let filter = {}

        if (grade) filter.grade = grade
        if (active !== undefined) filter.isActive = active === 'true'
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { teacher: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ]
        }

        const courses = await Course.find(filter)
            .populate('grade', 'name level yearNumber section')
            .sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            total: courses.length,
            courses
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los cursos',
            error: error.message
        })
    }
}

export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('grade', 'name level yearNumber section')

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            })
        }

        return res.status(200).json({
            success: true,
            course
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el curso',
            error: error.message
        })
    }
}

export const getCoursesByGrade = async (req, res) => {
    try {
        const { gradeId } = req.params

        const grade = await Grade.findById(gradeId)
        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grado no encontrado'
            })
        }

        const courses = await Course.find({ grade: gradeId, isActive: true })
            .populate('grade', 'name level yearNumber section')
            .sort({ name: 1 })

        return res.status(200).json({
            success: true,
            grade: grade.name,
            level: grade.level,
            total: courses.length,
            courses
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener cursos del grado',
            error: error.message
        })
    }
}

export const createCourse = async (req, res) => {
    try {
        const { name, code, grade, teacher, description, schedule, credits } = req.body

        const cleanName = (name || '').trim()
        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del curso es obligatorio'
            })
        }

        const gradeExists = await Grade.findById(grade)
        if (!gradeExists) {
            return res.status(404).json({
                success: false,
                message: 'El grado especificado no existe'
            })
        }

        const course = await Course.create({
            name: cleanName,
            code: code || '',
            grade,
            teacher: teacher || 'Por asignar',
            description: description || '',
            schedule: schedule || '',
            credits: credits || 3
        })

        const populatedCourse = await Course.findById(course._id)
            .populate('grade', 'name level yearNumber section')

        if (req.uid) {
            await logAdminAction(req.uid, 'CREATE_COURSE', `Curso creado: ${cleanName} para ${gradeExists.name}`, req.ip)
        }

        return res.status(201).json({
            success: true,
            message: 'Curso creado exitosamente',
            course: populatedCourse
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
            message: 'Error al crear el curso',
            error: error.message
        })
    }
}

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params
        const data = { ...req.body }

        const protectedFields = ['_id', 'createdAt', 'updatedAt']
        protectedFields.forEach(field => delete data[field])

        if (data.grade) {
            const gradeExists = await Grade.findById(data.grade)
            if (!gradeExists) {
                return res.status(404).json({
                    success: false,
                    message: 'El grado especificado no existe'
                })
            }
        }

        const course = await Course.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        }).populate('grade', 'name level yearNumber section')

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'UPDATE_COURSE', `Curso actualizado: ${course.name}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Curso actualizado correctamente',
            course
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
            message: 'Error al actualizar el curso',
            error: error.message
        })
    }
}

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params
        const course = await Course.findByIdAndDelete(id)

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'DELETE_COURSE', `Curso eliminado: ${course.name}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Curso eliminado correctamente'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el curso',
            error: error.message
        })
    }
}
