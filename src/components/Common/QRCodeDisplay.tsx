import React, { useState } from 'react';
import { Download, Share2, Copy, CheckCircle } from 'lucide-react';

interface QRCodeDisplayProps {
  qrData: {
    dataURL: string;
    trackingUrl: string;
    eventId: string;
  };
  title: string;
  subtitle: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrData, title, subtitle }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrData.dataURL;
    link.download = `${qrData.eventId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrData.trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Track this ${title.toLowerCase()} using this link`,
          url: qrData.trackingUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-green-800 mb-2">{title}</h3>
        <p className="text-green-600">{subtitle}</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-green-100">
          <img 
            src={qrData.dataURL} 
            alt={title}
            className="w-48 h-48 block"
          />
        </div>
      </div>

      {/* Tracking URL */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-green-100">
        <label className="block text-sm font-medium text-green-700 mb-2">
          Tracking URL
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={qrData.trackingUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono"
          />
          <button
            onClick={handleCopyUrl}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            title="Copy URL"
          >
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        {copied && (
          <p className="text-xs text-green-600 mt-1">URL copied to clipboard!</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Download QR</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span>Share Link</span>
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;