function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('图片转换失败'));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(blob);
  });
}

// `blob:` addresses are owned by the current browser document and become
// invalid after refresh. Persist the bytes in Zustand's web storage instead.
export async function persistImageUri(imageUri: string): Promise<string> {
  if (!imageUri.startsWith('blob:')) return imageUri;
  const response = await fetch(imageUri);
  if (!response.ok) throw new Error('无法保存这张浏览器照片');
  return blobToDataUri(await response.blob());
}
