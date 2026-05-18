import { faEye, faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';

const isValidUrl = (value?: string | null) => {
  if (!value?.trim()) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

interface VR360PreviewFrameProps {
  panoramaUrl?: string | null;
  vr360Link?: string | null;
  title?: string;
  height?: number;
}

const VR360PreviewFrame: React.FC<VR360PreviewFrameProps> = ({
  panoramaUrl,
  vr360Link,
  title = 'VR360 Preview',
  height = 500,
}) => {
  const hasPanorama = isValidUrl(panoramaUrl);
  const hasVr360Link = isValidUrl(vr360Link);
  const [panoramaFailed, setPanoramaFailed] = useState(false);

  useEffect(() => {
    setPanoramaFailed(false);
  }, [panoramaUrl, vr360Link]);

  const previewUrl = useMemo(() => {
    if (hasPanorama && !panoramaFailed) {
      return panoramaUrl!;
    }
    if (hasVr360Link) {
      return vr360Link!;
    }
    return null;
  }, [hasPanorama, hasVr360Link, panoramaFailed, panoramaUrl, vr360Link]);

  if (!previewUrl) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <FontAwesomeIcon icon={faEye} className="text-slate-600" />
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      </div>

      <div className="overflow-hidden rounded-lg border-2 border-slate-300 bg-slate-50">
        <div className="relative w-full" style={{ height: `${height}px` }}>
          <iframe
            key={previewUrl}
            src={previewUrl}
            className="absolute left-0 top-0 h-full w-full"
            allowFullScreen
            title={title}
            allow="xr-spatial-tracking; gyroscope; accelerometer"
            onError={() => {
              if (hasPanorama && previewUrl === panoramaUrl) {
                setPanoramaFailed(true);
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => window.open(previewUrl, '_blank')}
          className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-6 py-2 text-white transition-colors hover:bg-slate-700"
        >
          <FontAwesomeIcon icon={faPlay} />
          View Fullscreen
        </button>
      </div>
    </div>
  );
};

export default VR360PreviewFrame;
