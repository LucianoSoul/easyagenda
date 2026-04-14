import { Router } from "express";
import { attendanceService } from "./attendance.service.js";
import { createAttendanceSchema } from "./attendance.schemas.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const data = await attendanceService.list();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = createAttendanceSchema.parse(req.body);
    const data = await attendanceService.create(payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export const attendanceController = router;
