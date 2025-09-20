import QRCode from 'qrcode';

class QRService {
  private baseUrl = window.location.origin;

  async generateQR(data: any, title: string): Promise<{ success: boolean; dataURL?: string; trackingUrl?: string; qrHash?: string; error?: string }> {
    try {
      const qrData = {
        ...data,
        trackingUrl: `${this.baseUrl}/track/${data.eventId}`,
        timestamp: Date.now(),
        version: '1.0'
      };

      const qrString = JSON.stringify(qrData);
      const qrHash = await this.generateHash(qrString);
      
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#2D5A27',
          light: '#FFFFFF'
        },
        width: 300
      });

      return {
        success: true,
        dataURL: qrCodeDataURL,
        trackingUrl: qrData.trackingUrl,
        qrHash
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async generateCollectionQR(batchId: string, eventId: string, herbSpecies: string, collectorName: string) {
    const data = {
      type: 'collection',
      batchId,
      eventId,
      herbSpecies,
      collector: collectorName
    };

    return await this.generateQR(data, `Collection-${batchId}`);
  }

  async generateQualityTestQR(batchId: string, eventId: string, parentEventId: string, testerName: string) {
    const data = {
      type: 'quality_test',
      batchId,
      eventId,
      parentEventId,
      tester: testerName
    };

    return await this.generateQR(data, `QualityTest-${eventId}`);
  }

  async generateProcessingQR(batchId: string, eventId: string, parentEventId: string, processorName: string, method: string) {
    const data = {
      type: 'processing',
      batchId,
      eventId,
      parentEventId,
      processor: processorName,
      method
    };

    return await this.generateQR(data, `Processing-${eventId}`);
  }

  async generateManufacturingQR(batchId: string, eventId: string, parentEventId: string, manufacturerName: string, productName: string) {
    const data = {
      type: 'manufacturing',
      batchId,
      eventId,
      parentEventId,
      manufacturer: manufacturerName,
      productName
    };

    return await this.generateQR(data, `Manufacturing-${eventId}`);
  }

  parseQRData(qrString: string) {
    try {
      const qrData = JSON.parse(qrString);
      
      if (!qrData.eventId || !qrData.type || !qrData.batchId) {
        throw new Error('Invalid QR code format');
      }

      return {
        success: true,
        data: qrData
      };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const qrService = new QRService();
export default qrService;