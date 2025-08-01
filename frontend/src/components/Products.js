import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fade,
  Zoom,
  Tooltip,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Straighten as StraightenIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Palette as PaletteIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { apiService } from '../services/api.service';
import LoadingErrorState from './LoadingErrorState';

const categoryColors = {
  flooring: '#2E7D32',
  molding: '#1976D2',
  accessory: '#7B1FA2',
  panel: '#F57F17',
  profile: '#D32F2F',
  other: '#616161'
};

const categoryIcons = {
  flooring: <PaletteIcon />,
  molding: <StraightenIcon />,
  accessory: <BuildIcon />,
  panel: <InventoryIcon />,
  profile: <StraightenIcon />,
  other: <CategoryIcon />
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'default';
    case 'out_of_stock': return 'error';
    case 'discontinued': return 'warning';
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return <CheckCircleIcon />;
    case 'inactive': return <CancelIcon />;
    case 'out_of_stock': return <WarningIcon />;
    case 'discontinued': return <CancelIcon />;
    default: return <CategoryIcon />;
  }
};

const ProductCard = React.memo(({ product, index }) => {
  const [hovered, setHovered] = useState(false);
  
  const sellingPrice = React.useMemo(() => parseFloat(product.selling_price_per_unit) || 0, [product.selling_price_per_unit]);
  const purchasePrice = React.useMemo(() => parseFloat(product.purchase_price_per_unit) || 0, [product.purchase_price_per_unit]);
  const profitPercentage = React.useMemo(() => 
    sellingPrice && purchasePrice && purchasePrice > 0
      ? ((sellingPrice - purchasePrice) / purchasePrice) * 100
      : 0, [sellingPrice, purchasePrice]);

  const stockPercentage = React.useMemo(() => 
    product.current_stock > 0 ? Math.min((product.current_stock / 100) * 100, 100) : 0, [product.current_stock]);
  const isLowStock = React.useMemo(() => product.current_stock < 20, [product.current_stock]);

  const dimensions = React.useMemo(() => [
    product.thickness_mm && `${product.thickness_mm}mm`,
    product.width_mm && `${product.width_mm}mm`, 
    product.length_mm && `${product.length_mm}mm`
  ].filter(Boolean).join(' × '), [product.thickness_mm, product.width_mm, product.length_mm]);

  return (
    <Zoom in={true} timeout={300 + index * 100}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: hovered 
            ? '0 20px 40px rgba(0,0,0,0.15)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
          '&:hover': {
            '& .product-code': {
              transform: 'scale(1.05)',
            },
            '& .price-section': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header with Code and Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box
              className="product-code"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                transition: 'transform 0.2s ease',
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: categoryColors[product.category],
                  width: 32, 
                  height: 32,
                  fontSize: '0.8rem'
                }}
              >
                {categoryIcons[product.category]}
              </Avatar>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  color: categoryColors[product.category]
                }}
              >
                {product.product_code}
              </Typography>
            </Box>
            
            <Tooltip title={`Status: ${product.status}`}>
              <Chip
                icon={getStatusIcon(product.status)}
                label={product.status.replace('_', ' ')}
                color={getStatusColor(product.status)}
                size="small"
                variant={product.status === 'active' ? 'filled' : 'outlined'}
              />
            </Tooltip>
          </Box>

          {/* Product Name */}
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #333, #666)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              minHeight: '3rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {product.unofficial_product_name || product.product_name}
          </Typography>

          {/* Category Badge */}
          <Chip
            label={product.category}
            size="small"
            sx={{
              mb: 2,
              bgcolor: categoryColors[product.category],
              color: 'white',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          />

          {/* Dimensions */}
          {dimensions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StraightenIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {dimensions}
              </Typography>
            </Box>
          )}

          {/* Surface & Finish */}
          {(product.surface || product.type_of_finish) && (
            <Box sx={{ mb: 2 }}>
              {product.surface && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Surface: {product.surface}
                </Typography>
              )}
              {product.type_of_finish && (
                <Typography variant="body2" color="text.secondary">
                  Finish: {product.type_of_finish}
                </Typography>
              )}
            </Box>
          )}

          {/* Stock Status */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Stock
              </Typography>
              <Typography 
                variant="body2" 
                color={isLowStock ? 'error.main' : 'text.primary'}
                sx={{ fontWeight: 600 }}
              >
                {product.current_stock} {product.selling_unit}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stockPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isLowStock ? 'error.main' : 'success.main',
                  borderRadius: 3
                }
              }}
            />
          </Box>

          {/* Description */}
          {product.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {product.description}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Pricing Section */}
          <Box 
            className="price-section"
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              transition: 'all 0.3s ease'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Selling Price
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {sellingPrice.toFixed(2)} {product.currency}
              </Typography>
            </Box>
            
            {product.retail_price_per_unit && parseFloat(product.retail_price_per_unit) !== sellingPrice && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Retail Price
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textDecoration: 'line-through',
                    color: 'text.secondary'
                  }}
                >
                  {parseFloat(product.retail_price_per_unit).toFixed(2)} {product.currency}
                </Typography>
              </Box>
            )}

            {profitPercentage > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'success.main',
                    fontWeight: 600
                  }}
                >
                  {profitPercentage.toFixed(1)}% profit margin
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button 
            variant="contained" 
            fullWidth
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 10px 2px rgba(102, 126, 234, .4)',
              }
            }}
          >
            View Details
          </Button>
        </CardActions>
      </Card>
    </Zoom>
  );
});

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(24); // 24 products per page for good grid layout
  const [totalProducts, setTotalProducts] = useState(0);

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300); // 300ms delay - faster response

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Only show loading for initial load or page changes, not for search
        const isSearchOnly = debouncedSearchTerm && products.length > 0;
        if (!isSearchOnly) {
          setLoading(true);
        }
        
        // Build search parameters with pagination
        const params = {
          limit: productsPerPage,
          offset: (currentPage - 1) * productsPerPage
        };
        
        // Add search filters
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (categoryFilter !== 'all') params.category = categoryFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        
        // Batch API calls to prevent multiple loading states
        const [productsData, statsData] = await Promise.all([
          apiService.getProducts(params),
          // Only fetch stats on initial load or when not searching
          currentPage === 1 && !debouncedSearchTerm 
            ? apiService.getProductStats() 
            : Promise.resolve({ total: totalProducts })
        ]);
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Update total only if we got fresh stats
        if (statsData.total !== undefined) {
          setTotalProducts(statsData.total);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, debouncedSearchTerm, categoryFilter, statusFilter, productsPerPage, products.length, totalProducts]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, categoryFilter, statusFilter]);

  // Memoize categories and statuses to prevent unnecessary re-renders
  const categories = React.useMemo(() => [...new Set(products.map(p => p.category))], [products]);
  const statuses = React.useMemo(() => [...new Set(products.map(p => p.status))], [products]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSearchChange = React.useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryChange = React.useCallback((e) => {
    setCategoryFilter(e.target.value);
  }, []);

  const handleStatusChange = React.useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  const handlePageChange = React.useCallback((_event, page) => {
    setCurrentPage(page);
  }, []);

  if (loading || error) {
    return <LoadingErrorState loading={loading} error={error} />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 2,
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Products Catalog
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Browse our comprehensive flooring and construction materials collection
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalProducts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">Total Products</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {products.filter(p => p.status === 'active').length}
                  </Typography>
                  <Typography variant="body2">Active (Current Page)</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currentPage}
                  </Typography>
                  <Typography variant="body2">Current Page</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {Math.ceil(totalProducts / productsPerPage)}
                  </Typography>
                  <Typography variant="body2">Total Pages</Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Filters */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search products by name, code, or description..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color={isSearching ? "primary" : "action"} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      borderColor: isSearching ? 'primary.main' : undefined,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={handleCategoryChange}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusChange}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {statuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Results Info */}
          {debouncedSearchTerm && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {isSearching || loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress sx={{ flexGrow: 1, height: 4, borderRadius: 2 }} />
                    <span>Searching...</span>
                  </Box>
                ) : (
                  `Found ${filteredProducts.length} products matching "${debouncedSearchTerm}"`
                )}
              </Typography>
            </Alert>
          )}
          
          {filteredProducts.length === 0 && products.length > 0 && !debouncedSearchTerm && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No products found matching your filters. Try adjusting your search criteria.
            </Alert>
          )}

          {filteredProducts.length === 0 && debouncedSearchTerm && !isSearching && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No products found for search term "{debouncedSearchTerm}". Try a different search term.
            </Alert>
          )}

          {/* Products Grid */}
          <Box sx={{ position: 'relative' }}>
            {/* Subtle loading overlay during search */}
            {(isSearching || (loading && debouncedSearchTerm)) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                }}
              >
                <LinearProgress sx={{ width: '50%', height: 6, borderRadius: 3 }} />
              </Box>
            )}
            
            <Grid container spacing={3} sx={{ opacity: (isSearching || (loading && debouncedSearchTerm)) ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
              {filteredProducts.map((product, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <ProductCard product={product} index={index} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {filteredProducts.length === 0 && products.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <InventoryIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                No products available
              </Typography>
              <Typography color="text.secondary">
                Products will appear here once they are added to the system.
              </Typography>
            </Box>
          )}

          {/* Pagination */}
          {totalProducts > productsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(totalProducts / productsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default Products;