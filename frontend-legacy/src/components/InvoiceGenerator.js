import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { pl } from 'date-fns/locale/pl';
import { NIPValidator } from './NipRegonValidator';
import { formatPLN, formatPolishDate, calculateVAT } from '../utils/polishFormatters';

function InvoiceGenerator({ open, onClose, quote }) {
  const [loading, setLoading] = useState(false);
  const [isInvoiceValid, setIsInvoiceValid] = useState(false);
  
  const [invoiceData, setInvoiceData] = useState({
    number: '',
    issueDate: new Date(),
    saleDate: new Date(),
    paymentDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    paymentMethod: 'transfer',
    bankAccount: '',
    notes: '',
    seller: {
      name: 'SuperParkiet Sp. z o.o.',
      address: 'ul. Parkietowa 123\n00-001 Warszawa',
      nip: '123-456-78-90',
      regon: '123456789',
      phone: '+48 22 123 45 67',
      email: 'biuro@superparkiet.pl'
    },
    buyer: {
      name: '',
      address: '',
      nip: '',
      isCompany: false
    }
  });

  // Generate invoice number
  useEffect(() => {
    if (open && !invoiceData.number) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      
      setInvoiceData(prev => ({
        ...prev,
        number: `FV/${year}/${month}/${sequence}`
      }));
    }
  }, [open]);

  // Load contact data if quote has contact
  useEffect(() => {
    if (quote?.contact && open) {
      const contact = quote.contact;
      setInvoiceData(prev => ({
        ...prev,
        buyer: {
          name: `${contact.firstName} ${contact.lastName}`,
          address: contact.address || '',
          nip: contact.nip || '',
          isCompany: contact.businessType === 'b2b' || !!contact.company
        }
      }));
    }
  }, [quote, open]);

  // Validate form
  useEffect(() => {
    const isValid = 
      invoiceData.number &&
      invoiceData.seller.name &&
      invoiceData.seller.nip &&
      invoiceData.buyer.name &&
      invoiceData.issueDate &&
      invoiceData.saleDate &&
      invoiceData.paymentDue;
    
    setIsInvoiceValid(isValid);
  }, [invoiceData]);

  const updateInvoiceData = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSellerData = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      seller: {
        ...prev.seller,
        [field]: value
      }
    }));
  };

  const updateBuyerData = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      buyer: {
        ...prev.buyer,
        [field]: value
      }
    }));
  };

  const handleLoadContactData = () => {
    if (quote?.contact) {
      const contact = quote.contact;
      updateBuyerData('name', `${contact.firstName} ${contact.lastName}`);
      updateBuyerData('address', contact.address || '');
      updateBuyerData('nip', contact.nip || '');
      updateBuyerData('isCompany', contact.businessType === 'b2b');
    }
  };

  const handleGenerateInvoice = async () => {
    setLoading(true);
    try {
      // In real app, this would call the invoice generation API
      console.log('Generating invoice:', invoiceData);
      
      // Mock invoice generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    console.log('Preview PDF:', invoiceData);
    // In real app, this would open PDF preview
  };

  if (!quote) return null;

  const quoteTotal = quote.totalGross || 0;
  const netAmount = quoteTotal / 1.23; // Remove 23% VAT
  const vatAmount = calculateVAT(netAmount);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <ReceiptIcon />
            <Box>
              <Typography variant="h6">
                Generowanie Faktury z Oferty
              </Typography>
              <Chip 
                label={`Oferta #${quote.id || 'N/A'}`} 
                variant="outlined" 
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ height: '70vh' }}>
            {/* Left Panel - Invoice Form */}
            <Grid item xs={12} md={6} sx={{ p: 3, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Dane Faktury
              </Typography>

              {/* Basic Invoice Info */}
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

              {/* Seller Data */}
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
                    <NIPValidator
                      fullWidth
                      label="NIP"
                      value={invoiceData.seller.nip}
                      onChange={(e) => updateSellerData('nip', e.target.value)}
                      showCompanyInfo={false}
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
                  <Grid item xs={8}>
                    <NIPValidator
                      fullWidth
                      label="NIP (opcjonalnie)"
                      value={invoiceData.buyer.nip}
                      onChange={(e) => updateBuyerData('nip', e.target.value)}
                      showCompanyInfo={false}
                    />
                  </Grid>
                  <Grid item xs={4}>
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
              <Paper elevation={1} sx={{ p: 3 }}>
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
                  {invoiceData.paymentMethod === 'transfer' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Numer konta bankowego"
                        value={invoiceData.bankAccount}
                        onChange={(e) => updateInvoiceData('bankAccount', e.target.value)}
                        placeholder="00 1234 5678 9012 3456 7890 1234"
                      />
                    </Grid>
                  )}
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
            </Grid>

            {/* Right Panel - Invoice Preview */}
            <Grid item xs={12} md={6} sx={{ bgcolor: 'grey.50', p: 3, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Podgląd Faktury
              </Typography>

              <Paper elevation={3} sx={{ p: 3, mb: 2, bgcolor: 'white' }}>
                {/* Invoice Header */}
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      FAKTURA
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {invoiceData.number}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2">
                      Data wystawienia: {formatPolishDate(invoiceData.issueDate)}
                    </Typography>
                    <Typography variant="body2">
                      Data sprzedaży: {formatPolishDate(invoiceData.saleDate)}
                    </Typography>
                    <Typography variant="body2">
                      Termin płatności: {formatPolishDate(invoiceData.paymentDue)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Seller and Buyer */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Sprzedawca:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
                      <strong>{invoiceData.seller.name}</strong><br />
                      {invoiceData.seller.address}<br />
                      NIP: {invoiceData.seller.nip}<br />
                      {invoiceData.seller.regon && `REGON: ${invoiceData.seller.regon}`}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Nabywca:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
                      <strong>{invoiceData.buyer.name}</strong><br />
                      {invoiceData.buyer.address}<br />
                      {invoiceData.buyer.nip && `NIP: ${invoiceData.buyer.nip}`}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />

                {/* Invoice Items Preview */}
                <Typography variant="subtitle2" gutterBottom>
                  Pozycje:
                </Typography>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="body2" gutterBottom>
                      {quote.title || 'Oferta - produkty i usługi'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Wartość netto:</Typography>
                      <Typography variant="body2">{formatPLN(netAmount)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">VAT 23%:</Typography>
                      <Typography variant="body2">{formatPLN(vatAmount)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight="bold">Wartość brutto:</Typography>
                      <Typography variant="body1" fontWeight="bold">{formatPLN(quoteTotal)}</Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Typography variant="subtitle2" gutterBottom>
                  Sposób płatności:
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {invoiceData.paymentMethod === 'transfer' ? 'Przelew bankowy' :
                   invoiceData.paymentMethod === 'cash' ? 'Gotówka' :
                   invoiceData.paymentMethod === 'card' ? 'Karta płatnicza' : 'BLIK'}
                </Typography>

                {invoiceData.bankAccount && (
                  <Typography variant="body2" gutterBottom>
                    Konto: {invoiceData.bankAccount}
                  </Typography>
                )}

                {invoiceData.notes && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Uwagi:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {invoiceData.notes}
                    </Typography>
                  </>
                )}
              </Paper>

              {/* Validation Messages */}
              {!isInvoiceValid && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Uzupełnij wszystkie wymagane pola aby wygenerować fakturę.
                </Alert>
              )}
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
            disabled={!isInvoiceValid}
          >
            Podgląd PDF
          </Button>
          <Button 
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleGenerateInvoice}
            disabled={!isInvoiceValid || loading}
          >
            {loading ? 'Generuję...' : 'Generuj Fakturę'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default InvoiceGenerator;