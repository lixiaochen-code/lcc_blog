## Context

The vehicle edit page already provides manual phone input and a shortcut button that fills the current user's mobile number into the phone field. The behavior depends only on client-side store data from `userStore.userData.mobile`; there is no separate API lookup or authorization step involved. The requested change is to make the shortcut disappear entirely when the current profile has no mobile number while keeping manual entry fully available.

## Goals / Non-Goals

**Goals:**

- Show the shortcut only when `userStore.userData.mobile` is truthy and usable.
- Keep phone input editable regardless of shortcut visibility.
- Avoid introducing any new account-binding or phone-authorization flow into the vehicle page.

**Non-Goals:**

- Changing vehicle form validation rules.
- Fetching or binding a phone number from outside the existing user store.
- Modifying APIs, persistence, or order submission behavior.

## Decisions

### 1. Use store-backed conditional rendering

The shortcut button should continue to rely on `userStore.userData.mobile` because that is the existing source of truth for the current account mobile number. Conditional rendering based on that single value keeps the implementation minimal and deterministic.

Alternative considered: always rendering a disabled button when no mobile exists. This was rejected because the requirement explicitly prefers hiding the shortcut when it cannot be used.

### 2. Keep manual input independent of shortcut visibility

The phone input remains visible and editable in all cases. The shortcut is only an optional convenience and must not become a prerequisite for completing the form.

Alternative considered: showing a placeholder prompt or account-binding CTA when no mobile exists. This was rejected because it adds unrelated account-flow behavior to a simple vehicle edit page.

## Risks / Trade-offs

- [Store data may be temporarily empty before refresh] → The button will stay hidden until `userData.mobile` is available, which is acceptable because manual input remains available.
- [Whitespace or invalid mobile strings in store data] → Guard against empty-like values before rendering the shortcut.

## Migration Plan

No migration is required. This is a client-only rendering adjustment and can be rolled back by restoring the previous visibility condition.

## Open Questions

- Whether whitespace-only mobile strings can appear in `userStore.userData.mobile`, or whether upstream store normalization already prevents that.
