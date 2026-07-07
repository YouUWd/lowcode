---
name: Technical Precision System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  canvas-grid: 24px
  gutter-md: 16px
  margin-edge: 32px
  row-height: 36px
---

## Brand & Style

This design system is engineered for technical proficiency and data density. It prioritizes clarity and utility, employing a **Corporate / Modern** aesthetic with a subtle **Minimalist** lean. The target audience consists of database administrators, engineers, and data architects who require a high-fidelity environment that reduces cognitive load during complex schema management. 

The visual narrative is built around a "canvas" metaphor, treating the workspace as a precise drafting environment. Key characteristics include:
- **Utilitarian Rigor:** Every pixel serves a functional purpose; decorative elements are stripped back to allow data to lead.
- **Architectural Depth:** Using structural lines and tonal layering rather than heavy shadows to define hierarchy.
- **Systematic Clarity:** High-contrast interactions and standardized data-type iconography provide immediate visual feedback.

## Colors

The palette is anchored in a professional spectrum of Slate Grays and Corporate Blues.
- **Primary (Slate 900):** Used for primary text, navigation backgrounds, and deep structural elements to ground the UI.
- **Secondary (Blue 600):** Reserved for primary actions, active states, and foreign key indicators to draw attention to critical connections.
- **Tertiary (Slate 500):** Applied to supporting metadata, icons, and secondary information that requires less visual weight.
- **Neutral (Slate 50):** The foundational surface color, providing a clean, low-strain backdrop for long-duration work.
- **Accent (Blue 50):** Used for row highlighting and subtle state changes.
- **Semantic Colors:** Emerald 600 for success/commits, Rose 600 for errors/deletions, and Amber 500 for warnings/unsaved changes.

## Typography

This design system utilizes **Inter** for its systematic and highly legible character, ensuring clarity across dense data tables. For technical strings, SQL queries, and data types, **JetBrains Mono** is employed to provide the necessary monospaced distinction.

- **Headlines:** Set in tight, semi-bold Inter to define clear sections.
- **Body:** Uses 14px as the standard density for table content, providing a balance between information density and readability.
- **Labels:** Monospaced labels are used for technical keys (PK/FK) and data types (INT, VARCHAR) to separate schema metadata from human-readable content.

## Layout & Spacing

The layout utilizes a **Fixed Grid** workspace (the canvas) with a high-density sidebar for navigation.
- **Canvas Grid:** The workspace background features a subtle dot-grid or line-grid every 24px, reinforcing the "technical drawing" feel.
- **Table Cards:** Elements should snap to a 4px internal grid. Headers in table cards use a fixed 40px height, while property rows are standardized at 36px.
- **Responsiveness:** On smaller viewports, the multi-column canvas reflows into a single-column list. Sidebars are collapsible to maximize the data viewing area.
- **Safe Areas:** Maintain a 32px margin around the main canvas area to ensure UI elements do not feel cramped against the browser edges.

## Elevation & Depth

Depth is achieved through **Low-contrast outlines** and **Tonal layers** rather than traditional shadows.
- **Level 0 (Canvas):** The base background using Neutral (#F8FAFC) with a light gray grid (#E2E8F0).
- **Level 1 (Cards):** White surfaces with a 1px border (#CBD5E1). No shadow in default state.
- **Level 2 (Active/Drag):** When a table card is selected or being moved, apply a soft, 8px ambient shadow with 5% opacity and a Primary (#0F172A) tint to indicate "lift."
- **Dividers:** Use 1px borders (#F1F5F9) to separate rows within cards, ensuring a clean vertical rhythm.

## Shapes

The shape language is "Soft" (0.25rem), providing a modern feel while maintaining the structured, rectangular integrity required for a grid-based tool.
- **Table Cards:** 0.5rem (rounded-lg) for the outer container to differentiate them from the sharp lines of the canvas grid.
- **Inputs & Buttons:** 0.25rem for a precise, professional look.
- **Data Type Badges:** Fully rounded (pill) only for status indicators; otherwise, use the standard 0.25rem for technical labels.

## Components

### Table Cards
The central component of the system. Cards feature a header with a Primary (#0F172A) background and white text for high contrast. 
- **Property Rows:** Each row contains an icon (left), field name (middle), and data type (right).
- **Icons:** 14px size. A "Key" icon (Slate 500) for Primary Keys; a "Link" icon (Blue 600) for Foreign Keys.

### Buttons
- **Primary:** Solid Primary (#0F172A) with white text.
- **Ghost:** Transparent background with a Slate 300 border. Used for secondary canvas actions.

### Input Fields
Strict, rectangular fields with 1px borders. Focus states use a 2px Blue 600 ring with 0px offset.

### Chips & Badges
Used for data types (e.g., `VARCHAR`, `INT`). These should use the `label-mono` typography, a light gray background (#F1F5F9), and a slightly darker text color (#475569).

### Connection Lines
For ER-diagram views, lines should be 1.5px thick, using Blue 600 for active relationships and Slate 300 for inactive ones, with a subtle 4px corner radius on elbows.