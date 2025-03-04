// Combined API service for FMP and SEC EDGAR
// No date-fns dependency required

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Subtract days from a date
export function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// Format date for display (e.g., "Monday, January 1, 2023")
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Define interfaces
export interface Company {
  symbol: string;
  name: string;
  cik?: string;
  type?: string;
  exchange?: string;
  isTracked?: boolean;
}

// FMP API response interfaces
interface FmpSearchResult {
  symbol: string;
  name: string;
  type?: string;
  exchangeShortName?: string;
}

interface FmpCompanyProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

// SEC API response interfaces
interface SecCompanyTicker {
  ticker: string;
  title: string;
  cik_str: number;
}

interface SecCompanyTickersResponse {
  [key: string]: SecCompanyTicker;
}

interface SecFilingItem {
  name: string;
  type: string;
  size: number;
  last_modified: string;
}

interface SecFilingDirectory {
  item: SecFilingItem[];
  name: string;
  parent_dir: string;
}

interface SecFilingResponse {
  directory: SecFilingDirectory;
}

interface SecFiling {
  accessionNumber: string;
  filingUrl: string;
  filingDate: string;
  form: string;
  description?: string;
}

interface ApiUsage {
  count: number;
  resetDate: string; // ISO string of when the count should reset
  limit: number;
}

// FMP API implementation
const FMP_URL = 'https://financialmodelingprep.com/stable';
const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || '';

// SEC API implementation
const SEC_URL = 'https://www.sec.gov';

// API usage tracking
function trackApiUsage(increment = 1): { usage: ApiUsage, limitReached: boolean, limitApproaching: boolean } {
  if (typeof window === 'undefined') {
    // Return default values when running on server
    return {
      usage: { count: 0, resetDate: '', limit: 250 },
      limitReached: false,
      limitApproaching: false
    };
  }
  
  // Get current usage from localStorage or initialize
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  let usage: ApiUsage;
  const storedUsage = localStorage.getItem('fmpApiUsage');
  
  if (storedUsage) {
    usage = JSON.parse(storedUsage);
    
    // Check if we need to reset the counter (new day)
    const resetDate = new Date(usage.resetDate);
    if (today >= resetDate) {
      usage = {
        count: increment,
        resetDate: tomorrow.toISOString(),
        limit: 250 // Free tier limit
      };
    } else {
      // Increment the counter
      usage.count += increment;
    }
  } else {
    // Initialize usage tracking
    usage = {
      count: increment,
      resetDate: tomorrow.toISOString(),
      limit: 250 // Free tier limit
    };
  }
  
  // Save updated usage
  localStorage.setItem('fmpApiUsage', JSON.stringify(usage));
  
  // Check if we're approaching or have reached the limit
  const limitReached = usage.count >= usage.limit;
  const limitApproaching = usage.count >= (usage.limit * 0.8); // 80% of limit
  
  return { usage, limitReached, limitApproaching };
}

/**
 * Gets the current API usage
 * @returns Current API usage information
 */
export function getApiUsage(): ApiUsage {
  if (typeof window === 'undefined') {
    // Return default values when running on server
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      count: 0,
      resetDate: tomorrow.toISOString(),
      limit: 250
    };
  }
  
  const storedUsage = localStorage.getItem('fmpApiUsage');
  if (storedUsage) {
    return JSON.parse(storedUsage);
  }
  
  // Default usage if not found
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    count: 0,
    resetDate: tomorrow.toISOString(),
    limit: 250
  };
}

/**
 * Makes an API request to FMP with rate limit tracking
 * @param endpoint API endpoint
 * @param params Query parameters
 * @returns Response data
 */
async function fmpRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // Check if API key is available
  if (!FMP_KEY) {
    console.error('FMP API key is missing. Please set NEXT_PUBLIC_FMP_API_KEY in your environment variables.');
    throw new Error('API key is missing. Please check your configuration.');
  }
  
  // Build query string
  const queryParams = new URLSearchParams({
    ...params,
    apikey: FMP_KEY
  }).toString();
  
  const url = `${FMP_URL}${endpoint}?${queryParams}`;
  
  try {
    console.log(`Making request to: ${endpoint}`);
    
    const response = await fetch(url);
    
    if (typeof window !== 'undefined') {
      // Track API usage (client-side only)
      trackApiUsage(1);
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`API error (${response.status}): ${errorText}`);
      
      if (response.status === 402) {
        throw new Error(`API error: 402 - Payment Required. This endpoint requires a paid subscription.`);
      } else if (response.status === 403) {
        throw new Error(`API access forbidden (403). Your API key may be invalid or your subscription plan may not include this endpoint.`);
      } else if (response.status === 429) {
        throw new Error(`API rate limit exceeded (429). Please try again later.`);
      } else if (response.status >= 500) {
        throw new Error(`API server error (${response.status}). The Financial Modeling Prep service is experiencing issues.`);
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    const data = await response.json();
    
    // Check if the response indicates an error
    if (Array.isArray(data) && data.length === 0) {
      console.warn('API returned empty array');
    } else if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(`API error: ${data.error}`);
    }
    
    if (typeof window !== 'undefined') {
      // Cache the response (client-side only)
      const cacheKey = `fmp_cache_${endpoint}_${JSON.stringify(params)}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
    
    return data as T;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Makes an API request to SEC EDGAR
 * @param path API path
 * @returns Response data
 */
async function secRequest<T>(path: string): Promise<T> {
  const url = `${SEC_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        // Important: Declare your user agent as required by SEC
        'User-Agent': 'State of Innovation App contact@example.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('SEC API request error:', error);
    throw error;
  }
}

/**
 * Searches for companies by keywords
 * @param keywords Search terms
 * @returns Array of matching companies
 */
export async function searchCompanies(keywords: string): Promise<Company[]> {
  try {
    if (!keywords.trim()) return [];
    
    console.log('Searching for companies with query:', keywords);
    
    // Try FMP API
    const data = await fmpRequest<FmpSearchResult[]>('/search-symbol', {
      query: keywords,
      limit: '10'
    });
    
    // Map to our Company interface
    return data.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      type: item.type || 'Equity',
      exchange: item.exchangeShortName || 'Unknown',
      isTracked: false
    }));
  } catch (error) {
    console.error('Error searching companies:', error);
    
    // Try SEC API as fallback
    try {
      const secData = await secRequest<SecCompanyTickersResponse>('/files/company_tickers.json');
      
      // Convert object to array
      const companies = Object.values(secData);
      
      // Filter companies based on search term
      const searchTerm = keywords.toLowerCase();
      const results = companies
        .filter((company) => 
          company.ticker.toLowerCase().includes(searchTerm) || 
          company.title.toLowerCase().includes(searchTerm)
        )
        .slice(0, 10); // Limit to 10 results
      
      return results.map((item) => ({
        symbol: item.ticker,
        name: item.title,
        cik: item.cik_str.toString().padStart(10, '0'),
        type: 'Equity',
        isTracked: false
      }));
    } catch (secError) {
      console.error('SEC API fallback error:', secError);
      
      // Try to use cached data if both APIs fail
      if (typeof window !== 'undefined') {
        const cachedResults: Company[] = [];
        const cacheKeys = ['fmp_companies', 'sec_companies'];
        const searchTerm = keywords.toLowerCase();
        
        for (const key of cacheKeys) {
          try {
            const cachedData = JSON.parse(localStorage.getItem(key) || '[]') as Company[];
            const matches = cachedData.filter((item: Company) => 
              item.symbol.toLowerCase().includes(searchTerm) || 
              item.name.toLowerCase().includes(searchTerm)
            );
            
            matches.forEach((item: Company) => {
              cachedResults.push({
                symbol: item.symbol,
                name: item.name,
                type: item.type || 'Equity',
                exchange: item.exchange || 'Unknown',
                isTracked: false
              });
            });
          } catch (e) {
            console.error(`Error parsing cached data from ${key}:`, e);
          }
        }
        
        // Return cached results if any found
        if (cachedResults.length > 0) {
          return cachedResults.slice(0, 10);
        }
      }
      
      return [];
    }
  }
}

/**
 * Gets company profile information
 * @param symbol Company ticker symbol
 * @returns Company profile
 */
export async function getCompanyProfile(symbol: string): Promise<FmpCompanyProfile | null> {
  try {
    const data = await fmpRequest<FmpCompanyProfile[]>('/profile', {
      symbol
    });
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
}

/**
 * Gets the CIK for a company by ticker symbol
 * @param ticker Company ticker symbol
 * @returns CIK if found, null otherwise
 */
export async function getCikByTicker(ticker: string): Promise<string | null> {
  try {
    // Use SEC's company ticker mapping file
    const data = await secRequest<SecCompanyTickersResponse>('/files/company_tickers.json');
    
    // Find the company by ticker
    const tickerUpper = ticker.toUpperCase();
    const company = Object.values(data).find((c: SecCompanyTicker) => c.ticker === tickerUpper);
    
    if (company) {
      // Format CIK with leading zeros
      return company.cik_str.toString().padStart(10, '0');
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching CIK for ticker:', error);
    return null;
  }
}

/**
 * Gets company filings from the SEC EDGAR API
 * @param cik Company CIK (Central Index Key)
 * @param formType Optional form type to filter by (e.g., '10-Q', '10-K', '8-K')
 * @returns Array of filings
 */
export async function getCompanyFilings(cik: string, formType?: string): Promise<SecFiling[]> {
  try {
    // Ensure CIK is properly formatted with leading zeros
    const formattedCik = cik.padStart(10, '0');
    
    // Fetch company submissions
    const data = await secRequest<SecFilingResponse>(`/Archives/edgar/data/${formattedCik}/index.json`);
    
    if (!data.directory || !data.directory.item) {
      return [];
    }
    
    // Map to our SecFiling interface
    const filings = data.directory.item
      .filter((item) => !formType || item.name.includes(formType))
      .map((item) => {
        const accessionNumber = item.name.replace(/-/g, '');
        return {
          accessionNumber,
          filingUrl: `https://www.sec.gov/Archives/edgar/data/${formattedCik}/${accessionNumber}/${item.name}`,
          filingDate: item.last_modified,
          form: item.type,
          description: ''
        } as SecFiling;
      });
    
    // Sort by filing date (most recent first)
    filings.sort((a: SecFiling, b: SecFiling) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());
    
    return filings;
  } catch (error) {
    console.error('Error fetching company filings:', error);
    return [];
  }
} 