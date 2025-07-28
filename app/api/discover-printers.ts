import type { NextApiRequest, NextApiResponse } from 'next';
import dgram from 'dgram';

interface DiscoveryRequest {
  broadcastAddress: string;
  port: number;
  timeout: number;
}

interface DiscoveredPrinter {
  id: string;
  data: {
    Name: string;
    MachineName: string;
    BrandName: string;
    MainboardIP: string;
    MainboardID: string;
    ProtocolVersion: string;
    FirmwareVersion: string;
  };
  timestamp: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { broadcastAddress, port, timeout }: DiscoveryRequest = req.body;

  if (!broadcastAddress || !port) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const discoveredPrinters = await discoverPrintersUDP(broadcastAddress, port, timeout || 5000);
    res.status(200).json(discoveredPrinters);
  } catch (error) {
    console.error('UDP discovery error:', error);
    res.status(500).json({ error: 'Discovery failed', details: error });
  }
}

async function discoverPrintersUDP(broadcastAddress: string, port: number, timeout: number): Promise<DiscoveredPrinter[]> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const discoveredPrinters: DiscoveredPrinter[] = [];
    const startTime = Date.now();

    // Set up socket
    socket.on('error', (err) => {
      console.error('UDP socket error:', err);
      socket.close();
      reject(err);
    });

    socket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        
        // Check if this is a printer response
        if (data && (data.Name || data.MachineName || data.MainboardID)) {
          const printer: DiscoveredPrinter = {
            id: generateUUID(),
            data: {
              Name: data.Name || 'Unknown Printer',
              MachineName: data.MachineName || 'Unknown',
              BrandName: data.BrandName || 'Elegoo',
              MainboardIP: rinfo.address,
              MainboardID: data.MainboardID || 'unknown',
              ProtocolVersion: data.ProtocolVersion || 'V3.0.0',
              FirmwareVersion: data.FirmwareVersion || 'V1.0.0',
            },
            timestamp: Date.now(),
          };

          // Check for duplicates
          const existingIndex = discoveredPrinters.findIndex(
            p => p.data.MainboardIP === printer.data.MainboardIP
          );

          if (existingIndex === -1) {
            discoveredPrinters.push(printer);
            console.log('Discovered printer:', printer.data.Name, 'at', printer.data.MainboardIP);
          }
        }
      } catch (error) {
        console.warn('Failed to parse printer response:', error);
      }
    });

    // Bind socket
    socket.bind(() => {
      socket.setBroadcast(true);
      
      // Send discovery broadcast
      const discoveryMessage = JSON.stringify({
        type: 'discovery',
        timestamp: Date.now(),
        protocol: 'SDCP',
        version: '3.0.0'
      });

      socket.send(discoveryMessage, port, broadcastAddress, (err) => {
        if (err) {
          console.error('Failed to send discovery broadcast:', err);
          socket.close();
          reject(err);
          return;
        }

        console.log(`Discovery broadcast sent to ${broadcastAddress}:${port}`);
      });

      // Set timeout
      setTimeout(() => {
        socket.close();
        console.log(`Discovery completed. Found ${discoveredPrinters.length} printers.`);
        resolve(discoveredPrinters);
      }, timeout);
    });
  });
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 