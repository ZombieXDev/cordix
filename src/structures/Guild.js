const Client = require("../client/Client");
const User = require("./User");

class Guild {
  /**
   * Represents a Discord Guild (Server)
   * @param {Client} client - The client instance
   * @param {object} data - Raw guild data from Discord API
   */
  constructor(client, data) {
    this.client = client;
    this.id = data.id;
    this.name = data.name;
    this.icon = data.icon ?? null;
    this.banner = data.banner ?? null;
    this.splash = data.splash ?? null;
    this.region = data.region ?? null;
    this.ownerID = data.owner_id;
    this.verificationLevel = data.verification_level;
    this.explicitContentFilter = data.explicit_content_filter;
    this.defaultMessageNotifications = data.default_message_notifications;
    this.afkChannelID = data.afk_channel_id ?? null;
    this.afkTimeout = data.afk_timeout ?? 300;
    this.systemChannelID = data.system_channel_id ?? null;
    this.publicUpdatesChannelID = data.public_updates_channel_id ?? null;
    this.maxMembers = data.max_members ?? 0;
    this.memberCount = data.member_count ?? 0;

    this.channels = data.channels ?? [];
    this.roles = data.roles ?? [];

    this.members =
      data.members?.map((member) => ({
        user: new User(client, member.user),
        roles: member.roles,
        nick: member.nick ?? null,
        joinedAt: new Date(member.joined_at),
        mute: member.mute ?? false,
        deaf: member.deaf ?? false,
        premiumSince: member.premium_since
          ? new Date(member.premium_since)
          : null,
      })) ?? [];

    this.features = data.features ?? [];
    this.premiumTier = data.premium_tier ?? 0;
    this.premiumSubscriptionCount = data.premium_subscription_count ?? 0;
    this.maxVideoChannelUsers = data.max_video_channel_users ?? 25;
    this.maxStageVideoChannelUsers = data.max_stage_video_channel_users ?? 50;

    this.threads = data.threads ?? [];
    this.stageInstances = data.stage_instances ?? [];
    this.voiceStates = data.voice_states ?? [];
    this.presences = data.presences ?? [];
    this.stickers = data.stickers ?? [];
    this.emojis = data.emojis ?? [];
  }

  /**
   * Get URL for server icon
   * @param {number} size - Image size (default 1024)
   * @returns {string|null} URL or null if not set
   */
  iconURL(size = 1024) {
    if (!this.icon) return null;
    return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.png?size=${size}`;
  }

  /**
   * Get URL for server banner
   * @param {number} size - Image size (default 1024)
   * @returns {string|null} URL or null if not set
   */
  bannerURL(size = 1024) {
    if (!this.banner) return null;
    const format = this.banner.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${format}?size=${size}`;
  }

  /**
   * Get URL for server splash image
   * @param {number} size - Image size (default 1024)
   * @returns {string|null} URL or null if not set
   */
  splashURL(size = 1024) {
    if (!this.splash) return null;
    return `https://cdn.discordapp.com/splashes/${this.id}/${this.splash}.png?size=${size}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      banner: this.banner,
      splash: this.splash,
      ownerID: this.ownerID,
      verificationLevel: this.verificationLevel,
      explicitContentFilter: this.explicitContentFilter,
      defaultMessageNotifications: this.defaultMessageNotifications,
      afkChannelID: this.afkChannelID,
      afkTimeout: this.afkTimeout,
      systemChannelID: this.systemChannelID,
      publicUpdatesChannelID: this.publicUpdatesChannelID,
      maxMembers: this.maxMembers,
      memberCount: this.memberCount,
      channels: this.channels,
      roles: this.roles,
      members: this.members.map((m) => m.user.toJSON()),
      features: this.features,
      premiumTier: this.premiumTier,
      premiumSubscriptionCount: this.premiumSubscriptionCount,
      threads: this.threads,
      stageInstances: this.stageInstances,
      voiceStates: this.voiceStates,
      presences: this.presences,
      stickers: this.stickers,
      emojis: this.emojis,
    };
  }
}

module.exports = Guild;
