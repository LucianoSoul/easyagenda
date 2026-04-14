import { Router } from "express";
import { servicesService } from "./services.service.js";
import { createServiceSchema } from "./services.schemas.js";
const router = Router();
router.get("/", async (_req, res, next) => {
    try {
        const data = await servicesService.list();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const payload = createServiceSchema.parse(req.body);
        const data = await servicesService.create(payload);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
export const servicesController = router;
