import Schedule from './schedule.model.js'
import Grade from '../grades/grade.model.js'
import { logAdminAction } from '../audit/audit.logger.js'

export const getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find({ isActive: true })
            .populate('grade', 'name level yearNumber section')
            .populate('entries.course', 'name code teacher')

        return res.status(200).json({
            success: true,
            total: schedules.length,
            schedules
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los horarios',
            error: error.message
        })
    }
}

export const getScheduleByGrade = async (req, res) => {
    try {
        const { gradeId } = req.params

        const grade = await Grade.findById(gradeId)
        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grado no encontrado'
            })
        }

        const schedule = await Schedule.findOne({ grade: gradeId, isActive: true })
            .populate('grade', 'name level yearNumber section')
            .populate('entries.course', 'name code teacher')

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Horario no encontrado para este grado'
            })
        }

        const dayOrder = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
        const organized = {}
        dayOrder.forEach(day => {
            organized[day] = schedule.entries
                .filter(e => e.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
        })

        return res.status(200).json({
            success: true,
            grade: grade.name,
            level: grade.level,
            schedule,
            organizedByDay: organized
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el horario',
            error: error.message
        })
    }
}

export const createSchedule = async (req, res) => {
    try {
        const { grade, entries, academicYear } = req.body

        const gradeExists = await Grade.findById(grade)
        if (!gradeExists) {
            return res.status(404).json({
                success: false,
                message: 'El grado especificado no existe'
            })
        }

        const existing = await Schedule.findOne({ grade })
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un horario para este grado. Use PUT para actualizar.'
            })
        }

        const schedule = await Schedule.create({
            grade,
            entries: entries || [],
            academicYear: academicYear || new Date().getFullYear()
        })

        const populated = await Schedule.findById(schedule._id)
            .populate('grade', 'name level yearNumber section')
            .populate('entries.course', 'name code teacher')

        if (req.uid) {
            await logAdminAction(req.uid, 'CREATE_SCHEDULE', `Horario creado para: ${gradeExists.name}`, req.ip)
        }

        return res.status(201).json({
            success: true,
            message: 'Horario creado exitosamente',
            schedule: populated
        })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación en el horario',
                error: error.message
            })
        }
        return res.status(500).json({
            success: false,
            message: 'Error al crear el horario',
            error: error.message
        })
    }
}

export const updateSchedule = async (req, res) => {
    try {
        const { gradeId } = req.params
        const { entries, academicYear, isActive } = req.body

        const updateData = {}
        if (entries) updateData.entries = entries
        if (academicYear) updateData.academicYear = academicYear
        if (isActive !== undefined) updateData.isActive = isActive

        const schedule = await Schedule.findOneAndUpdate(
            { grade: gradeId },
            updateData,
            { new: true, runValidators: true }
        )
            .populate('grade', 'name level yearNumber section')
            .populate('entries.course', 'name code teacher')

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Horario no encontrado para este grado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'UPDATE_SCHEDULE', `Horario actualizado para grado ID: ${gradeId}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Horario actualizado correctamente',
            schedule
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
            message: 'Error al actualizar el horario',
            error: error.message
        })
    }
}

export const deleteSchedule = async (req, res) => {
    try {
        const { gradeId } = req.params
        const schedule = await Schedule.findOneAndDelete({ grade: gradeId })

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Horario no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'DELETE_SCHEDULE', `Horario eliminado para grado ID: ${gradeId}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Horario eliminado correctamente'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el horario',
            error: error.message
        })
    }
}
