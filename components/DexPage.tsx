import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { LendingOpportunity, Platform, SortField, SortOrder } from '../types/types';
import { Button } from './Button';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export const DexPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<LendingOpportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<LendingOpportunity[]>([]);
  const [sortedOpportunities, setSortedOpportunities] = useState<LendingOpportunity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'all' | Platform>('all');
  const [sortField, setSortField] = useState<SortField>('apy');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [rates, price] = await Promise.all([
        DataService.getLendingRates(),
        DataService.getSuiPrice()
      ]);
      setOpportunities(rates);
      setLastUpdated(new Date());
      // Reset to first page when new data is fetched
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter opportunities
  useEffect(() => {
    const result = filter === 'all' 
      ? opportunities 
      : opportunities.filter(opp => opp.platform === filter);
    
    setFilteredOpportunities(result);
    // Reset to first page when filter changes
    setCurrentPage(1);
  }, [filter, opportunities]);

  // Sort opportunities
  useEffect(() => {
    const result = [...filteredOpportunities].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'asset':
          aValue = a.asset;
          bValue = b.asset;
          break;
        case 'platform':
          aValue = a.platform;
          bValue = b.platform;
          break;
        case 'apy':
          aValue = a.apy;
          bValue = b.apy;
          break;
        case 'tvl':
          aValue = a.tvl;
          bValue = b.tvl;
          break;
        default:
          aValue = a.apy;
          bValue = b.apy;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number) 
          : (bValue as number) - (aValue as number);
      }
    });
    
    setSortedOpportunities(result);
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, [filteredOpportunities, sortField, sortOrder]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedOpportunities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedOpportunities.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-green-500" />;
      case 'down': return <TrendingDown size={16} className="text-red-500" />;
      default: return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Aggregated Markets</h1>
            <p className="text-slate-500">Explore APY rates and liquidity across decentralized protocols</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('all')}
          >
            Show All Markets
          </Button>
          <Button 
            variant={filter === 'Suilend' ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('Suilend')}
          >
            Suilend
          </Button>
          <Button 
            variant={filter === 'Navi' ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('Navi')}
          >
            Navi
          </Button>
          <Button 
            variant={filter === 'Scallop' ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('Scallop')}
          >
            Scallop
          </Button>
        </div>

        {/* Opportunities Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th 
                    className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('asset')}
                  >
                    <div className="flex items-center gap-1">
                      Asset
                      {getSortIcon('asset')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('platform')}
                  >
                    <div className="flex items-center gap-1">
                      Platform
                      {getSortIcon('platform')}
                    </div>
                  </th>
                  <th 
                    className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('apy')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      APY
                      {getSortIcon('apy')}
                    </div>
                  </th>
                  <th 
                    className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('tvl')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      TVL
                      {getSortIcon('tvl')}
                    </div>
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trend</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((opportunity) => (
                    <tr key={opportunity.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {opportunity.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{opportunity.asset}</div>
                            <div className="text-sm text-slate-500">{opportunity.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800">
                          {opportunity.platform === 'Scallop' ? (
                            <a href="https://app.scallop.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{opportunity.platform}</a>
                          ) : opportunity.platform === 'Navi' ? (
                            <a href="https://app.naviprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{opportunity.platform}</a>
                          ) : opportunity.platform === 'Suilend' ? (
                            <a href="https://suilend.fi/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{opportunity.platform}</a>
                          ) : (
                            opportunity.platform
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-medium text-slate-800">{formatPercent(opportunity.apy)}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="text-slate-800">{formatCurrency(opportunity.tvl)}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          {getTrendIcon(opportunity.trend)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="text-sm text-slate-500">
                          {opportunity.platform === 'Scallop' ? (
                            <a href="https://app.scallop.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visit Scallop</a>
                          ) : opportunity.platform === 'Navi' ? (
                            <a href="https://app.naviprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visit Navi</a>
                          ) : opportunity.platform === 'Suilend' ? (
                            <a href="https://suilend.fi/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visit Suilend</a>
                          ) : (
                            <span>Visit platform</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 px-6 text-center">
                      <div className="text-slate-500">
                        {isRefreshing ? 'Loading opportunities...' : 'No opportunities found'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <div className="text-sm text-slate-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedOpportunities.length)} of {sortedOpportunities.length} opportunities
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                
                {/* Page numbers */}
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show first, last, current, and nearby pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => paginate(pageNum)}
                        className={currentPage === pageNum ? "" : "text-slate-500"}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  
                  // Show ellipsis for skipped pages
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="px-2 py-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};