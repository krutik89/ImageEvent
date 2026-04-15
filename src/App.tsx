/**
 * Dev preview harness — simulates Lens production behavior.
 * NOT included in production webpack entries.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ImageWidgetConfig } from './iosense-sdk/types';

// Import self-registration side effects
import './components/ImageWidget/index';
import './components/ImageWidgetConfiguration/index';

const WIDGET_ID  = 'dev-image-widget';
const CONFIG_ID  = 'dev-image-widget-config';
const AUTH_TOKEN = localStorage.getItem('bearer_token') ?? 'dev-token';

// Sample data matching the format the platform resolver produces
const SAMPLE_DATA = [{ data: 75 }, { data: 25 }, { data: 50 }];

const INITIAL_CONFIG: ImageWidgetConfig = {
  source: { customValue: '' },
  conditions: [],
  defaultImageUrl: '',
  defaultImageName: '',
  link: { url: '' },
  style: {
    wrapInCard: true,
    backgroundColor: '',
    borderColor: '',
    borderWidth: '',
    borderRadius: '',
    padding: '',
  },
};

declare global {
  interface Window {
    ReactWidgets: Record<string, { mount: Function; update: Function; unmount: Function }>;
  }
}

export const App: React.FC = () => {
  const widgetMounted  = useRef(false);
  const configMounted  = useRef(false);
  const [config, setConfig] = useState<ImageWidgetConfig>(INITIAL_CONFIG);

  // Mount widget
  useEffect(() => {
    if (!widgetMounted.current) {
      window.ReactWidgets['ImageWidget'].mount(WIDGET_ID, {
        config,
        data: SAMPLE_DATA,
        authentication: AUTH_TOKEN,
      });
      widgetMounted.current = true;
    }
  }, []);

  // Mount config panel
  useEffect(() => {
    if (!configMounted.current) {
      window.ReactWidgets['ImageWidgetConfiguration'].mount(CONFIG_ID, {
        config,
        authentication: AUTH_TOKEN,
        onChange: handleConfigChange,
      });
      configMounted.current = true;
    }
  }, []);

  const handleConfigChange = (updated: ImageWidgetConfig) => {
    console.log('ImageWidget config:', updated);
    setConfig(updated);
    window.ReactWidgets['ImageWidget'].update(WIDGET_ID, {
      config: updated,
      data: SAMPLE_DATA,
      authentication: AUTH_TOKEN,
    });
    window.ReactWidgets['ImageWidgetConfiguration'].update(CONFIG_ID, {
      config: updated,
      authentication: AUTH_TOKEN,
      onChange: handleConfigChange,
    });
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Config panel — ~35% */}
      <div
        style={{
          width: '35%',
          height: '100%',
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto',
        }}
        id={CONFIG_ID}
      />

      {/* Widget preview — ~65% */}
      <div
        style={{
          flex: 1,
          height: '100%',
          padding: '24px',
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div
          id={WIDGET_ID}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
