## 1. Home entry interactions

- [x] 1.1 Update the client home banner component so tapping a banner opens `uni.previewImage` with the current banner list and skips empty-image entries.
- [x] 1.2 Fix the recommendation card "立即预约" interaction so the button and card handlers do not trigger duplicate or unintended bubbling behavior.

## 2. Booking form updates

- [x] 2.1 Replace the booking page payment method action sheet with inline single-select payment options that always show the current choice.
- [x] 2.2 Extend the booking page vehicle picker with an explicit edit action for each saved vehicle and keep edit taps isolated from row selection.
- [x] 2.3 Update booking-page vehicle presentation to prioritize license plate and hide or de-emphasize brand, model, and color.
- [x] 2.4 Add `callName` and `phone` inputs to the booking flow, wire them into page state, and enforce `licensePlate`, `callName`, and `phone` as required before submission.
- [x] 2.5 Extend the order creation request typing and submission payload so booking sends the new owner contact fields together with the existing order data.

## 3. Downstream order visibility

- [x] 3.1 Extend order detail and todo-list TypeScript interfaces to include `callName` and `phone` with safe fallback handling for historical data.
- [x] 3.2 Update the client order detail page to show `callName` and `phone` and to prioritize license plate over brand-model-color metadata.
- [x] 3.3 Update the staff and manager todo cards to display license plate, `callName`, and `phone` in a readable layout without breaking existing navigation behavior.

## 4. Verification

- [x] 4.1 Run the relevant project checks for the touched files and resolve any typing or lint issues introduced by the change.
- [ ] 4.2 Manually verify the end-to-end flow for banner preview, booking submission validation, vehicle editing, order detail display, and todo card display.
