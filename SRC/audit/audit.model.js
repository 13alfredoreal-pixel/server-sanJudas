import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE_BOOK', 'DELETE_BOOK',
            'PROMOTE_USER', 'DELETE_USER',
            'CREATE_CATEGORY', 'DELETE_CATEGORY',
            'CREATE_GRADE', 'UPDATE_GRADE', 'DELETE_GRADE',
            'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE',
            'CREATE_ASSIGNMENT', 'UPDATE_ASSIGNMENT', 'DELETE_ASSIGNMENT',
            'CREATE_ANNOUNCEMENT', 'UPDATE_ANNOUNCEMENT', 'DELETE_ANNOUNCEMENT',
            'CREATE_SCHEDULE', 'UPDATE_SCHEDULE', 'DELETE_SCHEDULE'
        ]
    },
    details: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});

export default model('AuditLog', auditLogSchema);
