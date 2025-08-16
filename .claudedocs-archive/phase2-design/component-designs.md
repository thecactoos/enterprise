# Component Designs - Advanced Pricing System Components

## Overview
Detailed Material UI component specifications for the advanced pricing management system, designed for integration with existing Polish Construction CRM frontend patterns.

## 1. Advanced Quote Builder Component

### QuoteBuilder Main Interface
```typescript
interface QuoteBuilderProps {
  contactId?: string;
  initialItems?: QuoteItem[];
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

interface QuoteItem {
  id: string;
  type: 'product' | 'service';
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  total: number;
}
```

### Component Structure
```jsx
<Container maxWidth="xl">
  <Grid container spacing={3}>
    {/* Left Panel - Item Selection */}
    <Grid item xs={12} md={4}>
      <QuoteItemSelector 
        onAddItem={handleAddItem}
        products={products}
        services={services}
      />
    </Grid>
    
    {/* Center Panel - Quote Builder */}
    <Grid item xs={12} md={5}>
      <QuoteItemsList 
        items={quoteItems}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        onReorderItems={handleReorderItems}
      />
    </Grid>
    
    {/* Right Panel - Calculations & Preview */}
    <Grid item xs={12} md={3}>
      <QuoteCalculations 
        items={quoteItems}
        contact={selectedContact}
        onUpdateDiscount={handleDiscountUpdate}
      />
    </Grid>
  </Grid>
</Container>
```

### QuoteItemSelector Component
```jsx
<Paper elevation={3} sx={{ p: 3, height: '70vh', overflow: 'hidden' }}>
  <Typography variant="h6" gutterBottom>
    Dodaj Pozycje do Oferty
  </Typography>
  
  <Tabs value={activeTab} onChange={handleTabChange}>
    <Tab label="Produkty" icon={<InventoryIcon />} />
    <Tab label="Usługi" icon={<BuildIcon />} />
    <Tab label="Ulubione" icon={<StarIcon />} />
  </Tabs>
  
  <Box sx={{ mt: 2, mb: 2 }}>
    <TextField
      fullWidth
      placeholder="Szukaj produktów i usług..."
      value={searchQuery}
      onChange={handleSearch}
      InputProps={{
        startAdornment: <SearchIcon />,
        endAdornment: searchQuery && (
          <IconButton onClick={clearSearch}>
            <ClearIcon />
          </IconButton>
        )
      }}
    />
  </Box>
  
  <Box sx={{ height: 'calc(100% - 140px)', overflow: 'auto' }}>
    {activeTab === 0 && (
      <ProductList 
        products={filteredProducts}
        onAddProduct={handleAddProduct}
        searchHighlight={searchQuery}
      />
    )}
    {activeTab === 1 && (
      <ServiceList 
        services={filteredServices}
        onAddService={handleAddService}
        searchHighlight={searchQuery}
      />
    )}
    {activeTab === 2 && (
      <FavoritesList 
        favorites={favoriteItems}
        onAddFavorite={handleAddFavorite}
      />
    )}
  </Box>
</Paper>
```

### Drag-and-Drop Quote Items List
```jsx
<Paper elevation={3} sx={{ p: 3 }}>
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h6">
      Pozycje Oferty ({quoteItems.length})
    </Typography>
    <Chip 
      label={`Suma: ${formatPLN(totalAmount)}`}
      color="primary"
      variant="outlined"
    />
  </Box>
  
  <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="quote-items">
      {(provided) => (
        <List 
          {...provided.droppableProps}
          ref={provided.innerRef}
          sx={{ maxHeight: '60vh', overflow: 'auto' }}
        >
          {quoteItems.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided, snapshot) => (
                <ListItem
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  sx={{
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemIcon {...provided.dragHandleProps}>
                    <DragIndicatorIcon />
                  </ListItemIcon>
                  
                  <QuoteItemCard 
                    item={item}
                    onUpdate={handleUpdateItem}
                    onRemove={handleRemoveItem}
                  />
                </ListItem>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </List>
      )}
    </Droppable>
  </DragDropContext>
  
  {quoteItems.length === 0 && (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      py={4}
      color="text.secondary"
    >
      <AddShoppingCartIcon sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h6">Brak pozycji w ofercie</Typography>
      <Typography variant="body2">
        Dodaj produkty lub usługi z lewego panelu
      </Typography>
    </Box>
  )}
</Paper>
```

### QuoteItemCard Component
```jsx
<Card sx={{ width: '100%', mb: 1 }}>
  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
    <Grid container spacing={2} alignItems="center">
      {/* Item Info */}
      <Grid item xs={12} sm={4}>
        <Box display="flex" alignItems="center" gap={1}>
          {item.type === 'product' ? <InventoryIcon /> : <BuildIcon />}
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {item.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {item.code || item.id}
            </Typography>
          </Box>
        </Box>
      </Grid>
      
      {/* Quantity Controls */}
      <Grid item xs={6} sm={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton 
            size="small"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <RemoveIcon />
          </IconButton>
          <TextField
            size="small"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value))}
            inputProps={{ 
              style: { textAlign: 'center', width: '60px' },
              min: 0.01,
              step: 0.01,
              type: 'number'
            }}
          />
          <IconButton 
            size="small"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" display="block" textAlign="center">
          {item.unit}
        </Typography>
      </Grid>
      
      {/* Unit Price */}
      <Grid item xs={6} sm={2}>
        <TextField
          size="small"
          label="Cena jedn."
          value={item.unitPrice}
          onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">PLN</InputAdornment>
          }}
          inputProps={{ 
            step: 0.01,
            min: 0,
            type: 'number'
          }}
        />
      </Grid>
      
      {/* Total & Actions */}
      <Grid item xs={8} sm={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" color="primary">
              {formatPLN(item.total)}
            </Typography>
            {item.discount && (
              <Typography variant="caption" color="success.main">
                Rabat: -{item.discount}%
              </Typography>
            )}
          </Box>
          <IconButton 
            color="error"
            onClick={() => onRemove(item.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Grid>
      
      {/* Discount Controls */}
      <Grid item xs={4} sm={1}>
        <Tooltip title="Rabat">
          <IconButton 
            size="small"
            onClick={() => openDiscountDialog(item.id)}
            color={item.discount ? "success" : "default"}
          >
            <PercentIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  </CardContent>
</Card>
```

## 2. Real-time Calculation Display Components

### QuoteCalculations Panel
```jsx
<Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
  <Typography variant="h6" gutterBottom>
    Podsumowanie Oferty
  </Typography>
  
  {/* Subtotal Section */}
  <Box mb={3}>
    <Divider sx={{ mb: 2 }} />
    {calculationBreakdown.map((line, index) => (
      <Box key={index} display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2" color="textSecondary">
          {line.label}
        </Typography>
        <Typography variant="body2">
          {formatPLN(line.amount)}
        </Typography>
      </Box>
    ))}
  </Box>
  
  {/* Discount Section */}
  <Box mb={3}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
      <Typography variant="body2">
        Rabat ogółem
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        <TextField
          size="small"
          value={globalDiscount}
          onChange={handleGlobalDiscountChange}
          inputProps={{ 
            style: { width: '60px', textAlign: 'right' },
            max: 50,
            min: 0,
            type: 'number'
          }}
          InputProps={{
            endAdornment: <span>%</span>
          }}
        />
        <Typography variant="body2" color="success.main">
          -{formatPLN(discountAmount)}
        </Typography>
      </Box>
    </Box>
  </Box>
  
  {/* Totals Section */}
  <Divider sx={{ mb: 2 }} />
  <Box mb={1}>
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body1">
        Wartość netto:
      </Typography>
      <Typography variant="body1" fontWeight="medium">
        {formatPLN(netTotal)}
      </Typography>
    </Box>
  </Box>
  
  <Box mb={1}>
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body1">
        VAT (23%):
      </Typography>
      <Typography variant="body1" fontWeight="medium">
        {formatPLN(vatAmount)}
      </Typography>
    </Box>
  </Box>
  
  <Divider sx={{ my: 2 }} />
  <Box display="flex" justifyContent="space-between" mb={3}>
    <Typography variant="h5" color="primary">
      Wartość brutto:
    </Typography>
    <Typography variant="h5" color="primary" fontWeight="bold">
      {formatPLN(grossTotal)}
    </Typography>
  </Box>
  
  {/* Action Buttons */}
  <Stack spacing={2}>
    <Button 
      variant="contained" 
      size="large"
      startIcon={<SaveIcon />}
      onClick={handleSaveQuote}
      disabled={quoteItems.length === 0}
    >
      Zapisz Ofertę
    </Button>
    
    <Button 
      variant="outlined"
      startIcon={<PictureAsPdfIcon />}
      onClick={handleGeneratePDF}
      disabled={quoteItems.length === 0}
    >
      Generuj PDF
    </Button>
    
    <Button 
      variant="outlined"
      startIcon={<EmailIcon />}
      onClick={handleSendEmail}
      disabled={quoteItems.length === 0}
    >
      Wyślij Email
    </Button>
  </Stack>
  
  {/* Calculation Animation */}
  <AnimatePresence>
    {isCalculating && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1} 
          mt={2}
          color="primary.main"
        >
          <CircularProgress size={16} />
          <Typography variant="caption">
            Przeliczanie...
          </Typography>
        </Box>
      </motion.div>
    )}
  </AnimatePresence>
</Paper>
```

### Real-time Price Calculator Hook
```typescript
const useQuoteCalculations = (items: QuoteItem[], globalDiscount: number = 0) => {
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    discountAmount: 0,
    netTotal: 0,
    vatAmount: 0,
    grossTotal: 0,
    breakdown: []
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  
  useEffect(() => {
    const calculateTotals = async () => {
      setIsCalculating(true);
      
      // Simulate real-time calculation delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let subtotal = 0;
      const breakdown = [];
      
      // Calculate subtotal for each item
      items.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discount ? (itemTotal * item.discount / 100) : 0;
        const itemNet = itemTotal - itemDiscount;
        
        subtotal += itemNet;
        breakdown.push({
          label: `${item.name} (${item.quantity} ${item.unit})`,
          amount: itemNet
        });
      });
      
      // Apply global discount
      const globalDiscountAmount = subtotal * (globalDiscount / 100);
      const netTotal = subtotal - globalDiscountAmount;
      
      // Calculate VAT (23% standard rate)
      const vatAmount = netTotal * 0.23;
      const grossTotal = netTotal + vatAmount;
      
      setCalculations({
        subtotal,
        discountAmount: globalDiscountAmount,
        netTotal,
        vatAmount,
        grossTotal,
        breakdown
      });
      
      setIsCalculating(false);
    };
    
    calculateTotals();
  }, [items, globalDiscount]);
  
  return { calculations, isCalculating };
};
```

## 3. Service Recommendation Engine UI

### ServiceRecommendationPanel Component
```jsx
<Paper elevation={2} sx={{ p: 3, mb: 3 }}>
  <Box display="flex" alignItems="center" gap={2} mb={2}>
    <AutoAwesomeIcon color="primary" />
    <Typography variant="h6">
      Rekomendowane Usługi
    </Typography>
    <Chip 
      label={`${recommendations.length} propozycji`}
      size="small"
      color="primary"
      variant="outlined"
    />
  </Box>
  
  <Typography variant="body2" color="textSecondary" mb={3}>
    Na podstawie wybranych produktów sugerujemy następujące usługi:
  </Typography>
  
  <Grid container spacing={2}>
    {recommendations.map((service) => (
      <Grid item xs={12} sm={6} md={4} key={service.id}>
        <ServiceRecommendationCard 
          service={service}
          matchingProducts={service.matchingProducts}
          onAdd={handleAddService}
          onViewDetails={handleViewServiceDetails}
        />
      </Grid>
    ))}
  </Grid>
  
  {recommendations.length === 0 && (
    <Box textAlign="center" py={3} color="text.secondary">
      <LightbulbIcon sx={{ fontSize: 48, mb: 1 }} />
      <Typography variant="body1">
        Dodaj produkty aby zobaczyć rekomendacje usług
      </Typography>
    </Box>
  )}
</Paper>
```

### ServiceRecommendationCard Component
```jsx
<Card 
  sx={{ 
    height: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4
    }
  }}
>
  <CardContent sx={{ p: 2 }}>
    {/* Service Header */}
    <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
        {service.category === 'WOOD_GLUE' ? '🪵' : '🔧'}
      </Avatar>
      <Box flex={1}>
        <Typography variant="body2" fontWeight="medium" noWrap>
          {service.serviceName}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {service.category} • {service.material}
        </Typography>
      </Box>
      <Chip 
        label={`${service.matchScore}% dopasowanie`}
        size="small"
        color={service.matchScore >= 90 ? 'success' : service.matchScore >= 70 ? 'warning' : 'default'}
        variant="outlined"
      />
    </Box>
    
    {/* Matching Products */}
    <Box mb={2}>
      <Typography variant="caption" color="textSecondary" gutterBottom>
        Pasuje do produktów:
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {service.matchingProducts?.slice(0, 3).map((product) => (
          <Chip 
            key={product.id}
            label={product.name}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        ))}
        {service.matchingProducts?.length > 3 && (
          <Chip 
            label={`+${service.matchingProducts.length - 3}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>
    </Box>
    
    {/* Pricing */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Box>
        <Typography variant="h6" color="primary">
          {formatPLN(service.basePricePerM2)}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          za m²
        </Typography>
      </Box>
      <Box textAlign="right">
        <Typography variant="body2" color="textSecondary">
          Min. koszt
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {formatPLN(service.minimumCharge)}
        </Typography>
      </Box>
    </Box>
    
    {/* Action Buttons */}
    <Stack direction="row" spacing={1}>
      <Button 
        variant="contained"
        size="small"
        fullWidth
        startIcon={<AddIcon />}
        onClick={(e) => {
          e.stopPropagation();
          onAdd(service);
        }}
      >
        Dodaj
      </Button>
      <IconButton 
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails(service);
        }}
      >
        <InfoIcon />
      </IconButton>
    </Stack>
  </CardContent>
</Card>
```

### Service Matching Algorithm
```typescript
interface ServiceRecommendation extends Service {
  matchScore: number;
  matchingProducts: Product[];
  reasonCodes: string[];
}

const generateServiceRecommendations = (
  selectedProducts: Product[],
  availableServices: Service[]
): ServiceRecommendation[] => {
  const recommendations: ServiceRecommendation[] = [];
  
  availableServices.forEach(service => {
    const matchingProducts: Product[] = [];
    let totalScore = 0;
    const reasonCodes: string[] = [];
    
    selectedProducts.forEach(product => {
      let productScore = 0;
      
      // Category matching
      if (service.material === Material.WOOD && product.category === ProductCategory.FLOORING) {
        productScore += 40;
        reasonCodes.push('material_match');
      }
      
      // Product type matching
      if (product.product_name.toLowerCase().includes('deska') && 
          service.flooringForm === FlooringForm.PLANK) {
        productScore += 30;
        reasonCodes.push('form_match');
      }
      
      // Installation method matching
      if (product.additional_item_description?.toLowerCase().includes('klej') &&
          service.installationMethod === InstallationMethod.GLUE) {
        productScore += 20;
        reasonCodes.push('installation_match');
      }
      
      if (productScore > 50) {
        matchingProducts.push(product);
        totalScore += productScore;
      }
    });
    
    if (matchingProducts.length > 0) {
      const averageScore = Math.min(Math.round(totalScore / selectedProducts.length), 100);
      
      recommendations.push({
        ...service,
        matchScore: averageScore,
        matchingProducts,
        reasonCodes: [...new Set(reasonCodes)]
      });
    }
  });
  
  return recommendations
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6); // Top 6 recommendations
};
```

## 4. Invoice Generation Interface

### InvoiceGenerator Component
```jsx
<Dialog 
  open={open} 
  onClose={onClose}
  maxWidth="lg" 
  fullWidth
  PaperProps={{ sx: { height: '90vh' } }}
>
  <DialogTitle>
    <Box display="flex" alignItems="center" gap={2}>
      <ReceiptIcon />
      <Typography variant="h6">
        Generowanie Faktury z Oferty
      </Typography>
      <Chip label={`Oferta #${quote.number}`} variant="outlined" />
    </Box>
  </DialogTitle>
  
  <DialogContent sx={{ p: 0 }}>
    <Grid container sx={{ height: '100%' }}>
      {/* Left Panel - Invoice Form */}
      <Grid item xs={12} md={6} sx={{ p: 3, borderRight: '1px solid', borderColor: 'divider' }}>
        <InvoiceForm 
          quote={quote}
          onInvoiceDataChange={handleInvoiceDataChange}
        />
      </Grid>
      
      {/* Right Panel - Live Preview */}
      <Grid item xs={12} md={6} sx={{ bgcolor: 'grey.50' }}>
        <InvoicePreview 
          invoiceData={invoiceData}
          quote={quote}
        />
      </Grid>
    </Grid>
  </DialogContent>
  
  <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
    <Button onClick={onClose}>
      Anuluj
    </Button>
    <Button 
      variant="outlined"
      startIcon={<VisibilityIcon />}
      onClick={handlePreviewPDF}
    >
      Podgląd PDF
    </Button>
    <Button 
      variant="contained"
      startIcon={<DownloadIcon />}
      onClick={handleGenerateInvoice}
      disabled={!isInvoiceValid}
    >
      Generuj Fakturę
    </Button>
  </DialogActions>
</Dialog>
```

### InvoiceForm Component
```jsx
<Box sx={{ height: '100%', overflow: 'auto' }}>
  <Typography variant="h6" gutterBottom>
    Dane Faktury
  </Typography>
  
  {/* Invoice Header */}
  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
    <Typography variant="subtitle2" gutterBottom>
      Podstawowe Informacje
    </Typography>
    
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Numer faktury"
          value={invoiceData.number}
          onChange={(e) => updateInvoiceData('number', e.target.value)}
          placeholder="FV/2024/08/001"
          required
        />
      </Grid>
      <Grid item xs={6}>
        <DatePicker
          label="Data wystawienia"
          value={invoiceData.issueDate}
          onChange={(date) => updateInvoiceData('issueDate', date)}
          renderInput={(params) => <TextField {...params} fullWidth required />}
        />
      </Grid>
      <Grid item xs={6}>
        <DatePicker
          label="Data sprzedaży"
          value={invoiceData.saleDate}
          onChange={(date) => updateInvoiceData('saleDate', date)}
          renderInput={(params) => <TextField {...params} fullWidth required />}
        />
      </Grid>
      <Grid item xs={6}>
        <DatePicker
          label="Termin płatności"
          value={invoiceData.paymentDue}
          onChange={(date) => updateInvoiceData('paymentDue', date)}
          renderInput={(params) => <TextField {...params} fullWidth required />}
        />
      </Grid>
    </Grid>
  </Paper>
  
  {/* Company Data */}
  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
    <Typography variant="subtitle2" gutterBottom>
      Dane Sprzedawcy
    </Typography>
    
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nazwa firmy"
          value={invoiceData.seller.name}
          onChange={(e) => updateSellerData('name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Adres"
          value={invoiceData.seller.address}
          onChange={(e) => updateSellerData('address', e.target.value)}
          multiline
          rows={2}
          required
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="NIP"
          value={invoiceData.seller.nip}
          onChange={(e) => updateSellerData('nip', e.target.value)}
          InputProps={{
            inputComponent: NIPInputMask
          }}
          required
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="REGON"
          value={invoiceData.seller.regon}
          onChange={(e) => updateSellerData('regon', e.target.value)}
        />
      </Grid>
    </Grid>
  </Paper>
  
  {/* Buyer Data */}
  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="subtitle2">
        Dane Nabywcy
      </Typography>
      {quote.contact && (
        <Button 
          size="small"
          startIcon={<PersonIcon />}
          onClick={handleLoadContactData}
        >
          Wczytaj z kontaktu
        </Button>
      )}
    </Box>
    
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nazwa/Imię i nazwisko"
          value={invoiceData.buyer.name}
          onChange={(e) => updateBuyerData('name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Adres"
          value={invoiceData.buyer.address}
          onChange={(e) => updateBuyerData('address', e.target.value)}
          multiline
          rows={2}
          required
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="NIP (opcjonalnie)"
          value={invoiceData.buyer.nip}
          onChange={(e) => updateBuyerData('nip', e.target.value)}
          InputProps={{
            inputComponent: NIPInputMask
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={invoiceData.buyer.isCompany}
              onChange={(e) => updateBuyerData('isCompany', e.target.checked)}
            />
          }
          label="Firma"
        />
      </Grid>
    </Grid>
  </Paper>
  
  {/* Payment Details */}
  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
    <Typography variant="subtitle2" gutterBottom>
      Szczegóły Płatności
    </Typography>
    
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Sposób płatności</InputLabel>
          <Select
            value={invoiceData.paymentMethod}
            onChange={(e) => updateInvoiceData('paymentMethod', e.target.value)}
          >
            <MenuItem value="transfer">Przelew bankowy</MenuItem>
            <MenuItem value="cash">Gotówka</MenuItem>
            <MenuItem value="card">Karta płatnicza</MenuItem>
            <MenuItem value="blik">BLIK</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Numer konta bankowego"
          value={invoiceData.bankAccount}
          onChange={(e) => updateInvoiceData('bankAccount', e.target.value)}
          placeholder="00 1234 5678 9012 3456 7890 1234"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Uwagi dodatkowe"
          value={invoiceData.notes}
          onChange={(e) => updateInvoiceData('notes', e.target.value)}
          multiline
          rows={3}
          placeholder="Dodatkowe informacje o fakturze..."
        />
      </Grid>
    </Grid>
  </Paper>
</Box>
```

## 5. NIP/REGON/VAT Input Components

### NIPInputMask Component
```typescript
import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

interface NIPInputProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const NIPInputMask = forwardRef<HTMLElement, NIPInputProps>(
  function NIPInputMask(props, ref) {
    const { onChange, ...other } = props;
    
    return (
      <IMaskInput
        {...other}
        mask="000-000-00-00"
        definitions={{
          '#': /[0-9]/,
        }}
        inputRef={ref}
        onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  }
);
```

### NIPValidator Component
```jsx
const NIPValidator = ({ value, onChange, error, helperText, ...props }) => {
  const [validationState, setValidationState] = useState({
    isValid: null,
    isChecking: false,
    message: ''
  });
  
  const validateNIP = async (nip: string) => {
    if (!nip || nip.length < 13) {
      setValidationState({ isValid: null, isChecking: false, message: '' });
      return;
    }
    
    setValidationState({ isValid: null, isChecking: true, message: 'Sprawdzam NIP...' });
    
    try {
      // Polish NIP validation algorithm
      const nipDigits = nip.replace(/\D/g, '');
      const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      const checksum = nipDigits
        .slice(0, 9)
        .split('')
        .reduce((sum, digit, index) => sum + parseInt(digit) * weights[index], 0);
      
      const isValid = checksum % 11 === parseInt(nipDigits[9]);
      
      if (isValid) {
        // Optional: Check against government database
        const companyData = await checkNIPInDatabase(nipDigits);
        setValidationState({
          isValid: true,
          isChecking: false,
          message: companyData ? `Firma: ${companyData.name}` : 'NIP poprawny'
        });
      } else {
        setValidationState({
          isValid: false,
          isChecking: false,
          message: 'Nieprawidłowy numer NIP'
        });
      }
    } catch (error) {
      setValidationState({
        isValid: false,
        isChecking: false,
        message: 'Błąd sprawdzania NIP'
      });
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => validateNIP(value), 500);
    return () => clearTimeout(timer);
  }, [value]);
  
  return (
    <TextField
      {...props}
      value={value}
      onChange={onChange}
      error={error || validationState.isValid === false}
      helperText={
        helperText || 
        validationState.message || 
        (validationState.isChecking ? 'Sprawdzam...' : '')
      }
      InputProps={{
        ...props.InputProps,
        inputComponent: NIPInputMask,
        endAdornment: (
          <InputAdornment position="end">
            {validationState.isChecking && <CircularProgress size={16} />}
            {validationState.isValid === true && <CheckCircleIcon color="success" />}
            {validationState.isValid === false && <ErrorIcon color="error" />}
          </InputAdornment>
        )
      }}
    />
  );
};
```

### Polish Address Input Component
```jsx
const PolishAddressInput = ({ value, onChange, ...props }) => {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchAddresses = async (query: string) => {
    if (query.length < 3) return;
    
    setIsLoading(true);
    try {
      // Integration with Polish postal service API
      const response = await fetch(`/api/addresses/search?q=${encodeURIComponent(query)}`);
      const suggestions = await response.json();
      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddressSelect = (address: any) => {
    const formattedAddress = `${address.street} ${address.number}\n${address.postalCode} ${address.city}`;
    onChange({ target: { value: formattedAddress } });
    setAddressSuggestions([]);
  };
  
  return (
    <Autocomplete
      freeSolo
      options={addressSuggestions}
      getOptionLabel={(option) => 
        typeof option === 'string' ? option : `${option.street} ${option.number}, ${option.city}`
      }
      onInputChange={(event, newValue) => {
        onChange({ target: { value: newValue } });
        searchAddresses(newValue);
      }}
      onChange={(event, newValue) => {
        if (newValue && typeof newValue === 'object') {
          handleAddressSelect(newValue);
        }
      }}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          {...props}
          multiline
          rows={2}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading && <CircularProgress size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <Typography variant="body2">
              {option.street} {option.number}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {option.postalCode} {option.city}, {option.voivodeship}
            </Typography>
          </Box>
        </Box>
      )}
    />
  );
};
```

These components provide a comprehensive foundation for the advanced pricing system UI, with Polish business context integration, real-time calculations, and professional invoice generation capabilities.