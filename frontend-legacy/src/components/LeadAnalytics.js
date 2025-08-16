import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Fade
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  Source as SourceIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { apiService } from '../services/api.service';
import LoadingErrorState from './LoadingErrorState';

const LEAD_STATUSES = {
  NEW: 'nowy',
  CONTACTED: 'skontaktowany',
  QUALIFIED: 'wykwalifikowany',  
  PROPOSAL_SENT: 'oferta_wysłana',
  NEGOTIATING: 'negocjacje',
  CONVERTED: 'skonwertowany',
  LOST: 'utracony',
  NURTURING: 'pielęgnowany'
};

const LEAD_SOURCES = {
  WEBSITE: 'strona_internetowa',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  GOOGLE_ADS: 'google_ads',
  REFERRAL: 'polecenie',
  EMAIL: 'email',
  PHONE: 'telefon',
  TRADE_SHOW: 'targi',
  OTHER: 'inne'
};

const VOIVODESHIPS = [
  'mazowieckie', 'małopolskie', 'wielkopolskie', 'śląskie', 'lubelskie',
  'dolnośląskie', 'podkarpackie', 'zachodniopomorskie', 'łódzkie', 'kujawsko-pomorskie',
  'pomorskie', 'warmińsko-mazurskie', 'podlaskie', 'świętokrzyskie', 'lubuskie', 'opolskie'
];

const LeadAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [conversionFunnel, setConversionFunnel] = useState([]);
  const [topLeads, setTopLeads] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [sourcePerformance, setSourcePerformance] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        const [
          statsData,
          funnelData,
          topLeadsData,
          geographicStats,
          sourceStats
        ] = await Promise.all([
          apiService.getLeadStatistics(),
          apiService.getLeadConversionFunnel(),
          apiService.getTopLeadsByScore(10),
          // Mock geographic data - in real implementation, fetch from API
          Promise.resolve([
            { voivodeship: 'mazowieckie', count: 45, percentage: 25.7 },
            { voivodeship: 'małopolskie', count: 32, percentage: 18.3 },
            { voivodeship: 'wielkopolskie', count: 28, percentage: 16.0 },
            { voivodeship: 'śląskie', count: 25, percentage: 14.3 },
            { voivodeship: 'dolnośląskie', count: 22, percentage: 12.6 },
            { voivodeship: 'pomorskie', count: 18, percentage: 10.3 },
            { voivodeship: 'inne', count: 5, percentage: 2.9 }
          ]),
          // Mock source performance - in real implementation, fetch from API
          Promise.resolve([
            { source: 'WEBSITE', count: 65, conversionRate: 12.3, avgScore: 75 },
            { source: 'REFERRAL', count: 42, conversionRate: 28.6, avgScore: 82 },
            { source: 'LINKEDIN', count: 38, conversionRate: 15.8, avgScore: 78 },
            { source: 'FACEBOOK', count: 25, conversionRate: 8.0, avgScore: 65 },
            { source: 'GOOGLE_ADS', count: 22, conversionRate: 18.2, avgScore: 72 },
            { source: 'EMAIL', count: 15, conversionRate: 20.0, avgScore: 68 }
          ])
        ]);

        setStatistics(statsData);
        setConversionFunnel(funnelData || [
          { stage: 'NEW', count: 85, percentage: 100 },
          { stage: 'CONTACTED', count: 68, percentage: 80 },
          { stage: 'QUALIFIED', count: 42, percentage: 49.4 },
          { stage: 'PROPOSAL_SENT', count: 28, percentage: 32.9 },
          { stage: 'NEGOTIATING', count: 18, percentage: 21.2 },
          { stage: 'CONVERTED', count: 12, percentage: 14.1 }
        ]);
        setTopLeads(topLeadsData || []);
        setGeographicData(geographicStats);
        setSourcePerformance(sourceStats);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
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
              Analityka Leadów
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Szczegółowe analizy i statystyki potencjalnych klientów
            </Typography>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ fontSize: 30, mr: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {statistics?.total || 0}
                  </Typography>
                </Box>
                <Typography variant="body2">Wszystkie Leady</Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 30, mr: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {statistics?.statusCounts?.CONVERTED || 0}
                  </Typography>
                </Box>
                <Typography variant="body2">Skonwertowane</Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <AssessmentIcon sx={{ fontSize: 30, mr: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {statistics?.averageScore || 0}%
                  </Typography>
                </Box>
                <Typography variant="body2">Średni Wynik</Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <MoneyIcon sx={{ fontSize: 30, mr: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {statistics?.averageBudget ? (statistics.averageBudget / 1000).toFixed(0) : 0}K
                  </Typography>
                </Box>
                <Typography variant="body2">Śr. Budżet (PLN)</Typography>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Conversion Funnel */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Lejek Konwersji</Typography>
                  </Box>
                  
                  {conversionFunnel.map((stage, index) => (
                    <Box key={stage.stage} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {LEAD_STATUSES[stage.stage] || stage.stage}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stage.count} ({stage.percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stage.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: `hsl(${120 - (index * 15)}, 70%, 50%)`,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Source Performance */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <SourceIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Wydajność Źródeł</Typography>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Źródło</TableCell>
                          <TableCell align="right">Ilość</TableCell>
                          <TableCell align="right">Konwersja</TableCell>
                          <TableCell align="right">Śr. Wynik</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sourcePerformance
                          .sort((a, b) => b.conversionRate - a.conversionRate)
                          .map((source) => (
                          <TableRow key={source.source}>
                            <TableCell>
                              <Typography variant="body2">
                                {LEAD_SOURCES[source.source] || source.source}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{source.count}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${source.conversionRate.toFixed(1)}%`}
                                size="small"
                                color={source.conversionRate > 20 ? 'success' : 
                                       source.conversionRate > 15 ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{source.avgScore}%</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Geographic Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Rozkład Geograficzny</Typography>
                  </Box>
                  
                  {geographicData
                    .sort((a, b) => b.count - a.count)
                    .map((region) => (
                    <Box key={region.voivodeship} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {region.voivodeship}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {region.count} ({region.percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={region.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'info.main',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Leads */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <StarIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Najlepsze Leady</Typography>
                  </Box>
                  
                  {topLeads.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Lead</TableCell>
                            <TableCell align="right">Wynik</TableCell>
                            <TableCell align="right">Budżet</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topLeads.slice(0, 8).map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {`${lead.firstName} ${lead.lastName}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {lead.company || lead.email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${lead.qualificationScore || 0}%`}
                                  size="small"
                                  color={lead.qualificationScore >= 80 ? 'success' : 'primary'}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {lead.estimatedBudget ? 
                                    `${(lead.estimatedBudget / 1000).toFixed(0)}K` : 
                                    'N/A'
                                  }
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Brak danych o leadach
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Status Distribution */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Rozkład Statusów</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {statistics?.statusCounts && Object.entries(statistics.statusCounts).map(([status, count]) => (
                      <Grid item xs={12} sm={6} md={3} key={status}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {LEAD_STATUSES[status] || status}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(count / (statistics.total || 1)) * 100}
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default LeadAnalytics;