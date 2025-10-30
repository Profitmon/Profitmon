import { create } from "ipfs-http-client";

const ipfs = create({ url: "https://ipfs.infura.io:5001/api/v0" });

export async function uploadMetadataCopy(metadata: any): Promise<string> {
  const { path } = await ipfs.add(JSON.stringify(metadata));
  return `https://ipfs.io/ipfs/${path}`;
}
