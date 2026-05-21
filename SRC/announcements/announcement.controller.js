import Announcement from './announcement.model.js'
import { logAdminAction } from '../audit/audit.logger.js'

export const getAnnouncements = async (req, res) => {
    try {
        const { type, audience, grade, pinned, page = 1, limit = 20 } = req.query
        let filter = { isActive: true }

        if (type) filter.type = type.toUpperCase()
        if (audience) filter.targetAudience = audience.toUpperCase()
        if (grade) filter.grade = grade
        if (pinned === 'true') filter.isPinned = true

        filter.$or = [
            { expiresAt: null },
            { expiresAt: { $gte: new Date() } }
        ]

        const pageNumber = parseInt(page)
        const limitNumber = parseInt(limit)
        const skip = (pageNumber - 1) * limitNumber

        const announcements = await Announcement.find(filter)
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)

        const totalAnnouncements = await Announcement.countDocuments(filter)

        return res.status(200).json({
            success: true,
            announcements,
            pagination: {
                total: totalAnnouncements,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalAnnouncements / limitNumber)
            }
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los anuncios',
            error: error.message
        })
    }
}

export const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Anuncio no encontrado'
            })
        }

        return res.status(200).json({
            success: true,
            announcement
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el anuncio',
            error: error.message
        })
    }
}

export const getAnnouncementsByGrade = async (req, res) => {
    try {
        const { gradeId } = req.params

        const announcements = await Announcement.find({
            isActive: true,
            $or: [
                { grade: gradeId, targetAudience: 'GRADO_ESPECIFICO' },
                { targetAudience: 'TODOS' }
            ],
            $and: [
                {
                    $or: [
                        { expiresAt: null },
                        { expiresAt: { $gte: new Date() } }
                    ]
                }
            ]
        })
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')
            .sort({ isPinned: -1, createdAt: -1 })

        return res.status(200).json({
            success: true,
            total: announcements.length,
            announcements
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener anuncios del grado',
            error: error.message
        })
    }
}

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, grade, targetAudience, type, isPinned, expiresAt } = req.body

        const cleanTitle = (title || '').trim()
        const cleanContent = (content || '').trim()

        if (!cleanTitle) {
            return res.status(400).json({
                success: false,
                message: 'El título del anuncio es obligatorio'
            })
        }
        if (!cleanContent) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del anuncio es obligatorio'
            })
        }

        const announcementData = {
            title: cleanTitle,
            content: cleanContent,
            targetAudience: (targetAudience || 'TODOS').toUpperCase(),
            type: (type || 'GENERAL').toUpperCase(),
            isPinned: isPinned || false,
            createdBy: req.uid
        }

        if (grade) announcementData.grade = grade
        if (expiresAt) announcementData.expiresAt = new Date(expiresAt)

        const announcement = await Announcement.create(announcementData)

        const populated = await Announcement.findById(announcement._id)
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')

        if (req.uid) {
            await logAdminAction(req.uid, 'CREATE_ANNOUNCEMENT', `Anuncio creado: ${cleanTitle}`, req.ip)
        }

        return res.status(201).json({
            success: true,
            message: 'Anuncio creado exitosamente',
            announcement: populated
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
            message: 'Error al crear el anuncio',
            error: error.message
        })
    }
}

export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params
        const data = { ...req.body }

        const protectedFields = ['_id', 'createdAt', 'updatedAt', 'createdBy']
        protectedFields.forEach(field => delete data[field])

        if (data.targetAudience) data.targetAudience = data.targetAudience.toUpperCase()
        if (data.type) data.type = data.type.toUpperCase()
        if (data.expiresAt) data.expiresAt = new Date(data.expiresAt)

        const announcement = await Announcement.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        })
            .populate('grade', 'name level yearNumber')
            .populate('createdBy', 'name surname')

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Anuncio no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'UPDATE_ANNOUNCEMENT', `Anuncio actualizado: ${announcement.title}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Anuncio actualizado correctamente',
            announcement
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
            message: 'Error al actualizar el anuncio',
            error: error.message
        })
    }
}

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params
        const announcement = await Announcement.findByIdAndDelete(id)

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Anuncio no encontrado'
            })
        }

        if (req.uid) {
            await logAdminAction(req.uid, 'DELETE_ANNOUNCEMENT', `Anuncio eliminado: ${announcement.title}`, req.ip)
        }

        return res.status(200).json({
            success: true,
            message: 'Anuncio eliminado correctamente'
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el anuncio',
            error: error.message
        })
    }
}
