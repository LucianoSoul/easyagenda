import { SettingsRepository } from "./settings.repository.js";

export class SettingsService {
  constructor(private readonly repository = new SettingsRepository()) {}

  async getSettings(userId: string) {
    return this.repository.getByUserId(userId);
  }

  async updateSettings(userId: string, patch: Record<string, unknown>) {
    return this.repository.updateByUserId(userId, patch);
  }
}
