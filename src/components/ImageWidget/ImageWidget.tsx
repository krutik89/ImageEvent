import '@faclon-labs/design-sdk/styles.css';
import React, { useState, useEffect } from 'react';
import './ImageWidget.css';
import { ImageWidgetConfig, ImageWidgetData, ConditionOperator } from '../../iosense-sdk/types';

interface ImageWidgetProps {
  config: ImageWidgetConfig;
  data?: ImageWidgetData;
  authentication: string;
  timeChange?: (payload: { startTime: number | string; endTime: number | string }) => void;
  chartChange?: (payload: { activeIndex: number }) => void;
}

const EVALUATE: Record<ConditionOperator, (a: number, b: number) => boolean> = {
  '>':  (a, b) => a > b,
  '<':  (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
};

function resolveImage(config: ImageWidgetConfig | undefined, data: ImageWidgetData | undefined): string {
  if (!config) return '';

  console.log('[ImageWidget] resolveImage — data:', data);
  console.log('[ImageWidget] resolveImage — conditions:', config.conditions);

  if (Array.isArray(data) && Array.isArray(config.conditions)) {
    for (const condition of config.conditions) {
      const raw = data[condition.dataPointIndex ?? 0]?.data;
      const dataValue = parseFloat(String(raw));   // handles both string "24145.78" and number 24145.78
      const threshold = parseFloat(condition.value);
      const fn = EVALUATE[condition.operator];
      const result = !isNaN(dataValue) && !isNaN(threshold) && fn && fn(dataValue, threshold);
      console.log(
        `[ImageWidget] condition — data[${condition.dataPointIndex}].data=${dataValue} ${condition.operator} ${condition.value} →`,
        result
      );
      if (result) return condition.imageUrl || '';
    }
  }

  return config.defaultImageUrl || '';
}

function navigateLink(url: string): void {
  if (!url || !url.trim()) return;
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin === window.location.origin) {
      // Same origin — use internal routing without a full page reload
      window.history.pushState(null, '', parsed.pathname + parsed.search + parsed.hash);
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export const ImageWidget: React.FC<ImageWidgetProps> = ({
  config,
  data,
}) => {
  const [currentConfig, setCurrentConfig] = useState<ImageWidgetConfig | undefined>(config);
  const [currentData, setCurrentData] = useState<ImageWidgetData | undefined>(data);

  useEffect(() => {
    console.log('[ImageWidget] config:', config);
    setCurrentConfig(config);
  }, [config]);

  useEffect(() => {
    console.log('[ImageWidget] data:', data);
    setCurrentData(data);
  }, [data]);

  const imageUrl = resolveImage(currentConfig, currentData);
  const linkUrl    = currentConfig?.link?.url?.trim();
  const isClickable = !!linkUrl;
  const style       = currentConfig?.style;
  const wrapInCard  = style?.wrapInCard ?? true;

  // Dynamic design tokens applied as CSS custom properties so BEM classes can read them
  const dynamicVars = {
    '--iw-bg':             style?.backgroundColor  || (wrapInCard ? 'var(--background-default-intense)' : 'transparent'),
    '--iw-border-color':   style?.borderColor      || 'var(--border-gray-subtle)',
    '--iw-border-width':   style?.borderWidth      ? `${style.borderWidth}px` : (wrapInCard ? '1px' : '0px'),
    '--iw-border-radius':  style?.borderRadius     ? `${style.borderRadius}px` : 'var(--global-border-radius-large)',
    '--iw-padding':        style?.padding          ? `${style.padding}px`  : 'var(--spacing-04)',
  } as React.CSSProperties;

  const handleClick = () => {
    if (isClickable) navigateLink(linkUrl!);
  };

  return (
    <div
      className={`image-widget${wrapInCard ? ' image-widget--card' : ''}${isClickable ? ' image-widget--clickable' : ''}`}
      style={dynamicVars}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      {imageUrl ? (
        <img
          className="image-widget__image"
          src={imageUrl}
          alt="Image widget"
          draggable={false}
        />
      ) : (
        <div className="image-widget__empty">
          <span className="BodyMediumRegular image-widget__empty-text">No image configured</span>
        </div>
      )}
    </div>
  );
};
