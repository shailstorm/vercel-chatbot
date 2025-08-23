import { createDocumentHandler } from '@/lib/artifacts/server';

export const chartDocumentHandler = createDocumentHandler({
  kind: 'chart',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // Default chart configuration
    const defaultConfig = {
      symbol: 'AAPL',
      interval: 'D',
      theme: 'dark',
      chartType: 'candlestick',
      showVolume: true,
      indicators: ['MA:50', 'MA:200'],
    };

    // Extract symbol from title - look for stock tickers like AAPL, TSLA, etc.
    const symbolMatch = title.match(/\b([A-Z]{1,5})\b/);
    if (symbolMatch) {
      defaultConfig.symbol = symbolMatch[1];
    }
    
    // Also check for common company names
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('apple')) defaultConfig.symbol = 'AAPL';
    else if (lowerTitle.includes('tesla')) defaultConfig.symbol = 'TSLA';
    else if (lowerTitle.includes('microsoft')) defaultConfig.symbol = 'MSFT';
    else if (lowerTitle.includes('amazon')) defaultConfig.symbol = 'AMZN';
    else if (lowerTitle.includes('google') || lowerTitle.includes('alphabet')) defaultConfig.symbol = 'GOOGL';
    else if (lowerTitle.includes('nvidia')) defaultConfig.symbol = 'NVDA';
    else if (lowerTitle.includes('meta') || lowerTitle.includes('facebook')) defaultConfig.symbol = 'META';

    // Stream the chart configuration
    dataStream.write({
      type: 'data-chartDelta',
      data: JSON.stringify(defaultConfig),
    });

    return JSON.stringify(defaultConfig);
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    try {
      const currentConfig = JSON.parse(document.content || '{}');
      
      // Parse description to update chart config
      const updatedConfig = { ...currentConfig };
      
      // Check for symbol changes
      const symbolMatch = description.match(/symbol[:\s]+([A-Z]{1,5})/i);
      if (symbolMatch) {
        updatedConfig.symbol = symbolMatch[1];
      }
      
      // Check for interval changes
      const intervalMatch = description.match(/interval[:\s]+(\w+)/i);
      if (intervalMatch) {
        updatedConfig.interval = intervalMatch[1];
      }
      
      // Check for chart type changes
      if (description.toLowerCase().includes('candlestick')) {
        updatedConfig.chartType = 'candlestick';
      } else if (description.toLowerCase().includes('line')) {
        updatedConfig.chartType = 'line';
      } else if (description.toLowerCase().includes('area')) {
        updatedConfig.chartType = 'area';
      } else if (description.toLowerCase().includes('bar')) {
        updatedConfig.chartType = 'bars';
      }
      
      // Check for theme changes
      if (description.toLowerCase().includes('light theme')) {
        updatedConfig.theme = 'light';
      } else if (description.toLowerCase().includes('dark theme')) {
        updatedConfig.theme = 'dark';
      }
      
      // Check for volume toggle
      if (description.toLowerCase().includes('hide volume')) {
        updatedConfig.showVolume = false;
      } else if (description.toLowerCase().includes('show volume')) {
        updatedConfig.showVolume = true;
      }
      
      // Stream the updated configuration
      dataStream.write({
        type: 'data-chartDelta',
        data: JSON.stringify(updatedConfig),
      });
      
      return JSON.stringify(updatedConfig);
    } catch (error) {
      console.error('Failed to update chart:', error);
      return document.content || '{}';
    }
  },
});