// Minimal BarcodeDetector types for browsers that support the API

interface BarcodeDetectionBarcode {
  rawValue?: string;
  format?: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: Array<{ x: number; y: number }>;
}

interface BarcodeDetector {
  detect(source: ImageBitmapSource): Promise<BarcodeDetectionBarcode[]>;
}

declare var BarcodeDetector: {
  prototype: BarcodeDetector;
  new(options?: { formats?: string[] }): BarcodeDetector;
  getSupportedFormats?(): Promise<string[]>;
};

export {};
