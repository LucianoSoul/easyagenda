import { Router } from "express";
import { usersService } from "./users.service.js";
import { createUserSchema } from "./users.schemas.js";
const router = Router();
router.get("/", async (_req, res, next) => {
    try {
        const data = await usersService.list();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const payload = createUserSchema.parse(req.body);
        const data = await usersService.create(payload);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
export const usersController = router;
