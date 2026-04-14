import { SettingsRepository } from "./settings.repository.js";
export class SettingsService {
    repository;
    constructor(repository = new SettingsRepository()) {
        this.repository = repository;
    }
    async getSettings(userId) {
        return this.repository.getByUserId(userId);
    }
    async updateSettings(userId, patch) {
        return this.repository.updateByUserId(userId, patch);
    }
}
