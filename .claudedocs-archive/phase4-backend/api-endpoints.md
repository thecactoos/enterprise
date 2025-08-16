# Phase 4 API Endpoint Specifications

## Overview

Comprehensive API endpoint specifications for enhanced pricing management across Services and Products services, with Polish business compliance and bulk operations support.

## Services Service Endpoints (Port 3007)

### Current Status ✅
- Basic CRUD operations implemented
- Service calculations and statistics
- Status management (activate/deactivate)
- Health check endpoint

### Missing Advanced Pricing Endpoints

#### 1. Advanced Pricing Calculations

**POST** `/services/:id/calculate-advanced`
```typescript
// Advanced pricing calculation with all factors
{
  "summary": "Calculate service pricing with tiers, zones, and discounts",
  "parameters": {
    "path": {
      "id": "Service UUID"
    },
    "body": {
      "quantity": 50.5,           // Required: Amount to calculate
      "tier": "standard",         // Optional: basic|standard|premium
      "regionalZone": "warsaw",   // Optional: warsaw|krakow|gdansk|wroclaw|poznan|other
      "applySeasonalAdjustment": true  // Optional: Override seasonal settings
    }
  },
  "responses": {
    "200": {
      "serviceName": "Montaż podłogi drewnianej na klej",
      "calculation": {
        "quantity": 50.5,
        "tier": "standard",
        "baseRate": 52.33,
        "netPrice": 2642.67,
        "vatRate": 23,
        "vatAmount": 607.81,
        "grossPrice": 3250.48,
        "discountApplied": 264.27,
        "effectiveRate": 52.33
      },
      "breakdown": [
        "Base rate: 52,33 PLN/m²",
        "Quantity: 50,5 m²",
        "Volume discount: -264,27 PLN",
        "Net price: 2642,67 PLN",
        "VAT (23%): 607,81 PLN"
      ],
      "formatted": {
        "netPrice": "2 642,67 PLN",
        "grossPrice": "3 250,48 PLN"
      }
    }
  }
}
```

#### 2. Bulk Pricing Management

**PATCH** `/services/bulk/pricing`
```typescript
// Mass price updates with percentage adjustments
{
  "summary": "Update pricing for multiple services",
  "authentication": "JWT required, admin role",
  "rateLimit": "10 requests per minute",
  "body": {
    "serviceIds": ["uuid1", "uuid2", "uuid3"],
    "priceAdjustmentPercent": 10,    // Optional: -50 to 100
    "newVatRate": 23,                // Optional: 0|8|23
    "seasonalMultiplier": 1.1,       // Optional: 0.8-1.3
    "seasonalAdjustmentActive": true, // Optional
    "regionalMultiplier": 1.15       // Optional: 0.5-2.0
  },
  "responses": {
    "200": {
      "updated": 15,
      "operationId": "bulk-uuid",
      "summary": {
        "priceIncrease": "10%",
        "servicesUpdated": 15,
        "averageNewPrice": "58,50 PLN/m²",
        "totalValueImpact": "+2 450,00 PLN"
      }
    },
    "400": {
      "error": "Invalid adjustment percentage",
      "details": "Adjustment must be between -50% and 100%"
    }
  }
}
```

**PATCH** `/services/regional-pricing`
```typescript
// Regional pricing multiplier updates
{
  "summary": "Update regional pricing for Polish cities",
  "body": {
    "updates": [
      { "regionalZone": "warsaw", "multiplier": 1.25 },
      { "regionalZone": "krakow", "multiplier": 1.15 },
      { "regionalZone": "gdansk", "multiplier": 1.10 }
    ]
  },
  "responses": {
    "200": {
      "updated": 3,
      "regionalSettings": {
        "warsaw": 1.25,
        "krakow": 1.15,
        "gdansk": 1.10,
        "wroclaw": 1.08,
        "poznan": 1.05,
        "other": 1.00
      }
    }
  }
}
```

**PATCH** `/services/seasonal-adjustment`
```typescript
// Apply seasonal pricing adjustments
{
  "summary": "Apply seasonal multipliers to services",
  "body": {
    "multiplier": 1.1,              // Required: 0.8-1.3
    "active": true,                 // Required
    "categories": ["wood_glue", "laminate_click"], // Optional: specific categories
    "reason": "Winter season premium pricing"      // Optional
  },
  "responses": {
    "200": {
      "applied": 25,
      "categories": ["wood_glue", "laminate_click"],
      "multiplier": 1.1,
      "estimatedImpact": "+850,00 PLN average per service"
    }
  }
}
```

#### 3. Service-Specific Pricing Management

**PATCH** `/services/:id/pricing-tiers`
```typescript
// Update individual service pricing tiers
{
  "summary": "Update basic, standard, and premium pricing",
  "parameters": {
    "path": { "id": "Service UUID" }
  },
  "body": {
    "basicPrice": 40.00,     // Optional: base price
    "standardPrice": 46.00,  // Optional: +15% typical
    "premiumPrice": 50.00,   // Optional: +25% typical
    "hourlyRate": 80.00,     // Optional: for hourly model
    "dailyRate": 600.00      // Optional: for daily model
  },
  "responses": {
    "200": {
      "serviceId": "uuid",
      "serviceName": "Montaż podłogi drewnianej",
      "updatedTiers": {
        "basic": "40,00 PLN/m²",
        "standard": "46,00 PLN/m²", 
        "premium": "50,00 PLN/m²"
      },
      "marginIncrease": "15%"
    }
  }
}
```

**PATCH** `/services/:id/volume-discount`
```typescript
// Volume discount configuration
{
  "summary": "Set volume discount thresholds and percentages",
  "body": {
    "threshold": 50,        // Required: minimum quantity
    "discountPercent": 10   // Required: 0-30%
  },
  "responses": {
    "200": {
      "serviceId": "uuid",
      "volumeDiscount": {
        "threshold": "50 m²",
        "discount": "10%",
        "exampleSavings": "Orders >50m² save 264,27 PLN"
      }
    }
  }
}
```

#### 4. Pricing Analytics

**GET** `/services/pricing/analytics`
```typescript
// Comprehensive pricing analytics
{
  "summary": "Get pricing analytics and insights",
  "responses": {
    "200": {
      "overview": {
        "totalServices": 45,
        "averagePrice": "48,50 PLN/m²",
        "priceRange": { "min": "25,00", "max": "85,00" }
      },
      "tierDistribution": {
        "basic": { "count": 12, "avgPrice": "38,50 PLN/m²" },
        "standard": { "count": 25, "avgPrice": "48,50 PLN/m²" },
        "premium": { "count": 8, "avgPrice": "65,00 PLN/m²" }
      },
      "vatBreakdown": {
        "vat_23": { "services": 40, "percentage": 88.9 },
        "vat_8": { "services": 5, "percentage": 11.1 }
      },
      "volumeDiscounts": {
        "servicesWithDiscounts": 18,
        "averageThreshold": "75 m²",
        "averageDiscount": "8,5%"
      },
      "regionalPricing": {
        "warsaw": "+25%",
        "krakow": "+15%", 
        "other": "base"
      }
    }
  }
}
```

**GET** `/services/pricing/volume-discounts`
```typescript
// Services with volume discounts
{
  "summary": "Get services offering bulk discounts",
  "parameters": {
    "query": {
      "minThreshold": 25  // Optional: minimum threshold filter
    }
  },
  "responses": {
    "200": [
      {
        "id": "uuid",
        "serviceName": "Montaż podłogi drewnianej na klej",
        "category": "wood_glue",
        "basePrice": "45,50 PLN/m²",
        "volumeThreshold": "50 m²",
        "discountPercent": "10%",
        "potentialSavings": "227,50 PLN na 50m²"
      }
    ]
  }
}
```

**GET** `/services/pricing/tier/:tier`
```typescript
// Services by pricing tier
{
  "summary": "Filter services by pricing tier",
  "parameters": {
    "path": { "tier": "basic|standard|premium" }
  },
  "responses": {
    "200": {
      "tier": "premium",
      "services": [
        {
          "id": "uuid",
          "serviceName": "Montaż parkietu jodła francuska",
          "category": "wood_glue",
          "premiumPrice": "68,00 PLN/m²",
          "skillLevel": 5,
          "timePerM2": "45 min/m²"
        }
      ],
      "summary": {
        "count": 8,
        "averagePrice": "65,00 PLN/m²",
        "priceRange": { "min": "55,00", "max": "85,00" }
      }
    }
  }
}
```

## Products Service Endpoints (Port 3004)

### Enhanced Bulk Operations

**PATCH** `/products/bulk/pricing`
```typescript
// Mass product price adjustments
{
  "summary": "Update pricing for multiple products",
  "authentication": "JWT required, admin role",
  "rateLimit": "5 requests per minute",
  "body": {
    "productIds": ["uuid1", "uuid2"],    // Required: max 1000 per request
    "adjustmentPercent": 15,             // Optional: price adjustment
    "updateRetail": true,                // Optional: update retail prices
    "updateSelling": true,               // Optional: update selling prices
    "reason": "Market price increase"    // Optional: change reason
  },
  "responses": {
    "200": {
      "operationId": "bulk-op-uuid",
      "updated": 847,
      "failed": 3,
      "summary": {
        "averageIncrease": "15%",
        "totalValueImpact": "+125 450,00 PLN",
        "processingTime": "3.2 seconds"
      },
      "failedProducts": [
        { "id": "uuid", "reason": "Product locked for editing" }
      ]
    },
    "400": {
      "error": "Too many products",
      "details": "Maximum 1000 products per bulk operation"
    }
  }
}
```

**PATCH** `/products/bulk/margins`
```typescript
// Bulk margin adjustments
{
  "summary": "Update target margins for multiple products",
  "body": {
    "productIds": ["uuid1", "uuid2"],
    "targetMargin": 35,                  // Required: target margin %
    "updatePrices": true,                // Optional: recalculate prices
    "respectMinimum": true,              // Optional: honor minimum prices
    "category": "flooring"               // Optional: filter by category
  },
  "responses": {
    "200": {
      "updated": 245,
      "marginAnalysis": {
        "averageOldMargin": "28,5%",
        "averageNewMargin": "35,0%",
        "revenueImpact": "+45 200,00 PLN",
        "underperformingProducts": 12
      }
    }
  }
}
```

**PATCH** `/products/bulk/vat`
```typescript
// Bulk VAT rate updates
{
  "summary": "Update VAT rates for multiple products",
  "body": {
    "productIds": ["uuid1", "uuid2"],
    "vatRate": 23,                       // Required: 0|8|23
    "reason": "VAT rate regulation change"
  },
  "responses": {
    "200": {
      "updated": 3450,
      "vatImpact": {
        "oldAverageVat": "8%",
        "newAverageVat": "23%",
        "priceImpactPerProduct": "+12,50 PLN average"
      }
    }
  }
}
```

**PATCH** `/products/bulk/supplier-costs`
```typescript
// Bulk supplier cost updates
{
  "summary": "Update supplier costs for multiple products",
  "body": {
    "updates": [
      { "productId": "uuid1", "newCost": 125.50 },
      { "productId": "uuid2", "newCost": 89.25 }
    ],
    "adjustPricesAutomatically": true,   // Optional: maintain margins
    "supplierName": "Super Materials Ltd" // Optional: filter
  },
  "responses": {
    "200": {
      "updated": 156,
      "costAnalysis": {
        "totalCostIncrease": "+5 450,00 PLN",
        "averageCostChange": "+8,5%",
        "marginsPreserved": 145,
        "marginsRequireReview": 11
      }
    }
  }
}
```

### Margin Management

**GET** `/products/:id/margin-analysis`
```typescript
// Individual product margin analysis
{
  "summary": "Detailed margin analysis for single product",
  "responses": {
    "200": {
      "productInfo": {
        "id": "uuid",
        "name": "Parkiet Dębowy 15mm",
        "category": "flooring",
        "currentStock": 150
      },
      "pricing": {
        "supplierCost": "85,50 PLN",
        "sellingPrice": "125,00 PLN",
        "retailPrice": "165,00 PLN",
        "grossSellingPrice": "153,75 PLN" // with 23% VAT
      },
      "margins": {
        "currentMargin": "46,2%",
        "targetMargin": "35,0%",
        "marginVsTarget": "+11,2%",
        "marginInPLN": "39,50 PLN"
      },
      "recommendations": {
        "optimalSellingPrice": "115,43 PLN",
        "potentialSavings": "9,57 PLN per unit",
        "competitivePosition": "Above market average"
      }
    }
  }
}
```

**GET** `/products/margins/analytics`
```typescript
// Comprehensive margin analytics
{
  "summary": "System-wide margin analysis",
  "parameters": {
    "query": {
      "category": "flooring",      // Optional: filter by category
      "supplier": "supplier-name", // Optional: filter by supplier
      "priceRange": "100-500"      // Optional: price range filter
    }
  },
  "responses": {
    "200": {
      "overview": {
        "totalProducts": 3450,
        "averageMargin": "31,5%",
        "marginRange": { "min": "5,0%", "max": "85,0%" }
      },
      "categoryBreakdown": {
        "flooring": { "count": 1850, "avgMargin": "35,2%" },
        "molding": { "count": 980, "avgMargin": "28,5%" },
        "accessory": { "count": 620, "avgMargin": "42,1%" }
      },
      "opportunities": {
        "underperforming": 245,     // Below target margin
        "overperforming": 156,      // Above target margin  
        "potentialRevenue": "+85 450,00 PLN"
      },
      "supplierImpact": {
        "bestMargins": ["Supplier A", "Supplier B"],
        "improvementNeeded": ["Supplier C", "Supplier D"]
      }
    }
  }
}
```

**GET** `/products/margins/opportunities`
```typescript
// Pricing optimization opportunities
{
  "summary": "Identify products with pricing optimization potential",
  "responses": {
    "200": {
      "highImpact": [
        {
          "productId": "uuid",
          "productName": "Premium Flooring 20mm",
          "currentMargin": "22,5%",
          "targetMargin": "35,0%",
          "gapImpact": "High",
          "currentStock": 200,
          "potentialValue": "+2 450,00 PLN",
          "recommendedAction": "Increase price to 145,50 PLN"
        }
      ],
      "quickWins": [
        {
          "productId": "uuid",
          "productName": "Basic Molding 10mm", 
          "issue": "Priced below minimum",
          "quickFix": "Increase by 5,50 PLN",
          "impact": "+1 100,00 PLN annually"
        }
      ],
      "summary": {
        "totalOpportunities": 89,
        "potentialRevenue": "+125 450,00 PLN",
        "averageTimeToImplement": "2 days"
      }
    }
  }
}
```

**POST** `/products/:id/calculate-optimal-pricing`
```typescript
// Calculate optimal pricing for product
{
  "summary": "Calculate optimal price based on costs and targets",
  "body": {
    "targetMargin": 35,              // Required: desired margin %
    "marketPosition": "competitive", // Optional: premium|competitive|budget
    "volumeExpected": 100,          // Optional: expected sales volume
    "competitorPrice": 150.00       // Optional: competitor pricing data
  },
  "responses": {
    "200": {
      "currentPricing": {
        "sellingPrice": "125,00 PLN",
        "margin": "31,5%"
      },
      "optimalPricing": {
        "recommendedPrice": "135,75 PLN",
        "achievedMargin": "35,0%",
        "priceIncrease": "8,6%"
      },
      "marketAnalysis": {
        "competitivePosition": "Below competitor by 14,25 PLN",
        "priceElasticity": "Low risk",
        "revenueProjection": "+2 150,00 PLN annually"
      },
      "implementation": {
        "confidence": "High",
        "riskLevel": "Low",
        "recommendedTiming": "Immediate"
      }
    }
  }
}
```

### Price History & Tracking

**GET** `/products/:id/price-history`
```typescript
// Product price change history
{
  "summary": "Track price changes over time",
  "parameters": {
    "query": {
      "days": 90,                  // Optional: history period
      "priceType": "selling"       // Optional: retail|selling|purchase|supplier_cost
    }
  },
  "responses": {
    "200": {
      "productInfo": {
        "id": "uuid",
        "name": "Parkiet Dębowy 15mm"
      },
      "priceHistory": [
        {
          "date": "2024-07-15T10:30:00Z",
          "priceType": "selling",
          "oldPrice": "120,00 PLN",
          "newPrice": "125,00 PLN",
          "changePercent": "+4,2%",
          "reason": "Market adjustment",
          "changedBy": "user-uuid"
        }
      ],
      "analytics": {
        "totalChanges": 5,
        "averageIncrease": "+3,2%",
        "volatilityIndex": "Low",
        "trendDirection": "Upward"
      },
      "chartData": {
        "labels": ["Jul", "Aug", "Sep"],
        "prices": [120.00, 125.00, 125.00]
      }
    }
  }
}
```

### Supplier Management

**GET** `/products/suppliers/:supplier/report`
```typescript
// Supplier pricing performance report
{
  "summary": "Comprehensive supplier analysis",
  "parameters": {
    "path": { "supplier": "supplier-name" }
  },
  "responses": {
    "200": {
      "supplierInfo": {
        "name": "Super Materials Ltd",
        "totalProducts": 456,
        "activeProducts": 445,
        "lastUpdate": "2024-07-15T10:30:00Z"
      },
      "financialSummary": {
        "totalInventoryCost": "125 450,00 PLN",
        "totalInventoryValue": "185 200,00 PLN",
        "averageMargin": "32,5%",
        "marginTrend": "+2,1% (3 months)"
      },
      "performanceMetrics": {
        "priceStability": "High",
        "marginConsistency": "Good",
        "updateFrequency": "Monthly",
        "competitiveness": "Above average"
      },
      "recommendations": [
        "Negotiate 5% cost reduction on high-volume products",
        "Review pricing on 23 underperforming items",
        "Consider alternative suppliers for accessories"
      ]
    }
  }
}
```

**PATCH** `/products/suppliers/:supplier/costs`
```typescript
// Supplier-wide cost adjustments
{
  "summary": "Apply cost changes across supplier products",
  "body": {
    "adjustmentPercent": 8,          // Required: cost adjustment
    "affectedCategories": ["flooring"], // Optional: limit by category
    "maintainMargins": true,         // Optional: adjust selling prices
    "effectiveDate": "2024-08-01"    // Optional: future pricing
  },
  "responses": {
    "200": {
      "supplier": "Super Materials Ltd",
      "productsUpdated": 285,
      "costImpact": {
        "totalIncrease": "+18 450,00 PLN",
        "averagePerProduct": "+64,75 PLN",
        "marginsPreserved": 270,
        "priceAdjustmentsNeeded": 15
      }
    }
  }
}
```

## Error Handling Standards

### Common Error Responses

```typescript
// 400 Bad Request
{
  "error": "Invalid request parameters",
  "code": "INVALID_PARAMETERS", 
  "details": {
    "field": "adjustmentPercent",
    "message": "Must be between -50 and 100",
    "provided": 150
  }
}

// 401 Unauthorized
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "message": "JWT token required for bulk operations"
}

// 403 Forbidden
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "message": "Admin role required for pricing modifications"
}

// 404 Not Found
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "message": "Service with ID uuid not found"
}

// 409 Conflict
{
  "error": "Resource conflict",
  "code": "BULK_OPERATION_CONFLICT",
  "message": "Products currently locked by another bulk operation",
  "conflictingOperation": "bulk-op-uuid"
}

// 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "message": "Maximum 5 bulk operations per minute",
  "retryAfter": 45
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "code": "DATABASE_ERROR",
  "message": "Pricing calculation failed",
  "requestId": "req-uuid"
}
```

## Rate Limiting & Security

### Rate Limits
- **Bulk Operations**: 5 requests/minute per user
- **Individual Operations**: 60 requests/minute per user
- **Analytics Endpoints**: 20 requests/minute per user
- **Price History**: 100 requests/minute per user

### Authentication Requirements
- **Read Operations**: Valid JWT token
- **Update Operations**: JWT + user/admin role
- **Bulk Operations**: JWT + admin role
- **Analytics**: JWT + user/admin role

### Input Validation
- **UUIDs**: Valid UUID format validation
- **Prices**: Positive numbers, max 2 decimal places
- **Percentages**: Range validation (-50% to 500%)
- **Bulk Operations**: Maximum 1000 items per request
- **Polish Compliance**: VAT rates (0%, 8%, 23%)

## Performance Considerations

### Response Time Targets
- **Individual Calculations**: <100ms
- **Bulk Operations**: <5 seconds (1000+ items)
- **Analytics Queries**: <2 seconds
- **Price History**: <200ms

### Optimization Strategies
- **Database Indexing**: Optimized for pricing queries
- **Bulk Operations**: Chunked processing with progress tracking
- **Caching**: Frequently accessed pricing data
- **Connection Pooling**: Efficient database connections