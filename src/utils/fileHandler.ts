import { readFile } from 'fs/promises';

export interface NetworkData {
  nodes: any[];
  links: any[];
}

export async function readNetworkData(filePath: string): Promise<NetworkData> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error('Error reading network data:', error);
    throw new Error('Failed to read network data file');
  }
} 