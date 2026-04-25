import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const stepTypeEnum = pgEnum("step_type", ["photo", "video", "first_word", "milestone"]);

export const followStatusEnum = pgEnum("follow_status", ["pending", "accepted", "rejected"]);

// ── better-auth required tables ───────────────────────────────────────────────
// These are managed by the better-auth Drizzle adapter.
// Column names must match exactly what better-auth expects.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  bio: text("bio"),
  location: text("location"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── App tables ────────────────────────────────────────────────────────────────

export const baby = pgTable(
  "baby",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    birthdate: text("birthdate").notNull(), // "YYYY-MM-DD"
    photoUrl: text("photo_url"), // Vercel Blob CDN URL
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("baby_user_idx").on(t.userId),
  })
);

export const savedLocation = pgTable(
  "saved_location",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    address: text("address").notNull(),
    fullName: text("full_name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("saved_loc_user_idx").on(t.userId),
  })
);

export const step = pgTable(
  "step",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    babyId: text("baby_id")
      .notNull()
      .references(() => baby.id, { onDelete: "cascade" }),
    photoUrl: text("photo_url"), // Vercel Blob CDN URL
    date: text("date").notNull(), // "YYYY-MM-DD"
    locationId: text("location_id").references(() => savedLocation.id, {
      onDelete: "set null",
    }),
    locationNickname: text("location_nickname"), // denormalized for fast display
    isMajor: boolean("is_major").notNull().default(false),
    type: stepTypeEnum("type").notNull().default("photo"),
    firstWord: text("first_word"), // for first_word type
    title: text("title"),
    caption: text("caption"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    babyIdx: index("step_baby_idx").on(t.babyId),
    babyDateIdx: index("step_baby_date_idx").on(t.babyId, t.date),
  })
);

export const dailyDescription = pgTable(
  "daily_description",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    babyId: text("baby_id")
      .notNull()
      .references(() => baby.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    description: text("description").notNull().default(""),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueBabyDate: unique().on(t.babyId, t.date), // one description per baby per day
  })
);

export const follow = pgTable(
  "follow",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: followStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueFollowerFollowing: unique().on(t.followerId, t.followingId),
    followingIdx: index("follow_following_idx").on(t.followingId, t.status),
    followerIdx: index("follow_follower_idx").on(t.followerId, t.status),
    noSelfFollow: check("follow_no_self_follow_check", sql`${t.followerId} <> ${t.followingId}`),
  })
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  babies: many(baby),
  savedLocations: many(savedLocation),
  followers: many(follow, { relationName: "following" }),
  following: many(follow, { relationName: "follower" }),
}));

export const babyRelations = relations(baby, ({ one, many }) => ({
  user: one(user, { fields: [baby.userId], references: [user.id] }),
  steps: many(step),
  dailyDescriptions: many(dailyDescription),
}));

export const stepRelations = relations(step, ({ one }) => ({
  baby: one(baby, { fields: [step.babyId], references: [baby.id] }),
  location: one(savedLocation, {
    fields: [step.locationId],
    references: [savedLocation.id],
  }),
}));

export const dailyDescriptionRelations = relations(dailyDescription, ({ one }) => ({
  baby: one(baby, { fields: [dailyDescription.babyId], references: [baby.id] }),
}));

export const savedLocationRelations = relations(savedLocation, ({ one }) => ({
  user: one(user, { fields: [savedLocation.userId], references: [user.id] }),
}));

export const followRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "follower",
  }),
  following: one(user, {
    fields: [follow.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));

// ── Exported types ────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Baby = typeof baby.$inferSelect;
export type Step = typeof step.$inferSelect;
export type DailyDescription = typeof dailyDescription.$inferSelect;
export type SavedLocation = typeof savedLocation.$inferSelect;
export type NewStep = typeof step.$inferInsert;
export type NewBaby = typeof baby.$inferInsert;
export type Follow = typeof follow.$inferSelect;
export type NewFollow = typeof follow.$inferInsert;
