# Omnitutor – AI-Powered Educational Platform Technology Stack

**Overview**
Omnitutor is an innovative AI-powered educational platform that combines advanced language models, interactive canvas-based learning, and intelligent study planning. This document outlines the comprehensive technology architecture, AI integrations, educational features, and future enhancement roadmap.

---

## 1. Current Architecture – AI-Enhanced Educational Platform

Omnitutor is built as a modern full-stack application with extensive AI integrations, designed to revolutionize personalized learning experiences through intelligent tutoring, adaptive study planning, and interactive content generation.

### **Frontend & Core Framework**

* **Framework**: Next.js 15+ with TypeScript
* **UI Library**: React 19 with Server Components
* **UI Components**: shadcn/ui (Radix UI-based component library)
* **Styling**: Tailwind CSS 4.0+ with PostCSS
* **State Management**: 
  * **tRPC** for type-safe client-server communication
  * **TanStack Query** for server state management
  * React Context for complex application state
* **Canvas Engine**: @xyflow/react for interactive node-based learning canvases
* **Math Rendering**: better-react-mathjax for mathematical expressions
* **Animations**: Framer Motion for smooth interactions

### **AI & Language Models Integration**

* **Primary AI Provider**: **Google AI (Gemini)**
  * **Models Used**:
    * `gemini-2.5-flash` - Main content generation, study materials, lesson plans
    * `gemini-2.5-flash-lite-preview-06-17` - Real-time chat interactions
    * `gemini-2.5-flash-preview-tts` - Text-to-speech audio generation
  * **Features**: Search grounding enabled for factual accuracy
  * **SDK**: @ai-sdk/google with @google/genai for native integration

* **AI Capabilities**:
  * **Intelligent Tutoring**: Conversational AI tutor with adaptive explanations
  * **Content Generation**: Study slides, notes, lesson plans, assessments
  * **Audio Synthesis**: AI-generated voice narration for all content
  * **Visual Content**: SVG diagram generation and Google Images integration
  * **Study Planning**: AI-powered personalized study schedules

### **Educational Features & Pedagogical Framework**

* **5Es Instructional Model**: Complete implementation of Engage, Explore, Explain, Elaborate, Evaluate phases
* **Canvas-Based Learning**: Interactive node system with multiple learning components:
  * **Chat Nodes**: AI tutor conversations with context awareness
  * **Slide Nodes**: Interactive presentation slides with audio
  * **Notes Nodes**: AI-generated study notes with multimedia content
  * **Test Nodes**: Adaptive assessments with multiple question types
  * **Syllabus Nodes**: Curriculum mapping and topic selection
  * **File Nodes**: Document upload and processing
  * **Action Nodes**: Interactive learning activities

* **Study Planning System**:
  * AI-generated personalized study plans
  * Goal tracking and progress monitoring
  * Adaptive scheduling based on performance
  * Streak tracking and motivation features

### **Backend Infrastructure**

* **BaaS**: Self-hosted Appwrite
  * **Authentication**: OAuth integration (Google), session management
  * **Database**: Document-based storage for user data, canvases, study plans
  * **File Storage**: Media uploads and AI-generated content storage
* **API Architecture**:
  * **tRPC**: Type-safe API layer with automatic validation
  * **Next.js API Routes**: External integrations and file processing
  * **Zod**: Runtime type validation and schema definitions

### **Deployment & Infrastructure**

* **Frontend Hosting**: Google Cloud Run
  * Containerized Next.js application
  * Auto-scaling based on demand
  * 2 vCPUs, 4 GiB memory configuration
* **Backend**: Google Compute Engine
  * Self-hosted Appwrite instance
  * n2-custom-2-10240 (2 vCPUs, 10 GiB RAM)
  * 300 GB persistent storage

### **Development Tools & Quality**

* **Package Manager**: pnpm (high-performance package management)
* **Code Quality**: Biome (ultra-fast linting and formatting)
* **Type Safety**: TypeScript with strict configuration
* **Build Tool**: Next.js with Turbo mode for development

---

## 2. AI Services Architecture

### **Core AI Services**

#### **Sheshya AI Service** (Educational Content)
* **Purpose**: Teacher-focused content generation
* **Capabilities**:
  * 5Es lesson plan generation with pedagogical alignment
  * Educational notes with scaffolding strategies
  * Assessment creation with Bloom's taxonomy integration
  * Real-time chat tutoring with educational context

#### **Main AI Service** (Student Content)
* **Purpose**: Student-focused learning experiences
* **Capabilities**:
  * Interactive study slide generation
  * Syllabus creation and topic mapping
  * Personalized test generation
  * Notes with visual learning enhancements

#### **Audio Service**
* **Purpose**: Text-to-speech and audio content generation
* **Features**:
  * Multiple voice options (Erinome, Chloe, Aria, Dione, etc.)
  * WAV format conversion and optimization
  * Appwrite storage integration

#### **Study Planner Service**
* **Purpose**: AI-powered study schedule optimization
* **Features**:
  * Personalized timeline generation
  * Goal tracking and progress analytics
  * Adaptive scheduling based on performance

---

## 3. Educational Technology Features

### **Interactive Canvas System**
* **Node-Based Learning**: Drag-and-drop learning components
* **Real-Time Collaboration**: Multi-user canvas interactions
* **Progress Tracking**: Visual learning path representation
* **Adaptive Content**: AI-driven content recommendations

### **Multimedia Learning Support**
* **Slide Viewer**: Full-screen presentation mode with keyboard navigation
* **Audio Integration**: AI-generated narration for all content
* **Visual Learning**: SVG diagrams, Google Images integration
* **Code Execution**: Syntax highlighting and interactive examples

### **Assessment & Analytics**
* **Adaptive Testing**: AI-generated questions based on performance
* **Real-Time Feedback**: Immediate explanations and guidance
* **Progress Analytics**: Detailed learning trajectory insights
* **Gamification**: Streak tracking and achievement system

### **Personalization Engine**
* **User Profiling**: Role-based content (student, teacher, professional)
* **Learning Style Adaptation**: Visual, auditory, kinesthetic preferences
* **Difficulty Adjustment**: Dynamic content complexity management
* **Cultural Responsiveness**: Country-specific curriculum alignment

---

## 4. Current Capabilities & Scale

### **Content Generation Capacity**
* **Study Materials**: Unlimited AI-generated content across subjects
* **Languages**: Multi-language support with localization
* **Content Types**: Text, audio, visual, interactive assessments
* **Real-Time Generation**: Sub-second response times for chat interactions

### **User Experience Features**
* **Onboarding Flow**: Guided user setup with role detection
* **Responsive Design**: Mobile-first approach with touch interactions
* **Accessibility**: ARIA compliance and keyboard navigation
* **Offline Capability**: Progressive Web App features

### **Current Limitations & Scale**
* **Estimated Capacity**: 25,000-75,000 Monthly Active Users
* **Bottlenecks**: Single Appwrite instance, limited horizontal scaling
* **AI Costs**: Google AI usage scales with user engagement

---

## 5. Future Technology Roadmap

### **Phase 1: AI Model Diversification (Q2 2024)**
* **Multi-Model Support**: Integration with Claude, GPT-4, and specialized education models
* **Model Routing**: Intelligent selection based on task requirements
* **Cost Optimization**: Dynamic model switching for efficiency

### **Phase 2: Advanced AI Features (Q3 2024)**
* **Vision Models**: Image analysis and diagram understanding
* **Voice Interaction**: Real-time voice tutoring capabilities
* **Multimodal Learning**: Video generation and interactive simulations
* **Adaptive AI**: Personal learning model training

### **Phase 3: Collaborative Learning Platform (Q4 2024)**
* **Virtual Classrooms**: Real-time collaborative learning spaces
* **Peer Learning**: AI-facilitated group study sessions
* **Teacher Dashboard**: Advanced analytics and intervention tools
* **Parent Portal**: Progress tracking and communication features

### **Phase 4: Advanced Analytics & Research (2025)**
* **Learning Analytics**: Predictive performance modeling
* **Educational Research**: Anonymized learning pattern analysis
* **Curriculum Optimization**: AI-driven curriculum recommendations
* **Outcome Prediction**: Early intervention identification

---

## 6. Technical Migration Strategy

### **Database Migration to Managed Services**
* **Target**: PostgreSQL with Prisma/Drizzle ORM
* **Providers**: Neon, Supabase, or PlanetScale
* **Benefits**: Better scaling, ACID compliance, advanced analytics

### **Authentication Modernization**
* **Target**: Clerk or Auth0 for enterprise features
* **Benefits**: SSO, MFA, advanced security, audit logging

### **AI Infrastructure Scaling**
* **Multi-Cloud Strategy**: Distribute across Google AI, OpenAI, Anthropic
* **Edge Deployment**: Regional AI model deployment for latency
* **Caching Layer**: Redis for AI response optimization

### **Microservices Architecture**
* **Service Separation**: Auth, AI, Content, Analytics services
* **Container Orchestration**: Kubernetes for auto-scaling
* **API Gateway**: Centralized request routing and rate limiting

---

## 7. Performance & Scalability Projections

### **Post-Migration Capabilities**
* **User Capacity**: 500,000+ Monthly Active Users
* **API Throughput**: 10M+ monthly requests with <200ms latency
* **Content Generation**: 1M+ AI-generated pieces monthly
* **Global Reach**: Multi-region deployment with CDN

### **AI Model Performance**
* **Response Time**: <2 seconds for complex content generation
* **Accuracy**: 95%+ educational content accuracy with fact-checking
* **Personalization**: Individual learning model adaptation
* **Cost Efficiency**: 60% reduction through model optimization

---

*This technology stack represents a cutting-edge educational platform that leverages the latest in AI technology to create personalized, engaging, and effective learning experiences. The platform is designed to scale globally while maintaining high educational standards and user experience quality.*