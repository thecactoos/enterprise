# User Flows - Advanced Pricing Management System

## Overview
Complete user workflow specifications for the Polish Construction CRM advanced pricing management system, covering all pricing scenarios and business processes.

## 1. Complete Pricing Management Workflow

### Entry Points
- **Dashboard**: "Zarządzanie Cenami" button in quick actions
- **Navigation**: "Cennik" menu item in main navigation
- **Product/Service Views**: "Aktualizuj Ceny" context actions
- **Quote Generation**: Automatic pricing calculations during quote creation

### Main Pricing Dashboard Flow
```
1. Login/Authentication
   ├─ User credentials validation
   ├─ Role verification (admin/manager/sales)
   └─ Session establishment

2. Pricing Dashboard Access
   ├─ Load pricing statistics
   ├─ Check recent price changes
   ├─ Display pending price updates
   └─ Show quick action buttons

3. Pricing Management Selection
   ├─ Services Pricing Management
   ├─ Products Pricing Management  
   ├─ Bulk Price Updates
   └─ Quote Generation System
```

### User Journey Map
```
Actor: Sales Manager (Marcin)
Goal: Update service pricing tiers for seasonal adjustment

Start → Login → Dashboard → Pricing Management → Services → 
       Edit Tier Prices → Apply Changes → Validate → Confirm → 
       Generate Reports → Notify Team → End

Touchpoints:
- Authentication system
- Main dashboard
- Pricing management interface
- Service tier configuration
- Price calculation engine
- Validation system
- Notification system
```

## 2. Quote Creation to Invoice Generation Flow

### Complete Quote-to-Invoice Process
```
Phase 1: Quote Preparation
┌─ Start Quote Creation ────────────────────────────────────┐
│ 1. Select Contact                                         │
│    ├─ Search existing contacts                            │
│    ├─ Quick contact creation                              │
│    └─ Verify business details (NIP/REGON)                │
│                                                           │
│ 2. Quote Builder Interface                                │
│    ├─ Product Selection                                   │
│    │   ├─ Search product catalog (3450+ items)           │
│    │   ├─ Filter by category/supplier                     │
│    │   ├─ Add to quote with quantities                    │
│    │   └─ Real-time pricing calculations                  │
│    │                                                      │
│    ├─ Service Recommendations                             │
│    │   ├─ AI-powered service matching                     │
│    │   ├─ Based on selected products                      │
│    │   ├─ Display compatibility scores                    │
│    │   └─ Add recommended services                        │
│    │                                                      │
│    └─ Quote Customization                                 │
│        ├─ Apply discounts (item/global)                   │
│        ├─ Adjust pricing tiers                           │
│        ├─ Add custom line items                           │
│        └─ Set payment terms                               │
└───────────────────────────────────────────────────────────┘

Phase 2: Quote Finalization
┌─ Quote Review & Approval ─────────────────────────────────┐
│ 3. Calculations Verification                              │
│    ├─ Review net/gross totals                            │
│    ├─ Verify VAT calculations (23%)                       │
│    ├─ Check minimum order values                          │
│    └─ Validate margin requirements                        │
│                                                           │
│ 4. Quote Generation                                       │
│    ├─ Generate quote number (OFT/2024/08/001)            │
│    ├─ Set validity period (30 days default)              │
│    ├─ Add terms and conditions                            │
│    └─ Create PDF document                                 │
│                                                           │
│ 5. Quote Delivery                                         │
│    ├─ Email to contact                                    │
│    ├─ SMS notification (optional)                         │
│    ├─ Portal upload (if available)                        │
│    └─ Print option for physical delivery                  │
└───────────────────────────────────────────────────────────┘

Phase 3: Quote Follow-up
┌─ Quote Status Management ─────────────────────────────────┐
│ 6. Quote Tracking                                         │
│    ├─ Monitor email opens/downloads                       │
│    ├─ Track quote status changes                          │
│    ├─ Set follow-up reminders                            │
│    └─ Log customer interactions                           │
│                                                           │
│ 7. Quote Modifications                                    │
│    ├─ Create quote revisions                             │
│    ├─ Adjust pricing/quantities                          │
│    ├─ Update terms if needed                              │
│    └─ Generate revised documents                          │
└───────────────────────────────────────────────────────────┘

Phase 4: Invoice Generation
┌─ Quote Acceptance & Invoicing ────────────────────────────┐
│ 8. Quote Acceptance Process                               │
│    ├─ Customer accepts quote                              │
│    ├─ Convert quote to order                              │
│    ├─ Lock pricing and terms                              │
│    └─ Initialize invoice generation                       │
│                                                           │
│ 9. Invoice Creation                                        │
│    ├─ Auto-populate from accepted quote                   │
│    ├─ Verify/update customer data                         │
│    ├─ Set invoice dates and payment terms                 │
│    ├─ Validate NIP/REGON for Polish compliance           │
│    └─ Generate invoice number (FV/2024/08/001)           │
│                                                           │
│ 10. Invoice Validation                                     │
│     ├─ Polish VAT compliance check                        │
│     ├─ Financial data verification                        │
│     ├─ Payment method setup                               │
│     └─ Final review and approval                          │
│                                                           │
│ 11. Invoice Delivery                                       │
│     ├─ Generate PDF invoice                               │
│     ├─ Send via email                                     │
│     ├─ Register in accounting system                      │
│     └─ Archive for compliance                             │
└───────────────────────────────────────────────────────────┘
```

### Detailed Step-by-Step User Actions

#### Step 1: Contact Selection
```
User Action Flow:
1. Click "Nowa Oferta" button
2. Contact selection modal opens
3. Options presented:
   ├─ Search existing contacts (typeahead)
   ├─ Recent contacts (last 10)
   ├─ Favorite contacts (starred)
   └─ Create new contact (quick form)

If New Contact:
4. Quick contact form:
   ├─ First Name* + Last Name* (required)
   ├─ Company (optional for B2C)
   ├─ Email + Phone (at least one required)
   ├─ NIP (for B2B, auto-validation)
   └─ Basic address info

5. Contact validation:
   ├─ Check for duplicates
   ├─ Validate NIP if provided
   ├─ Format phone number
   └─ Save and continue

Success: Contact selected, quote builder opens
Error: Show validation errors, allow corrections
```

#### Step 2: Product Selection Process
```
User Interaction Sequence:
1. Quote builder interface loads with 3 panels:
   ├─ Left: Product/Service selector
   ├─ Center: Quote items list (drag-drop)
   └─ Right: Calculations panel

2. Product search and selection:
   ├─ Search bar with live results
   ├─ Category filters (Flooring, Molding, etc.)
   ├─ Price range filters
   └─ Availability filters

3. Adding products to quote:
   ├─ Click product card → quantity dialog
   ├─ Enter quantity in appropriate units
   ├─ See instant price calculation
   ├─ Add to quote → appears in center panel
   └─ Right panel updates totals

4. Product customization:
   ├─ Adjust quantities with +/- buttons
   ├─ Modify unit prices (if authorized)
   ├─ Apply item-level discounts
   ├─ Add notes/specifications
   └─ Reorder items via drag-drop

Real-time Feedback:
├─ Quantity validation (min/max limits)
├─ Price calculations update instantly
├─ Margin warnings if below threshold
├─ Stock level indicators
└─ Delivery time estimates
```

#### Step 3: Service Recommendation Engine
```
Automated Service Matching:
1. System analyzes selected products:
   ├─ Product categories (flooring types)
   ├─ Installation requirements
   ├─ Material compatibility
   └─ Customer project type

2. Generate recommendations:
   ├─ Calculate compatibility scores
   ├─ Rank by relevance (90%+ = high match)
   ├─ Show matching product indicators
   └─ Display pricing for each service

3. User review recommendations:
   ├─ View service details on hover
   ├─ See why service was recommended
   ├─ Check pricing tiers (Basic/Standard/Premium)
   └─ Add services with one click

4. Service customization:
   ├─ Adjust service quantities/areas
   ├─ Select appropriate pricing tier
   ├─ Modify service specifications
   └─ Apply service-level discounts

Smart Recommendations Examples:
├─ Wooden flooring → Wood installation service
├─ Large area (>50m²) → Measurement service
├─ Premium products → Premium installation
└─ First-time customer → Consultation service
```

#### Step 4: Quote Finalization Process
```
Quote Review Workflow:
1. Pre-finalization checks:
   ├─ Verify all required fields completed
   ├─ Check total meets minimum order value
   ├─ Validate margin requirements met
   └─ Confirm customer information accurate

2. Pricing review:
   ├─ Display pricing breakdown clearly
   │   ├─ Subtotal (netto)
   │   ├─ Discounts applied
   │   ├─ VAT amount (23%)
   │   └─ Total (brutto)
   ├─ Show profit margins
   ├─ Compare to competitor pricing
   └─ Highlight any pricing alerts

3. Terms and conditions:
   ├─ Select payment terms (7/14/30 days)
   ├─ Set quote validity period
   ├─ Add delivery terms
   ├─ Include warranty information
   └─ Add special conditions

4. Quote generation:
   ├─ Auto-generate quote number
   ├─ Create PDF document
   ├─ Save to customer record
   └─ Prepare for delivery

Quality Gates:
├─ Mandatory approval for >50k PLN quotes
├─ Manager review for custom pricing
├─ Legal review for non-standard terms
└─ Finance approval for payment terms >30 days
```

## 3. Bulk Pricing Update Process

### Mass Price Update Workflow
```
Bulk Update Process Flow:
┌─ Initiate Bulk Update ────────────────────────────────────┐
│ 1. Access Control                                         │
│    ├─ Verify user permissions (admin/manager only)       │
│    ├─ Check for existing updates in progress             │
│    └─ Load bulk update interface                         │
│                                                           │
│ 2. Selection Criteria                                     │
│    ├─ Product/Service filters:                           │
│    │   ├─ Category selection (multiple)                  │
│    │   ├─ Supplier selection                             │
│    │   ├─ Price range filters                            │
│    │   ├─ Last update date                               │
│    │   └─ Status filters (active/inactive)              │
│    │                                                     │
│    ├─ Preview affected items:                            │
│    │   ├─ Show count of matching items                   │
│    │   ├─ Display sample items                           │
│    │   └─ Calculate impact summary                       │
│    └─ Refine selection if needed                         │
└───────────────────────────────────────────────────────────┘

┌─ Configure Update Rules ──────────────────────────────────┐
│ 3. Pricing Strategy Selection                             │
│    ├─ Percentage adjustment (+/- %)                       │
│    ├─ Fixed amount adjustment (+/- PLN)                   │
│    ├─ New margin target (set margin %)                    │
│    ├─ Price list replacement                              │
│    └─ Formula-based updates                               │
│                                                           │
│ 4. Update Configuration                                    │
│    ├─ Select price types to update:                       │
│    │   ├─ Purchase prices                                 │
│    │   ├─ Selling prices                                  │
│    │   ├─ Retail prices                                   │
│    │   └─ Service rates                                   │
│    │                                                      │
│    ├─ Rounding rules:                                     │
│    │   ├─ Round to nearest 0.01 PLN                      │
│    │   ├─ Round to nearest 0.05 PLN                      │
│    │   ├─ Round to nearest 0.10 PLN                      │
│    │   └─ Custom rounding                                 │
│    │                                                      │
│    └─ Effective date:                                     │
│        ├─ Immediate implementation                        │
│        ├─ Scheduled for future date                      │
│        └─ Gradual rollout                                 │
└───────────────────────────────────────────────────────────┘

┌─ Validation & Preview ────────────────────────────────────┐
│ 5. Impact Analysis                                        │
│    ├─ Calculate affected quote/orders                     │
│    ├─ Check margin compliance                             │
│    ├─ Identify competitive issues                         │
│    └─ Estimate revenue impact                             │
│                                                           │
│ 6. Preview Changes                                        │
│    ├─ Show before/after prices                           │
│    ├─ Highlight significant changes                       │
│    ├─ Flag potential issues                               │
│    └─ Allow individual item adjustments                   │
│                                                           │
│ 7. Approval Workflow                                      │
│    ├─ Generate approval request                           │
│    ├─ Send to required approvers                          │
│    ├─ Collect approvals/rejections                        │
│    └─ Final go/no-go decision                             │
└───────────────────────────────────────────────────────────┘

┌─ Execute Updates ─────────────────────────────────────────┐
│ 8. Update Execution                                       │
│    ├─ Lock affected records                               │
│    ├─ Backup current prices                               │
│    ├─ Apply updates in batches                            │
│    ├─ Validate each update                                │
│    └─ Handle errors gracefully                            │
│                                                           │
│ 9. Progress Monitoring                                    │
│    ├─ Real-time progress bar                              │
│    ├─ Success/failure counters                            │
│    ├─ Error log display                                   │
│    └─ Estimated completion time                           │
│                                                           │
│ 10. Completion & Reporting                                │
│     ├─ Generate update summary                            │
│     ├─ Create audit trail                                 │
│     ├─ Notify stakeholders                                │
│     └─ Update system logs                                 │
└───────────────────────────────────────────────────────────┘
```

### Detailed Bulk Update User Actions

#### Step 1: Filter Configuration
```
User Interface Flow:
1. Open "Masowe Aktualizacje Cen"
2. Filter panel displays:
   ├─ Product categories (multi-select)
   ├─ Supplier dropdown (single/multi)
   ├─ Price range sliders (min/max)
   ├─ Date filters (last update)
   └─ Status checkboxes

3. Real-time filtering:
   ├─ Apply filters → immediate count update
   ├─ Show "Found: X products/services"
   ├─ Display sample items in preview
   └─ Enable/disable next step

4. Filter refinement:
   ├─ Add/remove filter criteria
   ├─ Save filter sets for reuse
   ├─ Clear all filters option
   └─ Export filtered list
```

#### Step 2: Update Rule Configuration
```
Pricing Strategy Selection:
1. Choose update method:
   [○] Percentage increase/decrease
       ├─ Input: [+5.0]%
       ├─ Apply to: [✓] Selling [✓] Retail [✗] Purchase
       └─ Preview: "25.50 PLN → 26.78 PLN"
   
   [○] Fixed amount adjustment
       ├─ Input: [+2.50] PLN
       ├─ Apply to all selected prices
       └─ Preview calculation
   
   [○] Target margin
       ├─ Input: [28.5]% target margin
       ├─ Calculate selling price from purchase
       └─ Show margin impact

2. Advanced options:
   ├─ Rounding preferences
   ├─ Minimum/maximum price limits  
   ├─ Competitive pricing checks
   └─ Margin validation rules

3. Scheduling options:
   ├─ Immediate execution
   ├─ Schedule for specific date/time
   ├─ Gradual rollout over days
   └─ Coordinate with promotional periods
```

#### Step 3: Validation Process
```
Pre-execution Validation:
1. System checks:
   ├─ Price range validation (not negative)
   ├─ Margin threshold compliance
   ├─ Competitive pricing alerts
   └─ Inventory impact analysis

2. Business rule validation:
   ├─ Check existing quotes/orders
   ├─ Validate customer contracts
   ├─ Verify promotional conflicts
   └─ Ensure compliance requirements

3. Preview generation:
   ├─ Show first 20 items with changes
   ├─ Highlight significant changes (>20%)
   ├─ Flag potential issues
   └─ Provide export option

4. Approval workflow:
   ├─ Generate approval request
   ├─ Include impact analysis
   ├─ Set approval deadline
   └─ Send notifications
```

## 4. Service Tier Management Workflow

### Service Pricing Tier Configuration
```
Service Tier Management Flow:
┌─ Service Selection ───────────────────────────────────────┐
│ 1. Access Service Pricing                                 │
│    ├─ Navigate to "Cennik Usług"                         │
│    ├─ Load service categories                             │
│    ├─ Display service grid/list                           │
│    └─ Show tier overview                                  │
│                                                           │
│ 2. Service Filter & Search                                │
│    ├─ Filter by category (Wood, Laminate, etc.)          │
│    ├─ Filter by installation method                       │
│    ├─ Search by service name                              │
│    └─ Filter by pricing tier                              │
│                                                           │
│ 3. Select Service for Editing                             │
│    ├─ Click on service card                               │
│    ├─ View current tier pricing                           │
│    ├─ Check recent price changes                          │
│    └─ Open tier management modal                          │
└───────────────────────────────────────────────────────────┘

┌─ Tier Price Configuration ────────────────────────────────┐
│ 4. Basic Tier Settings                                    │
│    ├─ Base price per m² (foundation price)               │
│    ├─ Minimum charge for small jobs                       │
│    ├─ Time per m² estimation                              │
│    └─ Skill level requirement                             │
│                                                           │
│ 5. Standard Tier Settings                                 │
│    ├─ Standard price per m² (+15-25% over basic)         │
│    ├─ Enhanced service features                           │
│    ├─ Better quality materials/tools                      │
│    └─ Experienced technician assignment                   │
│                                                           │
│ 6. Premium Tier Settings                                  │
│    ├─ Premium price per m² (+25-40% over basic)          │
│    ├─ Premium service guarantees                          │
│    ├─ Top-tier materials and equipment                    │
│    └─ Master craftsman assignment                         │
│                                                           │
│ 7. Advanced Pricing Rules                                 │
│    ├─ Volume discounts (50m²+ = -5%, 100m²+ = -10%)     │
│    ├─ Regional pricing multipliers                        │
│    ├─ Seasonal adjustments                                │
│    └─ Customer tier pricing                               │
└───────────────────────────────────────────────────────────┘

┌─ Validation & Implementation ─────────────────────────────┐
│ 8. Price Validation                                       │
│    ├─ Check margin requirements                           │
│    ├─ Validate against competition                        │
│    ├─ Ensure tier progression logic                       │
│    └─ Test with sample calculations                       │
│                                                           │
│ 9. Impact Analysis                                        │        
│    ├─ Analyze existing quotes using service               │
│    ├─ Calculate revenue impact                            │
│    ├─ Check customer contract implications                │
│    └─ Assess competitive positioning                      │
│                                                           │
│ 10. Implementation                                        │
│     ├─ Save tier configuration                            │
│     ├─ Update related systems                             │
│     ├─ Notify sales team                                  │
│     └─ Update marketing materials                         │
└───────────────────────────────────────────────────────────┘
```

### User Journey: Service Tier Adjustment
```
Scenario: Seasonal price adjustment for wood flooring installation

User: Operations Manager (Anna)
Trigger: Increased material costs and high demand season

Step-by-Step Flow:
1. Login → Dashboard → "Cennik Usług"
2. Filter: Category = "Wood Installation"
3. Select: "Montaż podłogi drewnianej na klej - parkiet"
4. Current pricing review:
   ├─ Basic: 35.50 PLN/m²
   ├─ Standard: 45.50 PLN/m² 
   └─ Premium: 55.50 PLN/m²

5. Price adjustment decision:
   ├─ Market analysis indicates 8% increase possible
   ├─ Material costs increased 5%
   ├─ Demand is high (seasonal factor)
   └─ Competition raised prices recently

6. New pricing calculation:
   ├─ Basic: 35.50 → 38.50 PLN/m² (+8.5%)
   ├─ Standard: 45.50 → 49.00 PLN/m² (+7.7%)
   └─ Premium: 55.50 → 60.00 PLN/m² (+8.1%)

7. Validation checks:
   ├─ Margin improvement: +2.3% average
   ├─ Competitive position: Still mid-range
   ├─ Customer impact: 15 active quotes affected
   └─ Revenue impact: +12,500 PLN monthly

8. Implementation:
   ├─ Save new pricing tiers
   ├─ Effective date: Next Monday
   ├─ Notify sales team via email
   └─ Update customer communication templates

9. Follow-up:
   ├─ Monitor quote conversion rates
   ├─ Track customer feedback
   ├─ Analyze competitor responses
   └─ Adjust if necessary in 30 days

Success Metrics:
├─ Conversion rate maintains >70%
├─ Customer complaints <5%
├─ Revenue increase >10%
└─ Margin improvement >2%
```

## 5. Error Handling and Edge Cases

### Common Error Scenarios

#### Pricing Conflicts
```
Error: Negative margin detected
Trigger: Update would result in selling price below purchase price
Flow:
1. System detects margin violation
2. Show warning dialog with details
3. Options presented:
   ├─ Adjust purchase price
   ├─ Set minimum selling price
   ├─ Exclude item from update
   └─ Override with manager approval
4. Require approval for override
5. Log decision and reasoning
```

#### System Availability Issues
```
Error: Service temporarily unavailable
Trigger: Backend service down or slow response
Flow:
1. Show user-friendly error message
2. Offer options:
   ├─ Retry operation
   ├─ Save draft and continue later
   ├─ Switch to offline mode
   └─ Contact support
3. Auto-save user progress
4. Queue operations for retry
5. Notify when service restored
```

#### Data Validation Failures
```
Error: Invalid NIP number format
Trigger: User enters malformed Polish tax number
Flow:
1. Real-time validation shows error
2. Highlight incorrect field
3. Show format example: "123-456-78-90"
4. Provide correction suggestions
5. Block form submission until fixed
6. Offer NIP validation service lookup
```

### Recovery Procedures

#### Quote Generation Failure
```
Recovery Flow:
1. Auto-save quote data every 30 seconds
2. If generation fails:
   ├─ Restore from auto-save
   ├─ Show what was lost (if any)
   ├─ Allow manual recovery
   └─ Provide export options
3. Log error for analysis
4. Offer alternative generation methods
5. Escalate to support if persistent
```

#### Bulk Update Rollback
```
Rollback Procedure:
1. Detect update failure mid-process
2. Stop further updates immediately
3. Restore from backup:
   ├─ Identify successfully updated records
   ├─ Restore original prices
   ├─ Maintain audit trail
   └─ Verify data integrity
4. Notify users of rollback
5. Analyze failure cause
6. Provide corrected update option
```

This comprehensive user flow documentation ensures smooth operation of the advanced pricing management system while handling Polish business requirements and potential error scenarios gracefully.