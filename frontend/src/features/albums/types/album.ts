import type { z } from "zod";
import type { AlbumNameRequestSchema, AlbumResponseSchema, AddAlbumMemberRequestSchema, UpdateAlbumMemberRequestSchema } from "@/features/albums/schemas/album";
import type { AlbumMemberSchema } from "@/features/albums/schemas/albumMember";

export type AlbumResponse = z.infer<typeof AlbumResponseSchema>;
export type CreateAlbumRequest = z.infer<typeof AlbumNameRequestSchema>;
export type UpdateAlbumRequest = z.infer<typeof AlbumNameRequestSchema>;

export type AlbumMemberResponse = z.infer<typeof AlbumMemberSchema>;
export type AddAlbumMemberRequest = z.infer<typeof AddAlbumMemberRequestSchema>;
export type UpdateAlbumMemberRequest = z.infer<typeof UpdateAlbumMemberRequestSchema>;
