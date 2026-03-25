# Study Slide Components

This directory contains production-grade React components for the study slide generation and viewing system.

## Architecture

The components are designed with separation of concerns and reusability in mind:

### Core Components

#### `SlideGenerator`

- **Purpose**: Form interface for generating study slides
- **Features**:
  - Topic validation and suggestions
  - Duration selection with quick presets
  - Real-time generation progress
  - Error handling and retry logic
  - Random topic suggestions

#### `SlideViewer`

- **Purpose**: Main slide presentation component
- **Features**:
  - Fullscreen presentation mode
  - Keyboard navigation (←, →, Esc, Ctrl+F)
  - Progress bar and slide counter
  - Responsive design for all screen sizes
  - Smooth transitions and animations

#### `SlideElement`

- **Purpose**: Renders individual slide content elements
- **Supported Types**:
  - Text with markdown support (bold, italic, code)
  - Images with error handling and lazy loading
  - Code blocks with syntax highlighting
  - Questions with special formatting
  - SVG diagrams
  - Audio/Video elements
  - Fallback for unknown types

#### `AudioPlayer`

- **Purpose**: Advanced audio playback control
- **Features**:
  - Custom play/pause controls
  - Seek functionality with progress bar
  - Volume control
  - Loading states and error handling
  - Time display and restart functionality

#### `AudioProgressTracker`

- **Purpose**: Shows progress of background audio generation
- **Features**:
  - Real-time status updates
  - Overall progress percentage
  - Individual slide status indicators
  - Retry functionality for failed generations
  - Collapsible interface

#### `SlideThumbnails`

- **Purpose**: Grid view of all slides with navigation
- **Features**:
  - Visual slide previews
  - Audio status indicators
  - Content type icons (text, code, question, image)
  - Click-to-navigate functionality
  - Current slide highlighting

### Data Flow

```
SlideGenerator → Main Page → Backend API
                    ↓
            SlideViewer (immediate display)
                    ↓
        AudioProgressTracker (background process)
                    ↓
            SlideThumbnails (overview)
```

### Type System

All components use TypeScript with strict typing defined in `types.ts`:

- `StudySlideElement`: Individual content elements
- `StudySlide`: Complete slide structure
- `AudioGenerationProgress`: Audio processing state
- `ViewMode`: Display mode ('structured' | 'html')

### State Management

- **Local State**: Each component manages its own UI state
- **Shared State**: Main page coordinates global state via props
- **Async State**: Audio generation managed with tRPC mutations

### Performance Optimizations

- **Lazy Loading**: Images load on demand
- **Staggered Requests**: Audio generation with 2-second delays
- **Memoization**: React.memo and useMemo for expensive operations
- **Animations**: CSS transitions for smooth UX

### Error Handling

- **Network Errors**: Automatic retry with user feedback
- **Validation**: Form validation with real-time feedback
- **Graceful Degradation**: Fallbacks for missing content
- **Loading States**: Progress indicators for all async operations

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order
- **High Contrast**: Color schemes for visibility

## Usage

```typescript
import {
  SlideGenerator,
  SlideViewer,
  AudioProgressTracker,
} from "./components";

// Or import everything
import * as StudySlideComponents from "./components";
```

## Development

### Adding New Slide Element Types

1. Update `StudySlideElement` type in `types.ts`
2. Add case in `SlideElement.tsx`
3. Update backend AI service to generate new type
4. Add icon in `SlideThumbnails.tsx`

### Customizing Audio Player

The `AudioPlayer` component is fully self-contained and can be styled via CSS classes or replaced entirely.

### Extending Progress Tracking

`AudioProgressTracker` can be extended to show additional metadata or progress details by updating the `AudioGenerationProgress` type.

## Best Practices

1. **Component Isolation**: Each component should be independently testable
2. **Props Validation**: All props should be properly typed
3. **Error Boundaries**: Wrap components in error boundaries in production
4. **Performance**: Use React DevTools to monitor render cycles
5. **Accessibility**: Test with screen readers and keyboard-only navigation
