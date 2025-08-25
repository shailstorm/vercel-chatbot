'use client';

import { Artifact } from '@/components/create-artifact';
import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CalendarIcon,
  LineChartIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChartMetadata {
  symbol: string;
  interval: string;
  theme: 'light' | 'dark';
  chartType: 'candlestick' | 'line' | 'area' | 'bars';
  showVolume: boolean;
  indicators: string[];
}

interface ChartConfig {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  chartType?: string;
  showVolume?: boolean;
  indicators?: string[];
}

const INTERVALS = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1h' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
  { value: 'M', label: '1M' },
];

const CHART_TYPES = [
  { value: '1', label: 'Candlestick' },
  { value: '2', label: 'Bar' },
  { value: '3', label: 'Line' },
  { value: '9', label: 'Area' },
];

// Chart content component to satisfy React hooks rules
function ChartContent({ content, metadata, setMetadata, status, isInline }: {
  content: string;
  metadata: ChartMetadata | null;
  setMetadata: (metadata: ChartMetadata) => void;
  status: 'idle' | 'streaming';
  isInline?: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<any>(null);
    const [currentConfig, setCurrentConfig] = useState<ChartConfig>(() => {
      try {
        return JSON.parse(content || '{}');
      } catch {
        return { symbol: 'AAPL' };
      }
    });

    // Parse the chart configuration from content
    useEffect(() => {
      if (content) {
        try {
          const config = JSON.parse(content);
          setCurrentConfig(config);
          if (metadata) {
            setMetadata({
              ...metadata,
              symbol: config.symbol || metadata.symbol,
              interval: config.interval || metadata.interval,
              theme: config.theme || metadata.theme,
              chartType: config.chartType || metadata.chartType,
              showVolume: config.showVolume !== undefined ? config.showVolume : metadata.showVolume,
              indicators: config.indicators || metadata.indicators,
            });
          }
        } catch (error) {
          console.error('Failed to parse chart config:', error);
        }
      }
    }, [content, metadata, setMetadata]);

    // Function to initialize the TradingView widget
    const initializeWidget = useCallback(() => {
      if (!containerRef.current || !(window as any).TradingView) return;

      const chartTypeMap: Record<string, number> = {
        'candlestick': 1,
        'bars': 2,
        'line': 3,
        'area': 9,
      };

      // Helper to format symbol for TradingView
      const formatSymbol = (symbol?: string) => {
        if (!symbol) return 'NASDAQ:AAPL';
        // If already has exchange prefix, use as-is
        if (symbol.includes(':')) return symbol;
        // Add NASDAQ prefix for common US stocks
        return `NASDAQ:${symbol}`;
      };

      const widgetConfig = isInline ? {
            // Simplified config for inline view
            width: '100%',
            height: 257,
            symbol: formatSymbol(currentConfig.symbol || metadata?.symbol),
            interval: currentConfig.interval || metadata?.interval || 'D',
            timezone: 'Etc/UTC',
            theme: metadata?.theme || 'dark',
            style: chartTypeMap[metadata?.chartType || 'candlestick'] || 1,
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: false,
            container_id: containerRef.current.id,
            hide_top_toolbar: true,
            hide_legend: false,
            hide_side_toolbar: true,
            details: true,
            hotlist: false,
            calendar: false,
            show_popup_button: false,
            withdateranges: false,
            range: '3M',
            save_image: false,
            hideideas: true,
            // Enable crosshair for better hover experience
            disabled_features: ['header_symbol_search', 'header_resolutions'],
            enabled_features: ['study_templates'],
          } : {
            // Full config for expanded view
            width: '100%',
            height: 600,
            symbol: formatSymbol(currentConfig.symbol || metadata?.symbol),
            interval: currentConfig.interval || metadata?.interval || 'D',
            timezone: 'Etc/UTC',
            theme: metadata?.theme || 'dark',
            style: chartTypeMap[metadata?.chartType || 'candlestick'] || 1,
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: containerRef.current.id,
            studies: metadata?.indicators || [],
            popup_width: '1000',
            popup_height: '650',
            hide_side_toolbar: false,
            details: true,
            hotlist: true,
            calendar: false,
            show_popup_button: true,
            withdateranges: true,
            range: '12M',
            save_image: true,
            hideideas: true,
          };

      widgetRef.current = new (window as any).TradingView.widget(widgetConfig);
    }, [currentConfig.symbol, currentConfig.interval, metadata, isInline]);

    // Initialize TradingView widget
    useEffect(() => {
      if (!containerRef.current || status === 'streaming') return;

      // Check if TradingView is already loaded
      if ((window as any).TradingView) {
        initializeWidget();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        initializeWidget();
      };

      containerRef.current.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }, [currentConfig.symbol, currentConfig.interval, metadata, status, isInline, initializeWidget]);

    const handleIntervalChange = (interval: string) => {
      if (metadata) {
        setMetadata({ ...metadata, interval });
        setCurrentConfig({ ...currentConfig, interval });
      }
    };

    const handleChartTypeChange = (type: string) => {
      const typeMap: Record<string, string> = {
        '1': 'candlestick',
        '2': 'bars',
        '3': 'line',
        '9': 'area',
      };
      if (metadata) {
        setMetadata({ ...metadata, chartType: typeMap[type] as any });
      }
    };

    return (
      <div className={`flex flex-col ${isInline ? 'h-[257px]' : 'h-full'}`}>
        {/* Chart Controls - only show in full view */}
        {!isInline && (
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <LineChartIcon className="size-4" />
              <span className="font-semibold text-lg">
                {currentConfig.symbol || 'Loading...'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={metadata?.interval || 'D'}
                onValueChange={handleIntervalChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  metadata?.chartType === 'candlestick' ? '1' :
                  metadata?.chartType === 'bars' ? '2' :
                  metadata?.chartType === 'line' ? '3' :
                  metadata?.chartType === 'area' ? '9' : '1'
                }
                onValueChange={handleChartTypeChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* TradingView Widget Container */}
        <div className={`w-full ${isInline ? 'h-[257px]' : 'flex-1 min-h-[600px]'}`}>
          <div 
            id={`tradingview_${Date.now()}`}
            ref={containerRef}
            className="size-full"
          />
        </div>

        {/* Chart Info Footer - only show in full view */}
        {!isInline && (
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Real-time data provided by TradingView</span>
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3" />
                <span>Live Market Data</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}

export const chartArtifact = new Artifact<'chart', ChartMetadata>({
  kind: 'chart',
  description: 'Live interactive financial charts with TradingView',
  actions: [],
  toolbar: [],
  initialize: async ({ setMetadata }) => {
    setMetadata({
      symbol: 'AAPL',
      interval: 'D',
      theme: 'dark',
      chartType: 'candlestick',
      showVolume: true,
      indicators: ['MA:50', 'MA:200'],
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'data-chartDelta') {
      setArtifact((draftArtifact) => {
        const config: ChartConfig = JSON.parse(streamPart.data || '{}');
        return {
          ...draftArtifact,
          content: JSON.stringify(config),
          isVisible: true,
          status: 'streaming',
        };
      });
    }
  },
  content: ChartContent,
});