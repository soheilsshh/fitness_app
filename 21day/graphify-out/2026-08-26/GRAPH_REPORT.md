# Graph Report - 21day  (2026-08-24)

## Corpus Check
- 115 files · ~66,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 768 nodes · 1002 edges · 98 communities (47 shown, 51 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2f7e4033`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- sidebar.tsx
- carousel.tsx
- mysql.go
- AdminDashboard.tsx
- hooks/use-toast.ts
- compilerOptions
- button.tsx
- Videos.tsx
- utils.ts
- compilerOptions
- command.tsx
- API Integration Documentation
- components.json
- Index.tsx
- admin_controller.go
- dependencies
- input-otp.tsx
- form.tsx
- menubar.tsx
- compilerOptions
- مستند UI و فلوهای چالش ۲۱ روزه فیتینو
- context-menu.tsx
- dropdown-menu.tsx
- card.tsx
- alert-dialog.tsx
- breadcrumb.tsx
- cn
- navigation-menu.tsx
- select.tsx
- Welcome to your Lovable project
- chart.tsx
- badge.tsx
- tabs.tsx
- SessionQuiz.tsx
- toggle-group.tsx
- alert.tsx
- radio-group.tsx
- response.go
- avatar.tsx
- AdminSession
- Progress
- User
- CountdownTimer.tsx
- TopCountdownTimer.tsx
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
4. `Button` - 11 edges
5. `useToast()` - 10 edges
6. `ApiService` - 10 edges
7. `مستند UI و فلوهای چالش ۲۱ روزه فیتینو` - 10 edges
8. `compilerOptions` - 9 edges
9. `react` - 8 edges
10. `useUser()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `useToast()` --references--> `react`  [EXTRACTED]
  src/hooks/use-toast.ts → package.json

## Import Cycles
- None detected.

## Communities (98 total, 51 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.04
Nodes (45): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, lovable-tagger, devDependencies (+37 more)

### Community 1 - "sidebar.tsx"
Cohesion: 0.05
Nodes (42): react, react, useCarousel(), useChart(), useFormField(), Separator, SheetContent, SheetContentProps (+34 more)

### Community 2 - "carousel.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 3 - "mysql.go"
Cohesion: 0.08
Nodes (28): LoadConfig(), GetAdminUsersCSV(), Context, RegisterUser(), writeUsersCSV(), CompleteVideo(), GetUserProgress(), GetVideos() (+20 more)

### Community 4 - "AdminDashboard.tsx"
Cohesion: 0.06
Nodes (35): queryClient, ErrorBoundary, Props, State, FitinoBrandMark(), FitinoBrandMarkProps, Button, Input (+27 more)

### Community 5 - "hooks/use-toast.ts"
Cohesion: 0.11
Nodes (25): NEXT_STEPS, RegistrationForm(), Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+16 more)

### Community 7 - "button.tsx"
Cohesion: 0.18
Nodes (12): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+4 more)

### Community 8 - "Videos.tsx"
Cohesion: 0.10
Nodes (20): LoadingSpinner(), LoadingSpinnerProps, pad(), TimeLeft, VideoCountdownTimer(), useUser(), ApiService, Progress (+12 more)

### Community 9 - "utils.ts"
Cohesion: 0.11
Nodes (10): Checkbox, HoverCardContent, PopoverContent, Progress, ScrollArea, ScrollBar, Slider, Switch (+2 more)

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

### Community 14 - "Index.tsx"
Cohesion: 0.09
Nodes (18): CountdownSection(), FAQSection(), FitinoPageShell(), FitinoPageShellProps, formatTrainingTime(), IncomeCalculator(), LevelId, LEVELS (+10 more)

### Community 15 - "admin_controller.go"
Cohesion: 0.27
Nodes (13): AdminAuthMiddleware(), AdminLogin(), AdminLogout(), extractBearerToken(), generateAdminToken(), GetAdminStats(), GetAdminUsersList(), Context (+5 more)

### Community 16 - "dependencies"
Cohesion: 0.15
Nodes (13): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-accordion, @radix-ui/react-dialog, @radix-ui/react-navigation-menu, @radix-ui/react-popover, @radix-ui/react-tabs (+5 more)

### Community 17 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 18 - "form.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 19 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 20 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 21 - "مستند UI و فلوهای چالش ۲۱ روزه فیتینو"
Cohesion: 0.07
Nodes (29): تب‌ها, جدول کاربران, فلو A — بازدیدکننده → ثبت‌نام, فلو B — کاربر برگشتی (قبلاً ثبت‌نام کرده), فلو C — تماشا و پیشرفت در آکادمی, فلو D — باز کردن جلسه بعدی با آزمون, فلو E — خروج کاربر, فلو F — اتمام پنجره ۷۲ ساعته (+21 more)

### Community 22 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 23 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 24 - "card.tsx"
Cohesion: 0.25
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 25 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 26 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 27 - "cn"
Cohesion: 0.20
Nodes (10): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle, ResizableHandle(), ResizablePanelGroup() (+2 more)

### Community 28 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 29 - "select.tsx"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 30 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 31 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 32 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 33 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 34 - "SessionQuiz.tsx"
Cohesion: 0.27
Nodes (7): Phase, SessionQuiz(), SessionQuizProps, getSessionQuiz(), QuizOption, QuizQuestion, SESSION_QUIZZES

### Community 35 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 36 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 38 - "response.go"
Cohesion: 0.67
Nodes (3): Context, RespondError(), RespondSuccess()

### Community 39 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **384 isolated node(s):** `monetizeai-backend`, `Video`, `ippanelPatternRequest`, `$schema`, `style` (+379 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `sidebar.tsx`, `clsx`, `cmdk`, `date-fns`, `embla-carousel-react`, `framer-motion`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next-themes`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `react-router-dom`, `recharts`, `sonner`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `vaul`, `zod`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `react` connect `sidebar.tsx` to `dependencies`, `hooks/use-toast.ts`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `sidebar.tsx`, `carousel.tsx`, `AdminDashboard.tsx`, `hooks/use-toast.ts`, `button.tsx`, `utils.ts`, `command.tsx`, `Index.tsx`, `input-otp.tsx`, `form.tsx`, `menubar.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `card.tsx`, `alert-dialog.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `select.tsx`, `chart.tsx`, `badge.tsx`, `tabs.tsx`, `toggle-group.tsx`, `alert.tsx`, `radio-group.tsx`, `avatar.tsx`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **What connects `monetizeai-backend`, `Video`, `ippanelPatternRequest` to the rest of the system?**
  _384 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04717853839037928 - nodes in this community are weakly interconnected._
- **Should `mysql.go` be split into smaller, more focused modules?**
  _Cohesion score 0.07539118065433854 - nodes in this community are weakly interconnected._