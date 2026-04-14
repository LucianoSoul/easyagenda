import {
  getSchedulingGatewaySettings,
  getServiceAttendanceMode
} from "../../shared/utils/delivery-modes.js";
import { LookupsRepository } from "./lookups.repository.js";

export class LookupsService {
  constructor(private readonly repository = new LookupsRepository()) {}

  async listClients(input: { accountId: string; userId: string }) {
    return this.repository.listClients(input);
  }

  async listServices(input: { accountId: string; userId: string }) {
    const result = await this.repository.listServices(input);
    const scheduling = getSchedulingGatewaySettings(result.gatewaySettings);

    return result.services.map((service) => ({
      ...service,
      attendance_mode: getServiceAttendanceMode(scheduling, service.id)
    }));
  }
}
