import { getSchedulingGatewaySettings, getServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";
import { LookupsRepository } from "./lookups.repository.js";
export class LookupsService {
    repository;
    constructor(repository = new LookupsRepository()) {
        this.repository = repository;
    }
    async listClients(input) {
        return this.repository.listClients(input);
    }
    async listServices(input) {
        const result = await this.repository.listServices(input);
        const scheduling = getSchedulingGatewaySettings(result.gatewaySettings);
        return result.services.map((service) => ({
            ...service,
            attendance_mode: getServiceAttendanceMode(scheduling, service.id)
        }));
    }
}
