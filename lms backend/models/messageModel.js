const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters']
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'file', 'system'],
            default: 'text'
        },
        // For file/image messages
        attachment: {
            url: String,
            filename: String,
            fileType: String,
            fileSize: Number
        },
        // Read status
        readBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }],
        // For message editing
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        // Soft delete
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date
    },
    {
        timestamps: true
    }
);

// Indexes for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Don't return deleted messages by default
messageSchema.pre(/^find/, function(next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

// Method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
    const alreadyRead = this.readBy.some(
        read => read.user.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
        this.readBy.push({ user: userId, readAt: new Date() });
        await this.save();
    }
    
    return this;
};

module.exports = mongoose.model('Message', messageSchema);
