import { Router } from "express";
import { accountsService } from "./accounts.service.js";
import { createAccountSchema } from "./accounts.schemas.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const data = await accountsService.list();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createAccountSchema.parse(req.body);
    const data = await accountsService.create(payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export const accountsController = router;
