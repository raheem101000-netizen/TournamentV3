// Safe stub for ObjectStorageService on Vercel
// The actual file storage is now handled by Postgres (uploaded_files table) via server/routes.ts

import { Response } from "express";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() { }

  getPublicObjectSearchPaths(): Array<string> {
    return [];
  }

  getPrivateObjectDir(): string {
    return "/tmp";
  }

  async searchPublicObject(filePath: string): Promise<any | null> {
    return null;
  }

  async downloadObject(file: any, res: Response, cacheTtlSec: number = 3600) {
    res.status(404).json({ error: "Not found" });
  }

  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    throw new Error("Not implemented in Vercel environment");
  }

  async getObjectEntityFile(objectPath: string): Promise<any> {
    throw new ObjectNotFoundError();
  }

  normalizeObjectEntityPath(rawPath: string): string {
    return rawPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: any
  ): Promise<string> {
    // No-op for DB storage
    return rawPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: any;
    requestedPermission?: any;
  }): Promise<boolean> {
    return true;
  }
}
