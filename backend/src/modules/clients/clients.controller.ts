import { Router } from "express";
import { clientsService } from "./clients.service.js";
import { createClientSchema } from "./clients.schemas.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const data = await clientsService.list();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createClientSchema.parse(req.body);
    const data = await clientsService.create(payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export const clientsController = router;
