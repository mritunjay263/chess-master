"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const ai_service_1 = require("../services/ai.service");
const chess_js_1 = require("chess.js");
exports.aiController = {
    async getBestMove(req, res) {
        try {
            const { fen, depth, skillLevel } = req.query;
            if (!fen || typeof fen !== 'string') {
                res.status(400).json({ error: 'FEN position required' });
                return;
            }
            // Validate FEN by trying to create a Chess instance
            let chess;
            try {
                chess = new chess_js_1.Chess(fen);
            }
            catch {
                res.status(400).json({ error: 'Invalid FEN string' });
                return;
            }
            const move = await ai_service_1.aiService.getBestMove(fen, depth ? parseInt(depth, 10) : 3, skillLevel ? parseInt(skillLevel, 10) : 5);
            if (!move) {
                res.status(400).json({ error: 'No move available' });
                return;
            }
            res.json(move);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getMoveSuggestions(req, res) {
        try {
            const { fen, count } = req.query;
            if (!fen || typeof fen !== 'string') {
                res.status(400).json({ error: 'FEN position required' });
                return;
            }
            let chess2;
            try {
                chess2 = new chess_js_1.Chess(fen);
            }
            catch {
                res.status(400).json({ error: 'Invalid FEN string' });
                return;
            }
            const suggestions = await ai_service_1.aiService.getMoveSuggestions(fen, count ? parseInt(count, 10) : 3);
            res.json({ suggestions });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};
//# sourceMappingURL=ai.controller.js.map