import { Router } from "express";
import { creditsService } from "./credits.service.js";
import { createCreditSchema } from "./credits.schemas.js";
const router = Router();
router.get("/", async (_req, res, next) => {
    try {
        const data = await creditsService.list();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const payload = createCreditSchema.parse(req.body);
        const data = await creditsService.create(payload);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
export const creditsController = router;
