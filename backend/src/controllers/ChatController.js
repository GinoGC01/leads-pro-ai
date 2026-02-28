import ChatSession from '../models/ChatSession.js';

class ChatController {
    /**
     * Get all chat sessions for a specific campaign or lead
     * GET /api/chat/sessions?campaignId=X or ?leadId=Y
     */
    static async getSessions(req, res) {
        try {
            const { campaignId, leadId } = req.query;

            let filter = {};
            if (campaignId) {
                filter.campaignId = campaignId;
            } else if (leadId) {
                filter.leadId = leadId;
            } else {
                return res.status(400).json({ error: 'Debes proveer un campaignId o un leadId' });
            }

            const sessions = await ChatSession.find(filter)
                .select('_id title updatedAt')
                .sort({ updatedAt: -1 });

            res.json(sessions);
        } catch (error) {
            console.error('[ChatController] Error fetching sessions:', error);
            res.status(500).json({ error: 'Error interno al obtener las sesiones' });
        }
    }

    /**
     * Get a specific chat session with its full message history
     * GET /api/chat/sessions/:id
     */
    static async getSession(req, res) {
        try {
            const session = await ChatSession.findById(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }
            res.json(session);
        } catch (error) {
            console.error('[ChatController] Error fetching session:', error);
            res.status(500).json({ error: 'Error interno al obtener la sesión' });
        }
    }

    /**
     * Rename a chat session
     * PATCH /api/chat/sessions/:id
     */
    static async renameSession(req, res) {
        try {
            const { title } = req.body;
            if (!title || title.trim().length === 0) {
                return res.status(400).json({ error: 'El título es obligatorio' });
            }

            const session = await ChatSession.findByIdAndUpdate(
                req.params.id,
                { title: title.trim() },
                { new: true }
            );

            if (!session) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }
            res.json(session);
        } catch (error) {
            console.error('[ChatController] Error renaming session:', error);
            res.status(500).json({ error: 'Error interno al renombrar la sesión' });
        }
    }

    /**
     * Delete a chat session
     * DELETE /api/chat/sessions/:id
     */
    static async deleteSession(req, res) {
        try {
            const session = await ChatSession.findByIdAndDelete(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }
            res.json({ success: true, message: 'Sesión eliminada' });
        } catch (error) {
            console.error('[ChatController] Error deleting session:', error);
            res.status(500).json({ error: 'Error interno al eliminar la sesión' });
        }
    }
}

export default ChatController;
