import { EditableCrossword } from './crossword';

// TODO: Convert to Uint8Array.prototype.toBase64() when availability is better
function b64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]!);
  }

  return btoa(binString);
}

function b64Decode(encoded: string): ArrayBuffer {
  const binString = atob(encoded);
  const bytes = new Uint8Array(binString.length);

  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }

  return bytes;
}

function compress(str: string): Promise<ArrayBuffer> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(str));
  writer.close();

  // Create a response whose body is the compression stream so that we can easily read the entire stream contents
  const response = new Response(cs.readable);
  return response.arrayBuffer();
}

function decompress(buffer: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(buffer);
  writer.close();

  const response = new Response(ds.readable);
  return response.text();
}

export function serializeCrossword(crossword: EditableCrossword): Promise<string> {
  const json = JSON.stringify(crossword);
  return compress(json).then(b64Encode);
}

export function deserializeCrossword(encoded: string): Promise<EditableCrossword> {
  const jsonPromise = decompress(b64Decode(encoded));
  return jsonPromise.then(JSON.parse);
}
