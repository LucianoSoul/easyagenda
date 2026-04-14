import { TemplatesRepository } from "./templates.repository.js";
import { SettingsRepository } from "../settings/settings.repository.js";

export class TemplatesService {
  constructor(
    private readonly repository = new TemplatesRepository(),
    private readonly settingsRepository = new SettingsRepository()
  ) {}

  async listTemplatesForUser(userId: string) {
    const settings = await this.settingsRepository.getByUserId(userId);
    const profileType = settings?.professional_profile ?? "general";
    return this.repository.listByProfile(profileType);
  }

  async applyTemplate(userId: string, templateCode: string) {
    return this.repository.applyTemplate(userId, templateCode);
  }
}
