## Context

This change spans multiple user-facing surfaces in the UniApp client: the home page, booking page, order detail page, and the staff and manager todo lists. The current implementation already contains the relevant entry points and data models, but interaction patterns are inconsistent: the home banner is display-only, payment selection relies on an action sheet, the recommendation card button uses nested click handlers, and the booking flow only works with vehicle data returned from the saved vehicle record. At the same time, downstream order views still emphasize vehicle brand/model/color instead of the owner identity data that staff now need during fulfillment.

The existing code suggests the booking page submits orders through `submitCarOrder`, order details read from `getOrderDetail` / `getOrderDetailBySn`, and staff home data comes from `getStaffHome`. Vehicle data is typed centrally in `UserVehicleService/interfaces.ts`, while order-facing data is typed in `OrderService/interfaces.ts`. The design therefore needs to keep UI and data model updates aligned across these shared interfaces.

## Goals / Non-Goals

**Goals:**

- Add a full-screen preview path for home banners without changing how banner data is fetched.
- Make booking-page payment choice directly visible and single-selectable in-page.
- Ensure the recommendation-card booking CTA triggers exactly one booking navigation path.
- Let users edit a selected vehicle from the booking vehicle picker without leaving the booking context ambiguous.
- Shift booking/order/todo displays toward the required owner identity fields: license plate, `callName`, and `phone`.
- Enforce required booking submission fields so the data shown downstream is not partially missing.

**Non-Goals:**

- Redesign the overall home page layout, booking page structure, or order detail information architecture beyond the requested fields.
- Introduce new backend services, new dependencies, or a new state management pattern.
- Change vehicle management outside the flows directly touched by booking and downstream order display.

## Decisions

### 1. Use native image preview for home banners

The home page already receives banner image URLs and other pages in the app use `uni.previewImage` for full-screen viewing. Reusing the same native preview keeps the change minimal and consistent with existing image interactions.

Alternative considered: creating a custom full-screen banner modal. This was rejected because it adds UI state, duplicated gesture behavior, and more maintenance for a capability already provided by the platform.

### 2. Replace payment action sheet with inline radio-style selection

The booking page is a form and payment choice is a small fixed set of mutually exclusive options. Inline single-select cards or radio rows reduce taps, keep the current choice visible, and match the requirement to stop using a select-like interaction.

Alternative considered: keeping the action sheet and only restyling the trigger. This was rejected because it does not change the underlying interaction problem and still hides the current options until an extra click.

### 3. Keep vehicle editing inside the booking picker via explicit edit actions

The vehicle popup already lists saved vehicles and has an add-entry action. The least disruptive extension is to add an edit affordance on each vehicle row that navigates to the existing vehicle edit page with the target vehicle id. Selection and editing must use separate click targets so editing does not accidentally select the row.

Alternative considered: forcing users to leave booking and manage vehicles from a separate profile page. This was rejected because it breaks the booking flow and does not satisfy the requirement to edit from the "选择车辆" step.

### 4. Treat owner identity as order-level booking data

The requirement explicitly asks to hide vehicle brand/model/color and make `licensePlate`, `callName`, and `phone` required. Because order detail and todo pages also need these fields, the booking flow should submit them as order-facing data rather than relying only on the saved vehicle object. Interfaces that back order creation, order detail, and todo items should therefore be extended to carry these fields explicitly.

Alternative considered: deriving `callName` and `phone` from the user profile at display time. This was rejected because the requested behavior matches Meituan-style service-contact capture and may differ from the logged-in account profile.

### 5. Update downstream displays with progressive data fallback

Order detail and todo pages should prefer order-level `callName` and `phone` when present, while keeping safe placeholders for older or partially populated records. This avoids breaking existing data and lets the UI remain stable before all new orders carry the additional fields.

Alternative considered: hiding the new fields unless all API payloads are updated simultaneously. This was rejected because it creates an all-or-nothing rollout and increases coordination risk.

## Risks / Trade-offs

- [Backend payloads may not yet include `callName` and `phone` everywhere] → Extend TypeScript interfaces carefully and keep UI fallback values (`--` or empty display) so older records still render.
- [Editing inside a selectable vehicle row can reintroduce bubbling issues] → Use dedicated edit targets with explicit event stopping so row selection and edit navigation stay separate.
- [Inline payment options take more vertical space than a single trigger row] → Keep the option set compact and use the existing section card to avoid layout sprawl.
- [Banner preview depends on URL quality from backend data] → Reuse the already rendered image URLs and guard preview calls against empty lists.

## Migration Plan

1. Update the booking page UI and request model to collect and submit the new owner identity fields.
2. Extend order detail and todo-list interfaces to read `callName` and `phone` when returned.
3. Update the downstream UI to show new fields with graceful fallback for historical orders.
4. Release the home-entry interaction fixes independently if needed because they do not depend on order data migration.

Rollback is straightforward: the UI changes can be reverted without data migration, and newly added fields can remain unused if backend support is delayed.

## Open Questions

- Whether the backend order creation endpoint already accepts `callName` and `phone` or needs a coordinated API update.
- Whether the booking page should prefill `phone` from the current user profile when available, or start blank and require explicit confirmation.
- Whether the todo lists need to display both `callName` and `phone` directly in the card body, or only surface them in a secondary line when present.
