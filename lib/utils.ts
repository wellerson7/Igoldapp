// lib/utils.ts

/**
 * Concatena classes Condicionalmente.
 * Exemplo: cn("p-4", isActive && "bg-blue-500", "rounded")
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
  }
  