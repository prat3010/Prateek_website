# **18. Codebase Modernization and Refactoring**

## **Purpose**

This specification defines standard practices for maintaining clean code, managing the React 19 & Next.js 16 environment, and handling necessary refactoring. The goal is to evolve the application with minimal disruption, high stability, and zero technical debt.

---

# **React 19 & Next.js 16 Best Practices**

Upgrading frameworks changes render behavior. Developers and AI agents must follow these architectural rules:

### **1. Management of Synchronous Effects**
* **The Problem**: Calling `setState` synchronously within a `useEffect` body (e.g., setting loaded flags, error states, or parsing local storage values during initial mount) triggers rendering cascades, slowing the user experience.
* **The Solution**: Derive states dynamically, initialize states lazily using initializer functions inside `useState`, or process states in event handlers and user action callbacks instead of post-render hooks:
  ```typescript
  // BAD: Triggers cascading render
  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'noir');
  }, []);

  // GOOD: Lazy state initialization
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'noir';
    }
    return 'noir';
  });
  ```

### **2. Data Loading Model**
* **Server Components**: Prefer Server Components for fetching database data (via `src/lib/data.ts`). This allows static/dynamic database fetches to occur close to the database and eliminates browser database network calls.
* **Client Components**: Restrict client components to user interaction layers (toggles, forms, canvas rendering). Propagate loaded data from Server Components as initial properties, or wrap components inside React 19 Suspense boundaries.

---

# **CSS Modules Modularity Rule**

To avoid styling pollution:
* **Enforced Encapsulation**: Styling modifications must happen in component-specific CSS Modules (`.module.css`).
* **Banned Patterns**: 
  * Do not append arbitrary CSS classes or utilities directly to `src/app/globals.css`.
  * Avoid inline styles (`style={{ ... }}`) inside React components unless managing dynamic values (such as Framer Motion calculations or coordinate properties).

---

# **Technical Debt and Modernization Focus**

During the transition to version 2, developers must actively clean up stale resources:
1. **Dead Code**: Remove unused files, abandoned route handlers, and obsolete CSS classes.
2. **Stale Cache Types**: If type check commands (`tsc`) fail with cache references pointing to deleted or renamed paths inside `.next/types/...`, clean the compilation cache:
   ```bash
   rm -rf .next && npx tsc --noEmit
   ```
3. **No Broad Refactors**: Do not initiate broad, sweeping code refactors across components unless the task explicitly outlines the refactoring scope. Evolve existing patterns incrementally.

---

# **Refactoring Decision Metrics**

Before proposing modifications to an existing component or utility, check if the change achieves at least one:
* **Readability**: Makes the code structure easier to read.
* **Maintainability**: Simplifies future features.
* **Performance**: Reduces bundle weight or prevents unnecessary renders.
* **Accessibility**: Fixes critical usability issues.

If none are met, keep the original implementation intact.

---

# **Acceptance Criteria**
- No synchronous state changes occur within `useEffect` bodies.
- Static and database data loading is driven by Server Components.
- Styles are encapsulated in CSS Modules; globals remain untouched.
- Cleanups are executed before production releases to ensure no dead resources persist.
