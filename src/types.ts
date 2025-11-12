export type S3FolderFromList = {
  name: string;
  versionId?: string | undefined;
  contentType?: string | undefined;
  lastModified?: Date | undefined;
  size?: number | undefined;
  eTag?: string | undefined;
  path: string;
};
