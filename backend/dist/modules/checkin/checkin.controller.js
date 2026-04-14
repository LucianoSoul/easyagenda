import { ok } from "../../shared/utils/http.js";
import { performCheckinByTokenSchema } from "./checkin.schemas.js";
import { CheckinService } from "./checkin.service.js";
const service = new CheckinService();
export async function registerCheckinRoutes(app) {
    app.post("/by-token", async (request) => {
        const body = performCheckinByTokenSchema.parse(request.body);
        const data = await service.performByToken(body.token);
        return ok(data);
    });
}
