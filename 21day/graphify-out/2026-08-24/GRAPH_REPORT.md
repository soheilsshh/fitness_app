# Graph Report - fitness_app\21day  (2026-08-22)

## Corpus Check
- 112 files · ~58,960 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 723 nodes · 978 edges · 100 communities (47 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- devDependencies
- sidebar.tsx
- carousel.tsx
- mysql.go
- AdminDashboard.tsx
- hooks/use-toast.ts
- compilerOptions
- cn
- button.tsx
- utils.ts
- compilerOptions
- command.tsx
- API Integration Documentation
- components.json
- Videos.tsx
- admin_controller.go
- dependencies
- FitinoPageShell.tsx
- RegistrationForm.tsx
- menubar.tsx
- compilerOptions
- Index.tsx
- context-menu.tsx
- dropdown-menu.tsx
- App.tsx
- alert-dialog.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- select.tsx
- Welcome to your Lovable project
- IncomeCalculator.tsx
- toggle-group.tsx
- ApiService
- FAQSection.tsx
- ErrorBoundary
- alert.tsx
- input-otp.tsx
- response.go
- avatar.tsx
- badge.tsx
- AdminSession
- Progress
- User
- CountdownTimer.tsx
- TopCountdownTimer.tsx
- radio-group.tsx
- video.go
- clsx
- cmdk
- date-fns
- embla-carousel-react
- framer-motion
- @hookform/resolvers
- input-otp
- lucide-react
- next-themes
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-toast
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-day-picker
- react-dom
- react-hook-form
- react-resizable-panels
- react-router-dom
- recharts
- sonner
- tailwind-merge
- tailwindcss-animate
- @tanstack/react-query
- vaul
- zod
- monetizeai-backend

## God Nodes (most connected - your core abstractions)
1. `cn()` - 71 edges
2. `compilerOptions` - 19 edges
3. `compilerOptions` - 14 edges
4. `useToast()` - 12 edges
5. `Button` - 11 edges
6. `ApiService` - 10 edges
7. `compilerOptions` - 9 edges
8. `react` - 8 edges
9. `useUser()` - 7 edges
10. `API Integration Documentation` - 7 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `LoadConfig()`  [INFERRED]
  fitness_app/21day/backend/main.go → fitness_app/21day/backend/config/config.go
- `CompleteVideo()` --calls--> `CancelScheduledSMS()`  [INFERRED]
  fitness_app/21day/backend/controllers/video_controller.go → fitness_app/21day/backend/database/mysql.go
- `startSMSScheduler()` --calls--> `MarkSMSSent()`  [INFERRED]
  fitness_app/21day/backend/main.go → fitness_app/21day/backend/database/mysql.go
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  fitness_app/21day/src/components/ui/alert-dialog.tsx → fitness_app/21day/src/lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  fitness_app/21day/src/components/ui/alert-dialog.tsx → fitness_app/21day/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (100 total, 53 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.04
Nodes (45): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, lovable-tagger, devDependencies (+37 more)

### Community 1 - "sidebar.tsx"
Cohesion: 0.05
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 2 - "carousel.tsx"
Cohesion: 0.05
Nodes (34): react, react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem (+26 more)

### Community 3 - "mysql.go"
Cohesion: 0.08
Nodes (28): LoadConfig(), GetAdminUsersCSV(), Context, RegisterUser(), writeUsersCSV(), CompleteVideo(), GetUserProgress(), GetVideos() (+20 more)

### Community 4 - "AdminDashboard.tsx"
Cohesion: 0.12
Nodes (21): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow (+13 more)

### Community 5 - "hooks/use-toast.ts"
Cohesion: 0.12
Nodes (22): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+14 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+16 more)

### Community 7 - "cn"
Cohesion: 0.15
Nodes (17): FitinoBrandMark(), FitinoBrandMarkProps, ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent (+9 more)

### Community 8 - "button.tsx"
Cohesion: 0.16
Nodes (10): Props, State, Button, Card, CardContent, CardDescription, CardFooter, CardHeader (+2 more)

### Community 9 - "utils.ts"
Cohesion: 0.11
Nodes (11): Checkbox, HoverCardContent, PopoverContent, ScrollArea, ScrollBar, Switch, TabsContent, TabsList (+3 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 11 - "command.tsx"
Cohesion: 0.12
Nodes (15): Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+7 more)

### Community 12 - "API Integration Documentation"
Cohesion: 0.12
Nodes (16): API Endpoints, API Integration Documentation, API Service (`src/lib/api.ts`), Available Endpoints, Base URL, Error Handling, Frontend Features, Loading & Error States (+8 more)

### Community 13 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 14 - "Videos.tsx"
Cohesion: 0.17
Nodes (12): LoadingSpinner(), LoadingSpinnerProps, Progress, Progress, RegisterRequest, RegisterResponse, User, UserProgress (+4 more)

### Community 15 - "admin_controller.go"
Cohesion: 0.27
Nodes (13): AdminAuthMiddleware(), AdminLogin(), AdminLogout(), extractBearerToken(), generateAdminToken(), GetAdminStats(), GetAdminUsersList(), Context (+5 more)

### Community 16 - "dependencies"
Cohesion: 0.15
Nodes (13): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-accordion, @radix-ui/react-dialog, @radix-ui/react-navigation-menu, @radix-ui/react-popover, @radix-ui/react-tabs (+5 more)

### Community 17 - "FitinoPageShell.tsx"
Cohesion: 0.27
Nodes (8): CountdownSection(), FitinoPageShellProps, HeaderCountdown(), JourneyRail(), JourneyRailProps, JourneyStep, padCountdown(), REGISTRATION_COUNTDOWN

### Community 18 - "RegistrationForm.tsx"
Cohesion: 0.26
Nodes (8): RegistrationForm(), Input, Label, labelVariants, Toaster(), useToast(), ThankYou(), Videos()

### Community 19 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 20 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 21 - "Index.tsx"
Cohesion: 0.22
Nodes (3): useUser(), Index(), RAIL_STEPS

### Community 22 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 23 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 24 - "App.tsx"
Cohesion: 0.28
Nodes (4): queryClient, Toaster(), ToasterProps, NotFound()

### Community 25 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 26 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 27 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 28 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 29 - "select.tsx"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 30 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 31 - "IncomeCalculator.tsx"
Cohesion: 0.43
Nodes (5): formatTrainingTime(), IncomeCalculator(), LevelId, LEVELS, Slider

### Community 32 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 34 - "FAQSection.tsx"
Cohesion: 0.53
Nodes (4): FAQSection(), AccordionContent, AccordionItem, AccordionTrigger

### Community 36 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 37 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 38 - "response.go"
Cohesion: 0.67
Nodes (3): Context, RespondError(), RespondSuccess()

### Community 39 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 40 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

## Knowledge Gaps
- **348 isolated node(s):** `monetizeai-backend`, `Video`, `ippanelPatternRequest`, `$schema`, `style` (+343 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `carousel.tsx`, `clsx`, `cmdk`, `date-fns`, `embla-carousel-react`, `framer-motion`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next-themes`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `react-router-dom`, `recharts`, `sonner`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `vaul`, `zod`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `dependencies`, `sidebar.tsx`, `RegistrationForm.tsx`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `sidebar.tsx`, `carousel.tsx`, `AdminDashboard.tsx`, `hooks/use-toast.ts`, `button.tsx`, `utils.ts`, `command.tsx`, `Videos.tsx`, `RegistrationForm.tsx`, `menubar.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `select.tsx`, `IncomeCalculator.tsx`, `toggle-group.tsx`, `FAQSection.tsx`, `alert.tsx`, `input-otp.tsx`, `avatar.tsx`, `badge.tsx`, `radio-group.tsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **What connects `monetizeai-backend`, `Video`, `ippanelPatternRequest` to the rest of the system?**
  _348 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05204872646733112 - nodes in this community are weakly interconnected._
- **Should `carousel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._