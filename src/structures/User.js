const Client = require("../client/Client");
class User {
  constructor(client, data) {
    this.client = client;
    this.id = data.id;
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.globalName = data.global_name ?? null;
    this.avatar = data.avatar ?? null;
    this.bot = data.bot ?? false;
    this.system = data.system ?? false;
    this.mfaEnabled = data.mfa_enabled ?? null;
    this.banner = data.banner ?? null;
    this.accentColor = data.accent_color ?? null;
    this.locale = data.locale ?? null;
    this.verified = data.verified ?? null;
    this.email = data.email ?? null;
    this.flags = data.flags ?? 0;
    this.premiumType = data.premium_type ?? 0;
    this.publicFlags = data.public_flags ?? 0;
  }

  get tag() {
    return `${this.username}#${this.discriminator}`;
  }
  get mention() {
    return `<@${this.id}>`;
  }
  avatarURL(size = 1024) {
    if (!this.avatar) return null;
    const Avatarformat = this.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${Avatarformat}?size=${size}`;
  }
  bannerURL(size = 1024) {
    if (!this.banner) return null;
    const Bannerformat = this.banner.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${Bannerformat}?size=${size}`;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      discriminator: this.discriminator,
      globalName: this.globalName,
      avatar: this.avatar,
      bot: this.bot,
      system: this.system,
      mfaEnabled: this.mfaEnabled,
      banner: this.banner,
      accentColor: this.accentColor,
      locale: this.locale,
      verified: this.verified,
      email: this.email,
      flags: this.flags,
      premiumType: this.premiumType,
      publicFlags: this.publicFlags,
    };
  }
}

module.exports = User;
