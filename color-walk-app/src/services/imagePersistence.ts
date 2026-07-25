// Native camera/library URIs are already usable after app reload. The web
// implementation replaces short-lived blob URLs with a persistable data URI.
export async function persistImageUri(imageUri: string): Promise<string> {
  return imageUri;
}
