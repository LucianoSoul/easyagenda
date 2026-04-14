import { TemplatesRepository } from "./templates.repository.js";
import { SettingsRepository } from "../settings/settings.repository.js";
export class TemplatesService {
    repository;
    settingsRepository;
    constructor(repository = new TemplatesRepository(), settingsRepository = new SettingsRepository()) {
        this.repository = repository;
        this.settingsRepository = settingsRepository;
    }
    async listTemplatesForUser(userId) {
        const settings = await this.settingsRepository.getByUserId(userId);
        const profileType = settings?.professional_profile ?? "general";
        return this.repository.listByProfile(profileType);
    }
    async applyTemplate(userId, templateCode) {
        return this.repository.applyTemplate(userId, templateCode);
    }
}
