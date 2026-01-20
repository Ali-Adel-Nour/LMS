const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        // Track the context (e.g., related to a course or book session)
        context: {
            type: {
                type: String,
                enum: ['general', 'course', 'bookSession'],
                default: 'general'
            },
            referenceId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'context.refModel'
            },
            refModel: {
                type: String,
                enum: ['Course', 'BookSession']
            }
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        lastMessageAt: {
            type: Date,
            default: Date.now
        },
        // Track unread counts per participant
        unreadCounts: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            count: {
                type: Number,
                default: 0
            }
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'context.referenceId': 1 });

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function(participant1, participant2, context = {}) {
    let conversation = await this.findOne({
        participants: { $all: [participant1, participant2] },
        'context.type': context.type || 'general'
    });

    if (!conversation) {
        conversation = await this.create({
            participants: [participant1, participant2],
            context: {
                type: context.type || 'general',
                referenceId: context.referenceId,
                refModel: context.refModel
            },
            unreadCounts: [
                { user: participant1, count: 0 },
                { user: participant2, count: 0 }
            ]
        });
    }

    return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
