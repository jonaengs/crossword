export function fileIntoString(file: File, encoding?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    // TODO: Deal with encodings. For example, windows users will likely upload utf-16. Maybe allow user to specify encooding in upload dialog?
    reader.readAsText(file, encoding);
  });
}
