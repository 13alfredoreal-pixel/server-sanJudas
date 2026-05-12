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
        enum: ['CREATE_BOOK', 'DELETE_BOOK', 'PROMOTE_USER', 'DELETE_USER', 'CREATE_CATEGORY', 'DELETE_CATEGORY']
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
