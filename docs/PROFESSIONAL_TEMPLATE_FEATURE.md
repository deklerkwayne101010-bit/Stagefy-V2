# Professional Property Listing Template Feature - Architecture Plan

## Overview

This document outlines the architecture for implementing an AI-powered professional property listing template generation feature. The feature will leverage Qwen/Qwen3-235B-A22B-Instruct-2507 for layout generation and Google Nano Banana for final template rendering.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [User Workflow](#user-workflow)
3. [Component Design](#component-design)
4. [API Design](#api-design)
5. [Data Models](#data-models)
6. [AI Model Integration](#ai-model-integration)
7. [Agency Brand System](#agency-brand-system)
8. [Image Management](#image-management)
9. [Implementation Phases](#implementation-phases)

---

## System Architecture

### High-Level Flow
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User          │     │   Stagefy       │     │   Replicate     │
│   Interface     │◄────┤   Frontend      │────►│   API           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               │                        │
                               ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Stagefy       │     │   Qwen Model    │
                        │   Backend       │◄────┤   (Layout Gen)  │
                        └──────────────────┘     └─────────────────┘
                               │
                               │                        │
                               ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Supabase       │     │   Nano Banana   │
                        │   Database       │     │   (Rendering)   │
                        └──────────────────┘     └─────────────────┘
```

### Key Components

1. **Template Selection Component** - UI for choosing professional templates
2. **Layout Generator Service** - Qwen model integration for prompt generation
3. **Template Prompt Review Interface** - User editing of AI-generated prompts
4. **Template Rendering Service** - Nano Banana integration for final output
5. **Agent Profile Manager** - Handles agent data integration
6. **Brand Styling Engine** - Applies agency brand constraints
7. **Image Placement System** - Auto-routes user images to template placeholders

---

## User Workflow

### Step 1: Template Selection
```
User Action: Click on "Professional Template" option

System Response:
1. Display template category options:
   - Luxury Showcase
   - Modern Minimalist
   - Family Home
   - Investment Property
   - Commercial Listing

2. Show "Generate Layout" popup modal

3. User confirms by clicking "Generate Layout"
```

### Step 2: Layout Generation (Qwen Model)
```
System Action: Invoke Qwen model with prompt

Prompt sent to Qwen:
"Generate a completely unique and perfectly structured prompt layout 
and styling specifically designed for a professional property listing 
template. Include all necessary formatting, structure, content 
placeholders, and styling specifications."

User sees: Loading indicator with progress updates
```

### Step 3: Prompt Review Interface
```
System displays:
1. Generated prompt in editable text area
2. Layout preview (if available)
3. Edit / Approve buttons

User can:
1. Review the generated prompt
2. Edit text directly
3. Add/remove placeholders
4. Adjust styling preferences
5. Click "Approve" to proceed
```

### Step 4: Agent Profile Integration
```
System displays popup dialog:
"Would you like to incorporate agent profile information 
into this template?"

Options:
- [Yes] - Include agent data
- [No]  - Proceed without agent profile

If Yes:
- Agent data collected from profile:
  * Name, Photo, Email, Phone
  * Agency Logo, Credentials
  * Listing History (optional)
```

### Step 5: Agency Brand Selection
```
If agent profile selected, show brand dropdown:

Available Brands:
- RE/MAX
- Pam Golding
- Seeff
- ERA
- Harcourts
- Custom Brand

System sends brand specs to Nano Banana:
- Primary colors
- Typography
- Logo placement rules
- Tagline formats
```

### Step 6: Final Template Generation
```
User Action: Click "Generate Template"

System Actions:
1. Collect all user-uploaded images
2. Match images to template placeholders
3. Send complete dataset to Nano Banana

Nano Banana receives:
- Approved prompt
- Agent profile data (if applicable)
- Brand styling rules
- User images with placeholder mapping
- Property details

Output: Professional rendered template
```

---

## Component Design

### 1. TemplateSelectionModal Component

```typescript
interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ProfessionalTemplate) => void;
  onGenerateLayout: (template: ProfessionalTemplate) => void;
}

interface ProfessionalTemplate {
  id: string;
  name: string;
  category: 'luxury' | 'modern' | 'family' | 'investment' | 'commercial';
  thumbnail: string;
  description: string;
  placeholderCount: number;
  imageSlots: ImageSlot[];
  defaultPrompt: string;
}
```

### 2. LayoutGenerationPopup Component

```typescript
interface LayoutGenerationPopupProps {
  isOpen: boolean;
  template: ProfessionalTemplate;
  onGenerate: (template: ProfessionalTemplate) => Promise<void>;
  onCancel: () => void;
}

// Shows "Generate Layout" confirmation
// Displays progress during Qwen model invocation
```

### 3. PromptReviewInterface Component

```typescript
interface PromptReviewInterfaceProps {
  generatedPrompt: string;
  layoutPreview?: string;
  onEdit: (newPrompt: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

// Features:
// - Syntax-highlighted prompt display
// - Rich text editing
// - Placeholder visualization
// - Version history (optional)
```

### 4. AgentProfilePopup Component

```typescript
interface AgentProfilePopupProps {
  isOpen: boolean;
  agentProfile: AgentProfile;
  onConfirm: (includeAgent: boolean, brand?: AgencyBrand) => void;
  onCancel: () => void;
}

interface AgencyBrand {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: 'top' | 'bottom' | 'sidebar';
  tagline?: string;
}
```

### 5. ImagePlacementManager Component

```typescript
interface ImagePlacementManagerProps {
  images: UploadedImage[];
  templatePlaceholders: TemplatePlaceholder[];
  onAssign: (imageId: string, placeholderId: string) => void;
  onAutoAssign: () => void;
}

interface TemplatePlaceholder {
  id: string;
  name: string;
  type: 'hero' | 'gallery' | 'detail' | 'floorplan' | 'map';
  preferredAspectRatio: number;
  position: number;
}

interface UploadedImage {
  id: string;
  url: string;
  aspectRatio: number;
  tags: string[];
}
```

---

## API Design

### 1. Generate Layout Endpoint

**POST** `/api/ai/template/layout`

```typescript
interface LayoutGenerationRequest {
  templateId: string;
  propertyType: 'house' | 'apartment' | 'commercial' | 'land';
  brand?: AgencyBrand;
  userPreferences?: {
    colorScheme?: string;
    styleKeywords?: string[];
    specialRequirements?: string;
  };
}

interface LayoutGenerationResponse {
  prompt: string;
  layoutStructure: {
    sections: TemplateSection[];
    placeholders: TemplatePlaceholder[];
  };
  estimatedTokens: number;
}
```

### 2. Render Template Endpoint

**POST** `/api/ai/template/render`

```typescript
interface TemplateRenderRequest {
  approvedPrompt: string;
  propertyData: {
    title: string;
    description: string;
    address: string;
    price: number;
    features: string[];
  };
  agentProfile?: {
    include: boolean;
    data: AgentProfileData;
  };
  brand?: AgencyBrand;
  images: {
    url: string;
    placeholderId: string;
    caption?: string;
  }[];
  options: {
    outputFormat: 'jpg' | 'png' | 'pdf';
    resolution: 'hd' | '4k';
    watermark: boolean;
  };
}

interface TemplateRenderResponse {
  outputUrl: string;
  generationTime: number;
  tokensUsed: number;
}
```

### 3. Agent Profile Endpoint (Extended)

**POST** `/api/agent-profile`

```typescript
interface AgentProfileData {
  // Existing fields
  name_surname: string;
  email: string;
  phone: string;
  photo_url?: string;
  logo_url?: string;
  
  // New fields for professional templates
  agency_brand?: string;
  license_number?: string;
  years_experience?: number;
  specializations?: string[];
  awards?: string[];
  bio?: string;
  social_media?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}
```

### 4. Agency Brands Endpoint

**GET** `/api/brands`

```typescript
interface AgencyBrand {
  id: string;
  name: string;
  logo_url: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
  };
  template_styles: {
    header_layout: string;
    footer_layout: string;
    badge_style: string;
  };
}
```

---

## Data Models

### Database Tables

```sql
-- Professional Templates Table
CREATE TABLE professional_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  prompt_template TEXT NOT NULL,
  layout_structure JSONB NOT NULL,
  image_slots JSONB NOT NULL,
  brand_id UUID REFERENCES agency_brands(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  credit_cost INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agency Brands Table
CREATE TABLE agency_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  heading_font VARCHAR(100),
  body_font VARCHAR(100),
  header_layout VARCHAR(50) DEFAULT 'standard',
  footer_layout VARCHAR(50) DEFAULT 'standard',
  badge_style VARCHAR(50) DEFAULT 'minimal',
  template_styles JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template Generations Table
CREATE TABLE template_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  template_id UUID REFERENCES professional_templates(id),
  property_id UUID,
  prompt TEXT NOT NULL,
  agent_profile_included BOOLEAN DEFAULT false,
  brand_id UUID REFERENCES agency_brands(id),
  images_used JSONB,
  output_url TEXT,
  credit_cost INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Image Placeholder Mappings Table
CREATE TABLE image_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES template_generations(id),
  placeholder_id VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW()
);
```

---

## AI Model Integration

### Qwen Model Configuration (Layout Generation)

```typescript
const QWEN_MODEL_CONFIG = {
  model: 'qwen/qwen3-235b-a22b-instruct-2507',
  temperature: 0.7,
  max_tokens: 4000,
  system_prompt: `You are an expert real estate marketing designer. 
Generate unique, professional property listing template layouts.
Include specific placeholder positions, styling instructions,
and content formatting rules.`,
};

interface LayoutGenerationPrompt {
  template_type: string;
  property_category: string;
  brand_specifications?: BrandSpecs;
  user_preferences?: UserPreferences;
}

interface GeneratedLayout {
  prompt: string;
  structure: {
    sections: Section[];
    placeholders: Placeholder[];
  };
  styling: {
    colors: string[];
    fonts: string[];
    spacing: string[];
  };
}
```

### Nano Banana Configuration (Template Rendering)

```typescript
const NANO_BANANA_CONFIG = {
  model: 'nanobanana/professional-templates-v1',
  version: '2.0',
  output_formats: ['jpg', 'png', 'pdf'],
  max_resolution: '4k',
};

interface NanoBananaInput {
  prompt: string;
  images: {
    url: string;
    placeholder: string;
    order: number;
  }[];
  agent_data?: {
    name: string;
    photo: string;
    contact: {
      phone: string;
      email: string;
    };
    logo: string;
    credentials?: string[];
  };
  brand_style: {
    colors: string[];
    fonts: string[];
    logo_placement: string;
  };
  options: {
    resolution: string;
    watermark: boolean;
  };
}
```

---

## Agency Brand System

### Predefined Brands

```typescript
const PREDEFINED_BRANDS: AgencyBrand[] = [
  {
    id: 'remax',
    name: 'RE/MAX',
    primaryColor: '#e11d48',
    secondaryColor: '#be123c',
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    logoPosition: 'top',
    tagline: 'With You All The Way',
  },
  {
    id: 'pam-golding',
    name: 'Pam Golding',
    primaryColor: '#1e3a5f',
    secondaryColor: '#0f172a',
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    logoPosition: 'top',
    tagline: 'The Gold Standard in Property',
  },
  {
    id: 'seeff',
    name: 'Seeff',
    primaryColor: '#0d9488',
    secondaryColor: '#0f766e',
    headingFont: 'Raleway',
    bodyFont: 'Inter',
    logoPosition: 'sidebar',
    tagline: "Experience the Difference",
  },
  // Additional brands...
];
```

### Brand Application Rules

```typescript
function applyBrandStyle(
  layout: GeneratedLayout,
  brand: AgencyBrand
): StyledLayout {
  return {
    ...layout,
    styling: {
      ...layout.styling,
      colors: [
        brand.primaryColor,
        brand.secondaryColor,
        brand.accentColor || brand.secondaryColor,
      ],
      fonts: {
        heading: brand.headingFont,
        body: brand.bodyFont,
      },
    },
    placeholders: layout.placeholders.map(p => ({
      ...p,
      style: {
        ...p.style,
        borderColor: brand.primaryColor,
        badgeColor: brand.secondaryColor,
      },
    })),
  };
}
```

---

## Image Management

### Automatic Image Placement Algorithm

```typescript
interface ImageScoringResult {
  imageId: string;
  placeholderId: string;
  score: number;
  reasons: string[];
}

function calculateImageScores(
  images: UploadedImage[],
  placeholders: TemplatePlaceholder[]
): ImageScoringResult[] {
  const results: ImageScoringResult[] = [];
  
  for (const image of images) {
    for (const placeholder of placeholders) {
      let score = 0;
      const reasons: string[] = [];
      
      // Aspect ratio matching
      const ratioMatch = calculateAspectRatioMatch(
        image.aspectRatio,
        placeholder.preferredAspectRatio
      );
      score += ratioMatch * 0.4;
      if (ratioMatch > 0.8) {
        reasons.push('Perfect aspect ratio match');
      }
      
      // Position-based scoring (first image = hero)
      if (placeholder.type === 'hero' && image.tags.includes('hero')) {
        score += 0.3;
        reasons.push('Tagged as hero image');
      }
      
      // Quality scoring
      const quality = assessImageQuality(image);
      score += quality * 0.2;
      
      // Resolution matching
      const resolution = checkResolution(image, placeholder);
      score += resolution * 0.1;
      
      results.push({
        imageId: image.id,
        placeholderId: placeholder.id,
        score,
        reasons,
      });
    }
  }
  
  return results;
}

function autoAssignImages(
  images: UploadedImage[],
  placeholders: TemplatePlaceholder[]
): Map<string, string> {
  const assignments = new Map<string, string>();
  const scores = calculateImageScores(images, placeholders);
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  // Assign highest-scoring images to each placeholder
  const usedImages = new Set<string>();
  
  for (const result of scores) {
    if (
      !assignments.has(result.placeholderId) &&
      !usedImages.has(result.imageId)
    ) {
      assignments.set(result.placeholderId, result.imageId);
      usedImages.add(result.imageId);
    }
  }
  
  return assignments;
}
```

### Image Preprocessing

```typescript
interface PreprocessedImage {
  id: string;
  url: string;
  aspectRatio: number;
  dimensions: { width: number; height: number };
  quality: number;
  dominantColors: string[];
  tags: string[];
}

async function preprocessImage(imageUrl: string): Promise<PreprocessedImage> {
  // Download image
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  // Get dimensions
  const dimensions = await getImageDimensions(blob);
  
  // Calculate aspect ratio
  const aspectRatio = dimensions.width / dimensions.height;
  
  // Assess quality
  const quality = assessImageQuality(blob);
  
  // Extract dominant colors
  const dominantColors = await extractColors(blob);
  
  // Auto-tag based on content analysis
  const tags = await analyzeImageContent(blob);
  
  return {
    id: generateId(),
    url: imageUrl,
    aspectRatio,
    dimensions,
    quality,
    dominantColors,
    tags,
  };
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Tasks:**
1. [ ] Set up agency_brands database table
2. [ ] Create brand seed data (RE/MAX, Pam Golding, Seeff)
3. [ ] Build basic TemplateSelectionModal component
4. [ ] Create LayoutGenerationPopup component
5. [ ] Implement Qwen model API integration for layout generation
6. [ ] Build PromptReviewInterface component

**Deliverables:**
- Database schema with agency brands
- UI components for template selection and layout generation
- API endpoint for Qwen model invocation

### Phase 2: Agent Profile Integration (Week 2)

**Tasks:**
1. [ ] Extend agent_profiles table with new fields
2. [ ] Create AgentProfilePopup component
3. [ ] Build brand selection dropdown UI
4. [ ] Implement conditional data injection system
5. [ ] Update template generation API to handle agent data
6. [ ] Add brand styling rules to prompt generation

**Deliverables:**
- Enhanced agent profile with brand selection
- Popup dialog for agent profile integration
- Updated API with agent data handling

### Phase 3: Image Management (Week 3)

**Tasks:**
1. [ ] Implement image preprocessing pipeline
2. [ ] Build ImagePlacementManager component
3. [ ] Create auto-assignment algorithm
4. [ ] Add manual override controls
5. [ ] Implement placeholder visualization
6. [ ] Add image quality assessment

**Deliverables:**
- Automatic image placement system
- Manual adjustment UI
- Image preprocessing pipeline

### Phase 4: Template Rendering (Week 4)

**Tasks:**
1. [ ] Integrate Nano Banana API
2. [ ] Build TemplateRenderService
3. [ ] Implement output format options (JPG, PNG, PDF)
4. [ ] Add resolution selection
5. [ ] Implement watermark control
6. [ ] Add generation progress tracking

**Deliverables:**
- Full template rendering pipeline
- Output generation system
- Download/display functionality

### Phase 5: Testing & Polish (Week 5)

**Tasks:**
1. [ ] End-to-end testing of complete workflow
2. [ ] Performance optimization
3. [ ] Error handling and fallback UI
4. [ ] User experience refinements
5. [ ] Documentation and examples
6. [ ] Bug fixes and edge cases

**Deliverables:**
- Production-ready feature
- User documentation
- API documentation

---

## UI Mockups

### Template Selection Screen
```
┌─────────────────────────────────────────────────────────────┐
│  Professional Templates                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │             │  │             │  │             │          │
│  │   LUXURY    │  │   MODERN    │  │   FAMILY    │          │
│  │  SHOWCASE   │  │  MINIMALIST │  │    HOME     │          │
│  │             │  │             │  │             │          │
│  │  [Select]   │  │  [Select]   │  │  [Select]   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │             │  │             │  │             │          │
│  │ INVESTMENT  │  │ COMMERCIAL  │  │  CUSTOM     │          │
│  │  PROPERTY   │  │   LISTING   │  │   DESIGN    │          │
│  │             │  │             │  │             │          │
│  │  [Select]   │  │  [Select]   │  │  [Select]   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layout Generation Popup
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌───────────────────┐                    │
│                    │                   │                    │
│                    │    Generating...   │                    │
│                    │                   │                    │
│                    └───────────────────┘                    │
│                                                             │
│              Generate Layout                                │
│                                                             │
│    Are you sure you want to generate a custom layout        │
│    for this template?                                       │
│                                                             │
│    ┌──────────────┐    ┌──────────────┐                    │
│    │    Cancel    │    │  Generate    │                    │
│    └──────────────┘    └──────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Profile Integration Popup
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Agent Profile Integration                       │
│                                                             │
│    ┌─────────────────────────────────────┐                  │
│    │                                     │                  │
│    │   Agent Photo    Agent Name         │                  │
│    │                  Agent Email        │                  │
│    │                  Agent Phone        │                  │
│    │                  Agency Logo        │                  │
│    │                                     │                  │
│    └─────────────────────────────────────┘                  │
│                                                             │
│    Would you like to include agent profile information       │
│    in this template?                                        │
│                                                             │
│    ┌─────────────────────────────────────┐                  │
│    │  Agency Brand:  [RE/MAX ▼]          │                  │
│    └─────────────────────────────────────┘                  │
│                                                             │
│    ┌──────────────┐    ┌──────────────┐                    │
│    │     No       │    │     Yes      │                    │
│    └──────────────┘    └──────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Prompt Review Interface
```
┌─────────────────────────────────────────────────────────────┐
│  Template Prompt Review                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  [Generated prompt with syntax highlighting]         │    │
│  │                                                     │    │
│  │  - Section 1: Property Header                       │    │
│  │  - Section 2: Hero Image Placeholder               │    │
│  │  - Section 3: Property Details                     │    │
│  │  ...                                                │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────┐    ┌───────────────────┐                  │
│  │    Reject    │    │   Approve &       │                  │
│  │              │    │   Generate        │                  │
│  └──────────────┘    └───────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

1. **User Engagement**
   - Template usage count
   - Completion rate (workflow abandonment)
   - Time-to-complete workflow

2. **Quality Metrics**
   - User satisfaction ratings
   - Template download/share counts
   - Revisions needed per template

3. **Performance Metrics**
   - Qwen model response time
   - Nano Banana rendering time
   - Overall workflow duration

4. **Business Metrics**
   - Credit usage per template
   - Conversion to paid features
   - Return user rate

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Qwen API latency | High | Medium | Add loading states, caching |
| Nano Banana failures | High | Low | Fallback templates |
| Image processing errors | Medium | Medium | Manual override options |
| Brand style conflicts | Low | Low | Pre-defined brand rules |
| User confusion | Medium | Medium | Clear UX, tooltips, examples |

---

*Document Version: 1.0*
*Last Updated: 2024-01-15*
*Author: Stagefy Development Team*
